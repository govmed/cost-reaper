/**
 * Single Sign-On configuration (FR-26 extension). One simple switch picks the
 * protocol; each protocol has a tiny, flat set of env vars. This module is the
 * dispatcher: it reads the env and decides **which** provider (if any) is active.
 * Pure & unit-tested — no I/O.
 */

export type SsoProtocol = 'OIDC' | 'SAML' | 'WSFED';

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}
export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  callbackUrl: string;
  idpCert: string;
  allowUnverified: boolean;
}
export interface WsFedConfig {
  loginUrl: string;
  realm: string;
  replyUrl: string;
  idpCert: string;
  allowUnverified: boolean;
}

export type SsoConfig =
  | { enabled: false; reason?: string }
  | { enabled: true; protocol: 'OIDC'; displayName: string; oidc: OidcConfig }
  | { enabled: true; protocol: 'SAML'; displayName: string; saml: SamlConfig }
  | { enabled: true; protocol: 'WSFED'; displayName: string; wsfed: WsFedConfig };

type Env = Record<string, string | undefined>;

function truthy(v: string | undefined): boolean {
  return v === 'true' || v === '1' || v === 'yes';
}
function val(env: Env, key: string): string {
  return (env[key] ?? '').trim();
}
/** Names the env vars that are required but empty, for a clear "why disabled" reason. */
function missing(env: Env, keys: string[]): string[] {
  return keys.filter((k) => !val(env, k));
}

/**
 * Read the SSO config and determine which single protocol to use.
 * Returns `{ enabled: false }` (with a reason) when off or misconfigured, so the
 * app never half-enables an identity provider.
 */
export function resolveSsoConfig(env: Env = process.env): SsoConfig {
  if (!truthy(env.SSO_ENABLED)) return { enabled: false };

  const protocol = val(env, 'SSO_PROTOCOL').toUpperCase();
  const displayName = val(env, 'SSO_DISPLAY_NAME') || 'Single Sign-On';

  switch (protocol) {
    case 'OIDC': {
      const need = missing(env, [
        'SSO_OIDC_ISSUER',
        'SSO_OIDC_CLIENT_ID',
        'SSO_OIDC_CLIENT_SECRET',
        'SSO_OIDC_REDIRECT_URI',
      ]);
      if (need.length) return { enabled: false, reason: `OIDC missing: ${need.join(', ')}` };
      return {
        enabled: true,
        protocol: 'OIDC',
        displayName,
        oidc: {
          issuer: val(env, 'SSO_OIDC_ISSUER').replace(/\/$/, ''),
          clientId: val(env, 'SSO_OIDC_CLIENT_ID'),
          clientSecret: val(env, 'SSO_OIDC_CLIENT_SECRET'),
          redirectUri: val(env, 'SSO_OIDC_REDIRECT_URI'),
          scopes: val(env, 'SSO_OIDC_SCOPES') || 'openid email profile',
        },
      };
    }
    case 'SAML': {
      const need = missing(env, [
        'SSO_SAML_ENTRY_POINT',
        'SSO_SAML_CALLBACK_URL',
        'SSO_SAML_IDP_CERT',
      ]);
      if (need.length) return { enabled: false, reason: `SAML missing: ${need.join(', ')}` };
      return {
        enabled: true,
        protocol: 'SAML',
        displayName,
        saml: {
          entryPoint: val(env, 'SSO_SAML_ENTRY_POINT'),
          issuer: val(env, 'SSO_SAML_ISSUER') || 'cost-reaper',
          callbackUrl: val(env, 'SSO_SAML_CALLBACK_URL'),
          idpCert: val(env, 'SSO_SAML_IDP_CERT'),
          allowUnverified: truthy(env.SSO_SAML_ALLOW_UNVERIFIED),
        },
      };
    }
    case 'WSFED': {
      const need = missing(env, [
        'SSO_WSFED_LOGIN_URL',
        'SSO_WSFED_REPLY_URL',
        'SSO_WSFED_IDP_CERT',
      ]);
      if (need.length) return { enabled: false, reason: `WSFED missing: ${need.join(', ')}` };
      return {
        enabled: true,
        protocol: 'WSFED',
        displayName,
        wsfed: {
          loginUrl: val(env, 'SSO_WSFED_LOGIN_URL'),
          realm: val(env, 'SSO_WSFED_REALM') || 'cost-reaper',
          replyUrl: val(env, 'SSO_WSFED_REPLY_URL'),
          idpCert: val(env, 'SSO_WSFED_IDP_CERT'),
          allowUnverified: truthy(env.SSO_WSFED_ALLOW_UNVERIFIED),
        },
      };
    }
    default:
      return {
        enabled: false,
        reason: protocol
          ? `Unknown SSO_PROTOCOL '${protocol}' (use OIDC, SAML, or WSFED)`
          : 'SSO_PROTOCOL not set',
      };
  }
}
