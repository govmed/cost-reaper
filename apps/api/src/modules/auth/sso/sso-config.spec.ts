import { describe, it, expect } from 'vitest';
import { resolveSsoConfig } from './sso-config';

describe('resolveSsoConfig — picks which protocol to use', () => {
  it('uses the built-in LOCAL identity by default / when off / when chosen', () => {
    expect(resolveSsoConfig({})).toEqual({ enabled: false, mode: 'LOCAL' });
    expect(resolveSsoConfig({ SSO_ENABLED: 'false' })).toEqual({ enabled: false, mode: 'LOCAL' });
    // LOCAL wins even with the master switch on.
    expect(resolveSsoConfig({ SSO_ENABLED: 'true', SSO_PROTOCOL: 'LOCAL' })).toEqual({
      enabled: false,
      mode: 'LOCAL',
    });
  });

  it('resolves OIDC with its required fields', () => {
    const cfg = resolveSsoConfig({
      SSO_ENABLED: 'true',
      SSO_PROTOCOL: 'oidc',
      SSO_DISPLAY_NAME: 'Acme SSO',
      SSO_OIDC_ISSUER: 'https://idp.example.com/',
      SSO_OIDC_CLIENT_ID: 'cid',
      SSO_OIDC_CLIENT_SECRET: 'secret',
      SSO_OIDC_REDIRECT_URI: 'https://app/cb',
    });
    expect(cfg.enabled).toBe(true);
    if (cfg.enabled && cfg.protocol === 'OIDC') {
      expect(cfg.displayName).toBe('Acme SSO');
      expect(cfg.oidc.issuer).toBe('https://idp.example.com'); // trailing slash trimmed
      expect(cfg.oidc.scopes).toBe('openid email profile'); // default
    }
  });

  it('resolves SAML and WSFED', () => {
    const saml = resolveSsoConfig({
      SSO_ENABLED: '1',
      SSO_PROTOCOL: 'SAML',
      SSO_SAML_ENTRY_POINT: 'https://idp/sso',
      SSO_SAML_CALLBACK_URL: 'https://app/cb',
      SSO_SAML_IDP_CERT: 'CERT',
    });
    expect(saml.enabled && saml.protocol).toBe('SAML');

    const wsfed = resolveSsoConfig({
      SSO_ENABLED: 'yes',
      SSO_PROTOCOL: 'wsfed',
      SSO_WSFED_LOGIN_URL: 'https://sts/login',
      SSO_WSFED_REPLY_URL: 'https://app/cb',
      SSO_WSFED_IDP_CERT: 'CERT',
    });
    expect(wsfed.enabled && wsfed.protocol).toBe('WSFED');
  });

  it('fails closed (disabled + reason) when required fields are missing', () => {
    const cfg = resolveSsoConfig({ SSO_ENABLED: 'true', SSO_PROTOCOL: 'OIDC' });
    expect(cfg.enabled).toBe(false);
    if (!cfg.enabled) expect(cfg.reason).toContain('OIDC missing');
  });

  it('reports an unknown protocol', () => {
    const cfg = resolveSsoConfig({ SSO_ENABLED: 'true', SSO_PROTOCOL: 'LDAP' });
    expect(cfg.enabled).toBe(false);
    if (!cfg.enabled) expect(cfg.reason).toContain('Unknown SSO_PROTOCOL');
  });
});
