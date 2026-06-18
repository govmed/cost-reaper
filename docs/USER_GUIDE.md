# User Guide — cost-reaper

A step-by-step guide for end users of **cost-reaper**, the technology-project cost
estimator. It covers signing in, the roles, and building an estimate end-to-end —
from a governed rate card and cloud catalog through totals, governance, and export.

> Conventions: the web app runs at **http://localhost:5173**, the API at
> **http://localhost:8000/api/v1**. Your administrator may host these elsewhere.

## 1. Roles at a glance

| Role                     | Can do                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Admin**                | Everything below, plus manage **users**, **roles**, **rate cards**, **reference data**, the **audit log**, and pricing. |
| **GM** (General Manager) | Review and **approve** estimates (or **return them to draft**) via the workflow; **cannot create or edit** estimates.   |
| **Estimator**            | Create and edit estimates, add line items, submit through the workflow, and export.                                     |
| **Viewer**               | Read (and export) estimates they're authorized to see.                                                                  |

Access is enforced server-side (deny-by-default), so menu items you don't have
rights to simply won't appear or will be rejected.

> **Custom roles (Admins).** Roles are data-driven — under **Admin → Roles &
> permissions** an Admin can create new roles and toggle exactly which
> permissions each one grants (e.g. a "Reviewer" that can approve but not edit).
> The four above are the built-in baseline.

