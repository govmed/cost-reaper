import { createPublicKey, createVerify, randomBytes } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import type { OidcConfig, SamlConfig, SsoConfig, SsoProtocol, WsFedConfig } from './sso-config';

/** The identity an SSO provider resolves from a successful login. */
export interface SsoIdentity {
  email: string;
  displayName: string | null;
}

/** Pluggable SSO strategy (NFR-15) — one per protocol, chosen by config. */
export interface SsoProvider {
  readonly protocol: SsoProtocol;
  /** Absolute URL to redirect the browser to, to begin login at the IdP. */
  getLoginUrl(state: string): Promise<string>;
  /** Resolve the authenticated identity from the IdP's callback params. */
  handleCallback(params: Record<string, string | undefined>): Promise<SsoIdentity>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function decodeJwtClaims(jwt: string): Record<string, unknown> {
  const payload = jwt.split('.')[1] ?? '';
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
}

function emailFrom(claims: Record<string, unknown>): string | null {
  const v = claims.email ?? claims.preferred_username ?? claims.upn ?? claims.unique_name;
  return typeof v === 'string' ? v : null;
}

/** Wrap a bare base64 DER cert body in PEM headers if needed. */
function toPem(cert: string): string {
  const c = cert.trim();
  if (c.includes('BEGIN CERTIFICATE')) return c;
  const body =
    c
      .replace(/\s+/g, '')
      .match(/.{1,64}/g)
      ?.join('\n') ?? c;
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

/**
 * Best-effort RSA-SHA256 verification of an enveloped XML-DSig signature against
 * the IdP certificate. NOTE: XML canonicalization (C14N) is simplified — it uses
 * the on-the-wire `<SignedInfo>` bytes, which matches many IdPs but not all.
 * For hardened production SAML/WS-Fed, front the IdP via its OIDC endpoint or add
 * a vetted XML-DSig library. Returns false (reject) on anything it can't verify.
 */
export function verifyXmlSignature(xml: string, certPem: string): boolean {
  try {
    const signedInfo = xml.match(/<(?:\w+:)?SignedInfo[\s\S]*?<\/(?:\w+:)?SignedInfo>/)?.[0];
    const sigValue = xml
      .match(/<(?:\w+:)?SignatureValue[^>]*>([\s\S]*?)<\/(?:\w+:)?SignatureValue>/)?.[1]
      ?.replace(/\s+/g, '');
    if (!signedInfo || !sigValue) return false;
    const key = createPublicKey(toPem(certPem));
    return createVerify('RSA-SHA256').update(signedInfo, 'utf8').verify(key, sigValue, 'base64');
  } catch {
    return false;
  }
}

function extractSamlEmail(xml: string): string | null {
  // <NameID>…</NameID>, or an email/emailaddress <Attribute><AttributeValue>.
  const nameId = xml.match(/<(?:\w+:)?NameID[^>]*>([\s\S]*?)<\/(?:\w+:)?NameID>/)?.[1]?.trim();
  if (nameId && nameId.includes('@')) return nameId;
  const attr = xml
    .match(
      /Name="[^"]*email(?:address)?"[^>]*>\s*<(?:\w+:)?AttributeValue[^>]*>([\s\S]*?)<\/(?:\w+:)?AttributeValue>/i,
    )?.[1]
    ?.trim();
  return attr ?? (nameId && nameId.includes('@') ? nameId : null);
}

// ── OIDC (fully functional, dependency-free) ─────────────────────────────────

class OidcProvider implements SsoProvider {
  readonly protocol = 'OIDC' as const;
  private discovery?: {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint?: string;
  };

  constructor(private readonly cfg: OidcConfig) {}

  private async discover() {
    if (!this.discovery) {
      this.discovery = await fetchJson(`${this.cfg.issuer}/.well-known/openid-configuration`);
    }
    return this.discovery;
  }

  async getLoginUrl(state: string): Promise<string> {
    const d = await this.discover();
    const q = new URLSearchParams({
      response_type: 'code',
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: this.cfg.scopes,
      state,
    });
    return `${d.authorization_endpoint}?${q.toString()}`;
  }

