/**
 * Identity configuration (FR-26). ONE switch picks the identity system:
 * `LOCAL` uses the app's own built-in username/password identity; `OIDC`,
 * `SAML`, or `WSFED` delegate to an external SSO provider. Each external
 * protocol has a tiny, flat set of env vars. This module is the dispatcher: it
 * reads the env and decides which identity system is active. Pure & unit-tested.
 */

export type SsoProtocol = 'OIDC' | 'SAML' | 'WSFED';
/** The selected identity system — built-in or one external SSO protocol. */
export type IdentityMode = 'LOCAL' | SsoProtocol;

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
  | { enabled: false; mode: 'LOCAL'; reason?: string }
  | {
      enabled: true;
      mode: 'OIDC';
      protocol: 'OIDC';
      displayName: string;
      forceSso: boolean;
      oidc: OidcConfig;
    }
  | {
      enabled: true;
      mode: 'SAML';
      protocol: 'SAML';
      displayName: string;
      forceSso: boolean;
      saml: SamlConfig;
    }
  | {
      enabled: true;
      mode: 'WSFED';
      protocol: 'WSFED';
      displayName: string;
      forceSso: boolean;
      wsfed: WsFedConfig;
    };

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
 * Read the config and determine which identity system to use. `LOCAL` (the
 * built-in identity) is the default and is selected when `SSO_PROTOCOL=LOCAL`,
 * when `SSO_ENABLED` is explicitly off, or when no protocol is chosen. An
 * external protocol is returned only when fully configured — otherwise we fall
 * back to LOCAL (with a reason), so the app never half-enables an IdP.
 */
export function resolveSsoConfig(env: Env = process.env): SsoConfig {
  const protocol = val(env, 'SSO_PROTOCOL').toUpperCase();
  const masterOff = env.SSO_ENABLED !== undefined && !truthy(env.SSO_ENABLED);

  // Built-in identity: explicit LOCAL/BUILTIN/NONE, master switch off, or unset.
  if (['LOCAL', 'BUILTIN', 'NONE', ''].includes(protocol) || masterOff) {
    return { enabled: false, mode: 'LOCAL' };
  }

  const displayName = val(env, 'SSO_DISPLAY_NAME') || 'Single Sign-On';
  // When true, the built-in password form is hidden and SSO is the only option.
  const forceSso = truthy(env.SSO_FORCE);

  switch (protocol) {
    case 'OIDC': {
      const need = missing(env, [
        'SSO_OIDC_ISSUER',
        'SSO_OIDC_CLIENT_ID',
        'SSO_OIDC_CLIENT_SECRET',
        'SSO_OIDC_REDIRECT_URI',
      ]);
      if (need.length)
        return { enabled: false, mode: 'LOCAL', reason: `OIDC missing: ${need.join(', ')}` };
      return {
        enabled: true,
        mode: 'OIDC',
        protocol: 'OIDC',
        displayName,
        forceSso,
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
      if (need.length)
        return { enabled: false, mode: 'LOCAL', reason: `SAML missing: ${need.join(', ')}` };
      return {
        enabled: true,
        mode: 'SAML',
        protocol: 'SAML',
        displayName,
        forceSso,
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
      if (need.length)
        return { enabled: false, mode: 'LOCAL', reason: `WSFED missing: ${need.join(', ')}` };
      return {
        enabled: true,
        mode: 'WSFED',
        protocol: 'WSFED',
        displayName,
        forceSso,
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
        mode: 'LOCAL',
        reason: `Unknown SSO_PROTOCOL '${protocol}' (use LOCAL, OIDC, SAML, or WSFED)`,
      };
  }
}
