# ADR 0008 — Config-driven SSO (OIDC / SAML / WS-Fed)

**Status:** Accepted — 2026-06-14

## Context

FR-26 lists SSO (SAML/OIDC/OIDC-WS-Fed) as a post-MVP identity option. We want it
**simple to configure** — one switch picks the protocol — and **safe** (no auth
bypass, no half-enabled IdP), without adding heavy third-party dependencies.

## Decision

- A single, flat **config block** (`SSO_ENABLED`, `SSO_PROTOCOL`, `SSO_DISPLAY_NAME`,
  plus a tiny per-protocol section). A pure `resolveSsoConfig(env)` **dispatcher**
  reads the env and decides which provider is active; it **fails closed** (disabled
  + a reason) when off or misconfigured. Unit-tested.
- A pluggable `SsoProvider` strategy (NFR-15) with one implementation per protocol,
  built by `createSsoProvider(config)`. Endpoints: `GET /auth/sso` (status),
  `GET /auth/sso/login` (redirect to IdP), `GET|POST /auth/sso/callback`
  (→ provision user with least privilege VIEWER → issue our JWTs → hand tokens to
  the SPA via the URL fragment).
- **OIDC** is fully implemented dependency-free (well-known discovery + auth-code
  exchange + userinfo via `fetch`). **SAML 2.0** and **WS-Federation** build the
  login redirect and parse the assertion; signature verification is a best-effort
  RSA-SHA256 check against the configured IdP cert.

## Consequences

- Password login is unaffected; SSO is **off by default**.
- SAML/WS-Fed XML-DSig verification is **simplified** (C14N is approximated). For
  hardened production SAML/WS-Fed, front the IdP via its OIDC endpoint or add a
  vetted XML-DSig library; `SSO_*_ALLOW_UNVERIFIED` (default false) is dev-only.
- New SSO users are provisioned as VIEWER; an admin promotes them as needed.