  async handleCallback(params: Record<string, string | undefined>): Promise<SsoIdentity> {
    const code = params.code;
    if (!code) throw new Error('Missing authorization code');
    const d = await this.discover();
    const tokens = await fetchJson<{ id_token?: string; access_token?: string }>(d.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.cfg.redirectUri,
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      }).toString(),
    });
    let claims: Record<string, unknown> = tokens.id_token ? decodeJwtClaims(tokens.id_token) : {};
    let email = emailFrom(claims);
    if (!email && tokens.access_token && d.userinfo_endpoint) {
      claims = await fetchJson(d.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      email = emailFrom(claims);
    }
    if (!email) throw new Error('No email claim from OIDC provider');
    const name = claims.name;
    return { email, displayName: typeof name === 'string' ? name : null };
  }
}

// ── SAML 2.0 (HTTP-Redirect login; assertion parse + signature check) ────────

class SamlProvider implements SsoProvider {
  readonly protocol = 'SAML' as const;
  constructor(private readonly cfg: SamlConfig) {}

  async getLoginUrl(state: string): Promise<string> {
    const id = `_${randomBytes(16).toString('hex')}`;
    const instant = new Date().toISOString();
    const req =
      `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ` +
      `ID="${id}" Version="2.0" IssueInstant="${instant}" ` +
      `AssertionConsumerServiceURL="${this.cfg.callbackUrl}" Destination="${this.cfg.entryPoint}">` +
      `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.cfg.issuer}</saml:Issuer>` +
      `</samlp:AuthnRequest>`;
    const encoded = deflateRawSync(Buffer.from(req, 'utf8')).toString('base64');
    const q = new URLSearchParams({ SAMLRequest: encoded, RelayState: state });
    return `${this.cfg.entryPoint}?${q.toString()}`;
  }

  async handleCallback(params: Record<string, string | undefined>): Promise<SsoIdentity> {
    const raw = params.SAMLResponse;
    if (!raw) throw new Error('Missing SAMLResponse');
    const xml = Buffer.from(raw, 'base64').toString('utf8');
    if (!this.cfg.allowUnverified && !verifyXmlSignature(xml, this.cfg.idpCert)) {
      throw new Error('SAML signature verification failed');
    }
    const email = extractSamlEmail(xml);
    if (!email) throw new Error('No email/NameID in SAML assertion');
    return { email, displayName: null };
  }
}

// ── WS-Federation (passive requestor) ────────────────────────────────────────

class WsFedProvider implements SsoProvider {
  readonly protocol = 'WSFED' as const;
  constructor(private readonly cfg: WsFedConfig) {}

  async getLoginUrl(state: string): Promise<string> {
    const q = new URLSearchParams({
      wa: 'wsignin1.0',
      wtrealm: this.cfg.realm,
      wreply: this.cfg.replyUrl,
      wctx: state,
    });
    return `${this.cfg.loginUrl}?${q.toString()}`;
  }

  async handleCallback(params: Record<string, string | undefined>): Promise<SsoIdentity> {
    const wresult = params.wresult;
    if (!wresult) throw new Error('Missing wresult');
    // wresult is a RequestSecurityTokenResponse wrapping a SAML assertion.
    if (!this.cfg.allowUnverified && !verifyXmlSignature(wresult, this.cfg.idpCert)) {
      throw new Error('WS-Fed signature verification failed');
    }
    const email =
      extractSamlEmail(wresult) ??
      wresult.match(/emailaddress[^>]*>\s*<[^>]*>([^<]+@[^<]+)</i)?.[1]?.trim() ??
      null;
    if (!email) throw new Error('No email claim in WS-Fed token');
    return { email, displayName: null };
  }
}

/** Build the active provider from the resolved config (null when SSO is off). */
export function createSsoProvider(config: SsoConfig): SsoProvider | null {
  if (!config.enabled) return null;
  switch (config.protocol) {
    case 'OIDC':
      return new OidcProvider(config.oidc);
    case 'SAML':
      return new SamlProvider(config.saml);
    case 'WSFED':
      return new WsFedProvider(config.wsfed);
  }
}