> **GM scope.** A GM is an approver, so their views are limited to their review
> queue:
>
> - The **Estimates** list shows only estimates that are **In Review** or **Approved**.
> - On the **Dashboard**, the counts, the **By workflow stage** breakdown, and the
>   totals cover only those two stages, and **Recent activity** shows estimates **the
>   GM personally acted on** (not everyone's).
> - There is **no "Create" form** on the Estimates page for a GM, and the
>   **Governance** menu (workflow / checklist / roles configuration) is **Admin-only**,
>   so it doesn't appear for a GM.

## 2. Sign in

1. Go to the web app and enter your **email** and **password**.
2. On success you land on the **Estimates** list. Your session is kept signed in
   and refreshed automatically; use **Log out** (top right) to end it.

The seeded administrator (first run) is configured from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` — ask your administrator for the credentials.

## 3. (Admin) Prepare the reference data

Estimators build from governed lists. As an Admin you can curate them first.

### Rate cards (labor cost)

1. Open **Rate cards** in the nav → **Create** a card (name + currency).
2. Add **roles** with a unit (hour/day) and a **rate**. These are the governed
   labor rates estimators select from. You can edit, re-order, activate/deactivate,
   or delete roles later. Rates are stored as exact decimals.

### Reference data (phases, categories, …)

Open **Reference data** to manage every configurable list (SDLC phases and their
tasks, **cost categories**, priorities, providers, units, and more):

- Pick a type on the left, then **add**, **rename**, **re-order**, or
  **activate/deactivate** values. Built-in values can be retired but not deleted.
- Anything you add here is immediately usable across the app **without a code
  change** — e.g. add a cost category "Marketing" and estimators can pick it.

### Cloud prices

Open **Cloud prices** to browse the seeded **AWS / GCP / Azure** catalog (filter by
provider, search by region/service/instance). It's read-only; the unit prices feed
cloud line items.

## 4. Create an estimate

1. From **Estimates**, type a name and click **Create**. You open the estimate
   editor.
2. Set the **currency** at creation; optionally attach a **rate card**.

## 5. Add line items

The editor groups costs into three line types. Each line can be tagged with a
**billing period** (one-time / monthly / yearly) and an **SDLC phase**.

### Labor

Pick a **role** from a rate card, then set **quantity** and **units** (e.g. hours).
The rate is **snapshotted** onto the line, so later rate-card edits never change a
saved estimate. Optionally record resource scheduling:

- **Resource** — the assigned person, **Allocation %** of their day, and a
  **start/end date** window.
- A person is **100% per day** and may be split across lines (e.g. 50% + 50%). The
  app **rejects** any save that pushes a resource over **100% on any date** and
  flags it as a blocking checklist item.

### Non-labor

Choose a **cost category** (governed dropdown), an **amount**, a billing period, and
optionally a phase. Use this for licenses, infrastructure, third-party services, etc.

### Cloud compute

Pick a **provider / region / instance** from the catalog, set **quantity** and
**usage hours/month**. The unit price is snapshotted onto the line. Cloud lines
default to **monthly**.

## 6. Pricing controls & totals

- **Upcharge %** — set a global markup for the estimate, and/or override it on any
  individual line (the per-line value wins where set).
- **Contingency %** — applied on top of the upcharged subtotal.
- The header cards show **one-time**, **monthly**, **yearly (annualized)**, and the
  **grand total**, all in the estimate's currency. They update live as you edit.
- **Cost by SDLC phase** breaks the totals down per phase (un-phased lines roll up
  under "Unassigned").

Add free-text **assumptions & notes** at the bottom to record context.

### Supporting documents

Use the **Supporting documents** card to attach and catalog files (proposals,
contracts, diagrams, …): pick a file (≤ 10 MB), choose a **Document type** (from
reference data), add an optional description, and **Upload**. Each file lists its
type, size, and uploader, with **Download** and **Delete**. Uploading/deleting
needs authoring rights, so a **GM/Viewer can download but not add or remove**;
every upload and delete is recorded in the **Audit Log**.

## 7. Governance — workflow & smart checklist

Each estimate moves through an approval **workflow** (Draft → In Review →
Approved → Final → Archived). **The workflow stage is the estimate's single
lifecycle indicator — there is no separate "status" field.** The current stage
shows (read-only) in the editor header and as the **Stage** column on the list;
you change it only here in the Governance panel.

- The **Smart checklist** continuously validates completeness — a rate card is
  selected, labor lines have roles/quantities, cloud lines are complete, amounts and
  billing periods are set, no resource is over-allocated, etc.
- **Blocking** checklist items **gate** forward transitions: you can't advance an
  estimate until they pass. Transition buttons are disabled (with a reason) when a
  gate blocks them or your role isn't allowed.
- Picking a transition lets you add a **note** before confirming — when a **GM
  returns an estimate to Draft**, that reason is shown so the estimator knows what
  to fix.
- Every transition is recorded with actor, timestamp, from→to, and the note.

## 8. Find, export, and print

- **Estimates** list supports **search** by name, **sortable columns** (click a
  header), and a **rows-per-page** dropdown (10/20/25/40/50) — the same pagination
  used across the SOW, Users, and Cloud Prices lists. Open any estimate to edit it.
- **Export CSV** (editor header) downloads the line items, totals, and per-phase
  summary.
- **Printable summary** (editor header) opens a clean, print-ready document — line
  tables, all totals, per-phase and per-category breakdowns, and assumptions — with
  a **Print** button.
- _(Admin)_ **Admin → Audit Log** is a read-only, append-only trail of who changed
  what and when (estimate edits, document uploads, user/role changes, workflow
  transitions); filter by entity type, search, and page through it.

## 9. Dashboard

Open **Dashboard** for a portfolio view: total estimates, drafts vs. final, **grand
totals per currency**, a **by-workflow-stage** breakdown, and **recent activity**
(click through to any estimate).

## 10. Clone & iterate

Use **clone** to copy an estimate (including its line snapshots) as a starting point
for a new scenario or revision. The copy is independent.

## 11. In-app Help & use cases

Open **Help** (top navigation) for a searchable catalog of **step-by-step use cases**
covering every task — signing in, building an estimate, pricing & markup, governance,
outputs, and administration. Each guide lists its steps, the persona it's for, the
**requirement/feature IDs** it covers, and a **Go there →** link to the right screen.

The guides are **deep-linkable**: every use case has a stable anchor of the form
`/help#uc-<id>` (shown on each card), so other parts of the app can jump straight to
the relevant guide. In particular, the estimate **Smart checklist** shows a **"How?"**
link beside each failing item that opens the exact use case explaining how to resolve
it — while clicking the item itself jumps to the specific line that needs fixing.

---

See also: `docs/ARCHITECTURE.md` (how it's built), `docs/API.md` + Swagger UI at
`/docs` (the REST API), and `docs/RUNBOOK.md` (running and operating the system).
