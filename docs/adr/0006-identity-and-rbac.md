# ADR-0006 — Identity management & deny-by-default RBAC

- **Status:** Accepted (2026-06-12)
- **Context:** The product handles commercially sensitive financial data (BR-8) and needs first-class **identity management and role security** (FR-1, FR-2, FR-26, NFR-4, NFR-16).
- **Decision:** A dedicated identity module is the single choke point for authn/authz. Roles are Admin / Estimator / Viewer. Admins manage users (invite/CRUD, role assignment, activate/deactivate, credential reset, delete). Passwords hashed with **argon2**; JWT access (15 min) + refresh (7 days). Authorization is **deny-by-default**, enforced **server-side** by RBAC guards on every protected endpoint; user/role changes are audited (FR-11). SSO/SAML/OIDC and fine-grained per-resource permissions are post-MVP seams.
- **Consequences:** Authorization is centralized and testable, not scattered. The seeded admin comes from env (`SEED_ADMIN_*`), never hardcoded.
