# ADR 0010 — Admin-defined roles & permission-based RBAC

**Status:** Proposed · **Date:** 2026-06-17 · **Requirements:** FR-30 (configurable RBAC), FR-26 (identity/RBAC), FR-29/NFR-17 (no hard-coding), NFR-16 (server-side least privilege), FR-11 (audit)

## Context

Roles today are a **hard-coded enum** — `Role = ADMIN | ESTIMATOR | VIEWER | GM` — declared as a Postgres enum + a Zod enum and enforced with role-name guards (`@Roles('ADMIN')`). Adding the GM role (PR #91) required a code change, a Prisma migration (`ALTER TYPE … ADD VALUE`), edits to the capability matrix in `roleCapabilities.ts`, and a redeploy. A user asked: _"can we make it flexible to where the admin can create new roles and modify existing roles?"_

That is the natural extension of the project's "no hard-coding" principle (FR-29/NFR-17), which already records `Role` as a still-code-coupled enum to be revisited. FR-26 also foreshadows this: _"fine-grained per-resource permissions are post-MVP."_

The blocker is that authorization is keyed on the **role name**, not on **what the role may do**. To let admins define roles without code, authorization must key on **permissions**, with roles being editable bundles of permissions.

## Decision

Adopt **permission-based RBAC** with admin-managed roles. Tracked as **FE-55** under EP-2.

1. **Permission catalog (code-defined, fixed).** A stable set of capability keys — e.g. `estimate.view`, `estimate.edit`, `workflow.advance`, `workflow.approve`, `ratecard.manage`, `users.manage`, `reference.manage`, `cloudprice.refresh`, `dashboard.view`. These are exactly the rows already enumerated in `apps/web/src/lib/roleCapabilities.ts`; that matrix becomes the seed for the catalog. Permissions are code-defined because each one corresponds to a guarded behavior in the app.
2. **Roles become data.** New tables: `roles` (code, display_name, description, is_active, is_builtin) and `role_permissions` (role_id → permission key). Baseline roles (Admin/GM/Estimator/Viewer) ship via idempotent seed mirroring the current matrix.
3. **Guards switch to permissions.** Replace `@Roles('ADMIN')` with `@RequirePermission('users.manage')`. A `PermissionsGuard` resolves the caller's role → granted permissions at request time (cached, invalidated on role edits). Deny-by-default, server-side (NFR-16). The **ADMIN super-role keeps an implicit allow-all** (see Boundary).
4. **Workflow gating by role reference.** `WorkflowTransition.allowedRole` references an active role (or, later, a permission) instead of the fixed enum — so a custom role can own "Approve."
5. **Admin Roles UI.** Extend the existing Roles & permissions page from read-only to editable: create/rename/activate-deactivate roles and toggle the permission matrix. All changes emit `AuditEvent`s (FR-11).
6. **`User.role` stays a string code** but validates against active `roles` rows (same pattern as the SDLC-phase migration under FR-29), so no per-user data migration is needed.

## Boundary (explicit, by design)

An admin can create a role, grant it any **existing** permission, and gate workflow steps to it — but **cannot invent brand-new coded behavior**. Deep behavioral couplings remain in code: the **ADMIN super-override**, `CloudProvider`→pricing-strategy, `BillingPeriod`→engine math, `ChecklistSeverity`→gating. This is the same "behavioral enums stay coded" stance already recorded in §10 of CLAUDE.md. So "create a *Reviewer* role that can approve but not edit" is fully supported; "create a role that does something the code has no concept of" still needs code.

## Consequences

- **Pro:** admins tailor governance (new roles, re-scoped permissions) with **no code change or redeploy**; authorization is centralized on permissions and more testable; the capability matrix stops being a hand-maintained mirror of the guards and becomes the single source.
- **Con / effort:** meaty refactor — every `@Roles` guard (auth, users, rate-cards, fx, reference, cloud-pricing, workflow, sow, estimates) migrates to `@RequirePermission`; needs a migration, a seed, a guard rewrite, and UI work. Blast radius is wide but mechanical; ship behind CI with the guard matrix tested.
- **Migration safety:** additive tables + seed; existing `User.role` codes map 1:1 to seeded baseline roles. Snapshots/estimates untouched.

## Status / next steps

Registered in the backlog (FR-30, FE-55, roadmap Sprint 12). **Not yet built** — implementation gated on the user's go-ahead. When built, this ADR moves to **Accepted** with a Verification section (guard matrix + Playwright RBAC smoke).
