# Kerdos — Manual / QA Test Cases

A by-screen, executable test catalog for the **Kerdos** technology-project cost estimator
(React + Vite web client at `apps/web`, NestJS REST API at `apps/api`). Every Card / screen / panel
in the app has its own section below, and every test case is written so a QA tester can run it by hand
with no extra context.

## How to read this document

Each test case has:

- **ID** — stable identifier, e.g. `TC-LABOR-04`. Cite it in bug reports.
- **Title** — one line describing the check.
- **Preconditions** — state the app must be in before you start.
- **Steps** — numbered, click-by-click.
- **Expected result** — what you should observe; this is the pass/fail criterion.
- **Covers** — the requirement ID(s) from `CLAUDE.md` Section 4 the case exercises (where applicable).

Conventions:

- "Seeded admin" = the env-seeded administrator. With the default `.env.example`, that is
  email `admin@example.com`, password `change_me` (your environment may differ — use whatever
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set to).
- **Roles**: ADMIN, ESTIMATOR, VIEWER. Where a case says "as Estimator/Viewer", create that user first
  via the Users screen (TC-USERS-01) and sign in as them.
- Money renders with a currency symbol and grouped two decimals: `1234.5` → `$1,234.50`
  (see `apps/web/src/lib/money.ts`). "Shows the full value" means the field must not truncate or
  silently drop digits.
- Where labels are DB-driven (FR-29) they may show a friendly display name (e.g. "Monthly") while the
  stored value is a code (e.g. `MONTHLY`); both are acceptable so long as they round-trip.

## Test environment

1. On a clean machine with Docker installed, from the repo root run:
   - `./scripts/setup.sh && ./scripts/start.sh` (Linux/macOS), or `*.ps1` on Windows.
2. URLs once up:
   - Web client: `http://localhost:5173`
   - API base: `http://localhost:8000/api/v1`
   - Swagger UI: `http://localhost:8000/docs`
3. Seeding creates: one Admin user, a sample rate card, cost categories, and an AWS/GCP/Azure cloud
   price catalog, plus a default approval workflow and the default checklist rule set.
4. Sign in as the seeded admin to begin. Use a fresh browser profile / incognito between role tests so
   cached tokens don't leak between users.

---

## 0. App shell — top navigation, header, footer, Help button

Applies to `apps/web/src/App.tsx`. The header is the persistent brand bar; nav uses direct links plus
grouped dropdown menus (Pricing, Governance, Admin, Docs). Admin-only items are hidden for non-admins.

| ID        | Title                                              | Preconditions                    | Steps                                                       | Expected result                                                                                                                                   | Covers        |
| --------- | -------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| TC-NAV-01 | Header shows brand, user email, role pill, Log out | Signed in as admin               | 1. Look at the top header bar.                              | "Kerdos" wordmark + logo at left; the signed-in email, an uppercase role pill ("Admin"), and a "Log out" button at right.                         | FR-2          |
| TC-NAV-02 | Direct links present                               | Signed in                        | 1. Inspect the nav strip.                                   | Direct links: Dashboard, Estimates, SOW. Dropdown groups: Pricing, Governance, Admin, Docs.                                                       | —             |
| TC-NAV-03 | Dropdown opens/closes                              | Signed in                        | 1. Click "Pricing". 2. Click elsewhere on the page.         | Menu opens showing Rate Cards, Cloud Prices (and FX Rates if admin); a caret rotates. Clicking outside closes it; navigating also closes it.      | —             |
| TC-NAV-04 | Admin-only nav items hidden for non-admin          | Signed in as Viewer or Estimator | 1. Open every dropdown.                                     | "FX Rates", "Workflows", "Checklist Rules", "Users", "Reference Data" are NOT shown. "Roles", "Rate Cards", "Cloud Prices", Docs items ARE shown. | FR-26, NFR-16 |
| TC-NAV-05 | Admin sees all nav items                           | Signed in as admin               | 1. Open every dropdown.                                     | All admin items visible (FX Rates, Workflows, Checklist Rules, Users, Reference Data).                                                            | FR-26         |
| TC-NAV-06 | Active route highlighted                           | Signed in                        | 1. Navigate to several pages.                               | The current page's link/group is visibly highlighted.                                                                                             | NFR-8         |
| TC-NAV-07 | Floating Help button                               | Signed in                        | 1. Look at bottom-right of any signed-in page. 2. Click it. | A red round "? Help" button is fixed bottom-right; clicking navigates to `/help`. It is hidden when printing.                                     | NFR-12        |
| TC-NAV-08 | Logout clears session                              | Signed in                        | 1. Click "Log out".                                         | Redirected to the login screen; revisiting a protected URL (e.g. `/dashboard`) redirects to `/login`.                                             | FR-1          |
| TC-NAV-09 | Protected routes require auth                      | Signed out                       | 1. In the address bar go to `/estimates/anything`.          | Redirected to `/login`.                                                                                                                           | FR-1, NFR-16  |
| TC-NAV-10 | Unknown route redirects                            | Signed in                        | 1. Go to `/nonexistent-path`.                               | Redirected to the Estimates list (`/`).                                                                                                           | —             |
| TC-NAV-11 | Footer present                                     | Signed in                        | 1. Scroll to the bottom.                                    | Footer reads "Kerdos — Project Cost Estimator · © <current year> Veridion LLC".                                                                   | —             |

---

## 1. Login screen (`LoginPage.tsx`)

The sign-in card. Email defaults to `admin@example.com`; password is blank. An SSO button appears only
when SSO is enabled; the local form hides entirely when SSO is forced.

| ID          | Title                                 | Preconditions              | Steps                                                                                                        | Expected result                                                                                             | Covers      |
| ----------- | ------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------- |
| TC-LOGIN-01 | Successful admin login                | App up, signed out         | 1. Go to `/login`. 2. Confirm/enter the seeded admin email. 3. Enter the admin password. 4. Click "Sign in". | Button shows "Signing in…" then you land on the Estimates list (`/`). Header now shows your email and role. | FR-1        |
| TC-LOGIN-02 | Invalid credentials rejected          | Signed out                 | 1. Enter the admin email with a wrong password. 2. Click "Sign in".                                          | A red error message appears in the card; you remain on the login screen; no token stored.                   | FR-1, NFR-4 |
| TC-LOGIN-03 | Email field is required               | Signed out                 | 1. Clear the email field. 2. Click "Sign in".                                                                | Browser blocks submit (required field); form is not submitted.                                              | FR-1        |
| TC-LOGIN-04 | Email field type validation           | Signed out                 | 1. Type `not-an-email` in Email. 2. Submit.                                                                  | Browser shows the native invalid-email validation; submit is blocked.                                       | FR-1        |
| TC-LOGIN-05 | Password masked                       | Signed out                 | 1. Type into the Password field.                                                                             | Characters are masked (dots), confirming `type=password`.                                                   | NFR-4       |
| TC-LOGIN-06 | Email accepts/displays a long address | Signed out                 | 1. Type a long address e.g. `firstname.lastname+qa-team@subdomain.example.co.uk`.                            | The full address is accepted and visible in the field.                                                      | NFR-8       |
| TC-LOGIN-07 | Disabled state while submitting       | Signed out                 | 1. Enter valid creds, click "Sign in" and observe.                                                           | The button is disabled and reads "Signing in…" while the request is in flight.                              | NFR-8       |
| TC-LOGIN-08 | SSO button when enabled               | SSO configured (non-LOCAL) | 1. Go to `/login`.                                                                                           | A "Sign in with <provider>" button appears below an "or" divider.                                           | FR-26       |
| TC-LOGIN-09 | SSO-forced hides local form           | `SSO_PROTOCOL` forces SSO  | 1. Go to `/login`.                                                                                           | The email/password fields and "Sign in" button are hidden; only the SSO button shows.                       | FR-26       |
| TC-LOGIN-10 | SSO error surfaced                    | —                          | 1. Visit `/login?sso_error=test`.                                                                            | A red banner reads "SSO sign-in failed: test".                                                              | FR-26       |

### 1a. SSO callback (`SsoCallbackPage.tsx`)

| ID        | Title                                 | Preconditions | Steps                                                                                             | Expected result                                                    | Covers |
| --------- | ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| TC-SSO-01 | Successful SSO callback signs in      | SSO enabled   | 1. Complete an SSO login at the IdP so it redirects to `/sso/callback#access=…&refresh=…&user=…`. | Page briefly shows "Signing you in…", then lands on `/` signed in. | FR-26  |
| TC-SSO-02 | Malformed callback redirects to error | —             | 1. Visit `/sso/callback` with no/garbled fragment.                                                | Redirected to `/login?sso_error=…` and the error banner shows.     | FR-26  |

---

## 2. Estimates list / create (`EstimatesPage.tsx`)

Top-right search box, a "New estimate" card, and a table of estimates (Name, Status, Currency,
Grand total, Updated). Rows are clickable.

| ID        | Title                                  | Preconditions                          | Steps                                                                  | Expected result                                                                                                    | Covers        |
| --------- | -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| TC-EST-01 | Create an estimate                     | Signed in (Admin/Estimator)            | 1. In "New estimate name" type `Q3 Platform build`. 2. Click "Create". | A new estimate is created and you are navigated to its editor (`/estimates/{id}`).                                 | FR-4          |
| TC-EST-02 | Create button disabled when name empty | Signed in                              | 1. Leave the name blank (or only spaces).                              | "Create" is disabled.                                                                                              | FR-4          |
| TC-EST-03 | New-estimate name accepts a long value | Signed in                              | 1. Type a 100+ char name. 2. Create. 3. Return to the list.            | The full name is stored and shown (may wrap) in the table without truncating data.                                 | NFR-8         |
| TC-EST-04 | List columns render                    | At least one estimate exists           | 1. Go to `/`.                                                          | Table shows Name (teal link), Status, Currency, right-aligned Grand total formatted as money, and an Updated date. | FR-9          |
| TC-EST-05 | Grand total money format               | An estimate with a non-trivial total   | 1. View its row.                                                       | Grand total shows the currency symbol and grouped 2 decimals, e.g. `$12,345.00`.                                   | FR-7, NFR-13  |
| TC-EST-06 | Search by name filters list            | Several estimates with different names | 1. Type part of one name in the search box.                            | The table narrows to matching estimates (updates as you type).                                                     | FR-9          |
| TC-EST-07 | Search no-match                        | —                                      | 1. Search for a string no estimate matches.                            | "No estimates yet." empty-state row appears.                                                                       | FR-9          |
| TC-EST-08 | Empty state on fresh system            | No estimates exist                     | 1. Go to `/`.                                                          | The table shows the "No estimates yet." row.                                                                       | FR-9          |
| TC-EST-09 | Row click opens editor                 | An estimate exists                     | 1. Click anywhere on a row.                                            | Navigates to that estimate's editor.                                                                               | FR-4          |
| TC-EST-10 | Loading + error states                 | —                                      | 1. Open the page (optionally with the API stopped to force error).     | "Loading…" shows while fetching; if the API errors, a red message renders.                                         | NFR-9         |
| TC-EST-11 | Viewer cannot create                   | Signed in as Viewer                    | 1. Attempt to create an estimate.                                      | The create call is rejected server-side (deny-by-default); an error surfaces and no estimate is created.           | FR-26, NFR-16 |

---

## 3. Estimate editor (`EstimateEditorPage.tsx`)

The richest screen. It contains, top to bottom: header (status select + export buttons), the **Totals**
cards, optional Margin/Sell/Tax/Client-price cards, a capacity banner, **Cost by category**,
**Cost by SDLC phase**, **Approval workflow** + **Smart checklist** (Governance), **Scenarios**,
**Baselines & versions**, **Settings**, **Labor**, **Non-labor**, **Cloud compute**,
**Assumptions & notes**, and **Comments**. Each sub-card has its own subsection below.

### 3.1 Editor header & exports

| ID          | Title                          | Preconditions               | Steps                                                                             | Expected result                                                                                                                 | Covers       |
| ----------- | ------------------------------ | --------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| TC-EDHDR-01 | Header shows name + back link  | An estimate open            | 1. Open an estimate.                                                              | "← Estimates" link and the estimate name as an H1.                                                                              | FR-4         |
| TC-EDHDR-02 | Status dropdown changes status | An estimate open            | 1. Open the status `<select>` (top-right). 2. Choose another status (e.g. Final). | Status persists; reloading shows the new status. Options come from the `ESTIMATE_STATUS` reference data (fallback Draft/Final). | FR-4, FR-29  |
| TC-EDHDR-03 | Printable summary link         | An estimate open            | 1. Click "Printable summary".                                                     | Navigates to `/estimates/{id}/print`.                                                                                           | FR-10, FR-23 |
| TC-EDHDR-04 | Export CSV                     | An estimate with line items | 1. Click "Export CSV".                                                            | A CSV file downloads named after the estimate; it contains line items, subtotals, contingency, and totals.                      | FR-10        |
| TC-EDHDR-05 | Export Excel                   | An estimate with line items | 1. Click "Export Excel".                                                          | An Excel file downloads with the estimate's figures.                                                                            | FR-20        |
| TC-EDHDR-06 | Loading / error / not-found    | —                           | 1. Open a valid id (Loading…), then an invalid id.                                | Valid: "Loading…" then content. Invalid: red error message.                                                                     | NFR-9        |

### 3.2 Totals cards (FR-7, FR-22, FR-23)

Four cards: One-time, Monthly, Yearly, Grand total (cost). When Margin% or Tax% > 0, a second row shows
Margin, Sell price, Tax, and the accented Client price.

| ID        | Title                               | Preconditions                           | Steps                                                                      | Expected result                                                                          | Covers       |
| --------- | ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| TC-TOT-01 | Four totals render                  | An estimate open                        | 1. Look at the totals row.                                                 | Cards labeled One-time, Monthly, Yearly, Grand total (cost), each a money value.         | FR-7, FR-23  |
| TC-TOT-02 | Totals are money-formatted          | —                                       | 1. Inspect each card.                                                      | Each value shows currency symbol + grouped 2 decimals.                                   | FR-7, NFR-13 |
| TC-TOT-03 | Monthly vs yearly relationship      | Add one MONTHLY line of `$100`          | 1. Add a non-labor MONTHLY line at amount 100. 2. Read Monthly and Yearly. | Monthly increases by `$100.00`; Yearly increases by `$1,200.00` (×12).                   | FR-23        |
| TC-TOT-04 | Yearly line annualizes to monthly   | Add a YEARLY non-labor line of `$1,200` | 1. Add it. 2. Read Monthly and Yearly.                                     | Yearly increases by `$1,200.00`; Monthly increases by `$100.00` (÷12).                   | FR-23        |
| TC-TOT-05 | One-time excluded from recurring    | Add a ONE_TIME line of `$500`           | 1. Add it. 2. Read the cards.                                              | One-time increases by `$500.00`; Monthly and Yearly are unaffected by it.                | FR-23        |
| TC-TOT-06 | Margin/sell/tax/client cards appear | Margin% or Tax% > 0                     | 1. Set Margin % = 20 in Settings.                                          | A second card row appears: Margin, Sell price, Tax, and an accented (teal) Client price. | FR-16        |
| TC-TOT-07 | Margin/tax cards hidden at zero     | Margin% = 0 and Tax% = 0                | 1. Set both to 0.                                                          | The second card row disappears.                                                          | FR-16        |
| TC-TOT-08 | Totals recalc live                  | An estimate open                        | 1. Add/edit/delete any line.                                               | Totals update without a full page reload.                                                | FR-7, NFR-1  |

### 3.3 Capacity over-allocation banner (FR-27)

| ID        | Title                              | Preconditions                                                 | Steps                 | Expected result                                                                                                | Covers |
| --------- | ---------------------------------- | ------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| TC-CAP-01 | Banner shows on over-allocation    | An estimate with an over-allocated resource (see TC-LABOR-15) | 1. Open the estimate. | A red "Resource over-allocation (FR-27)" alert lists each resource, the over-allocated % (>100), and the date. | FR-27  |
| TC-CAP-02 | Banner absent when within capacity | No resource over 100% on any date                             | 1. Open the estimate. | No capacity banner is shown.                                                                                   | FR-27  |

### 3.4 Cost by category card (FR-7)

| ID        | Title                     | Preconditions                      | Steps                         | Expected result                                                                                | Covers |
| --------- | ------------------------- | ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| TC-CAT-01 | Category breakdown table  | An estimate with categorized lines | 1. Locate "Cost by category". | Table with Category, One-time, Monthly, Yearly columns; one row per category, money-formatted. | FR-7   |
| TC-CAT-02 | Hidden when no categories | A fresh estimate with no lines     | 1. Open it.                   | The "Cost by category" card is not rendered.                                                   | FR-7   |

### 3.5 Cost by SDLC phase card (FR-28)

| ID          | Title                                   | Preconditions                        | Steps                                                                      | Expected result                                                                                 | Covers |
| ----------- | --------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| TC-PHASE-01 | Phase breakdown table                   | Lines tagged with SDLC phases        | 1. Tag a labor and a cloud line with phases. 2. Find "Cost by SDLC phase". | Table with Phase, One-time, Monthly, Yearly; one row per phase, post-upcharge, money-formatted. | FR-28  |
| TC-PHASE-02 | Un-phased lines roll under "Unassigned" | A line with no phase + a phased line | 1. Add one line with no phase. 2. View the phase card.                     | Un-phased totals appear under an "Unassigned" row.                                              | FR-28  |
| TC-PHASE-03 | Hidden when no phased lines             | Fresh estimate                       | 1. Open it.                                                                | The phase card is not rendered.                                                                 | FR-28  |

### 3.6 Approval workflow card (FR-24)

Shows current stage, role/checklist-gated transition buttons, and an append-only history list.

| ID       | Title                                   | Preconditions                                        | Steps                                                     | Expected result                                                                                | Covers       |
| -------- | --------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| TC-WF-01 | Current stage shown                     | An estimate open                                     | 1. Find the "Approval workflow" card.                     | "Current stage:" shows the seeded initial stage label (e.g. Draft).                            | FR-24        |
| TC-WF-02 | Available transitions render as buttons | An estimate open                                     | 1. Look at the transition buttons.                        | Buttons for each transition out of the current stage; "No transitions from here." if none.     | FR-24        |
| TC-WF-03 | Valid transition advances stage         | Checklist passing, user has the role                 | 1. Click a transition button.                             | The current stage updates; a history entry "from → to · <timestamp>" is appended.              | FR-24        |
| TC-WF-04 | Transition blocked by failing BLOCKER   | A failing BLOCKER checklist item (e.g. no rate card) | 1. Hover the gated transition button. 2. Try to click it. | Button is disabled; tooltip reads "Blocked by the checklist"; the stage does not change.       | FR-24, FR-25 |
| TC-WF-05 | Transition gated by role                | Signed in as a role not allowed for the transition   | 1. Hover the transition button.                           | Disabled with tooltip "Requires the <ROLE> role"; stage unchanged.                             | FR-24, FR-26 |
| TC-WF-06 | History is append-only                  | Several transitions performed                        | 1. Read the history list.                                 | Each prior transition appears as a separate dated line; nothing is removed when stage changes. | FR-24, FR-11 |

### 3.7 Smart checklist card (FR-25)

A rule-driven completeness panel with a progress bar, "to fix / to do / done" counts, and a list with
three states (✓ done green, ✕ needs-fixing red/amber, ○ to-do amber). A failing BLOCKER shows a "blocks"
badge. Items are clickable (jump to the section) and have a "How?" guide link.

| ID        | Title                                  | Preconditions                                 | Steps                                        | Expected result                                                                                               | Covers        |
| --------- | -------------------------------------- | --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- |
| TC-CHK-01 | Brand-new estimate has no green checks | A just-created estimate                       | 1. Open it. 2. Read the checklist.           | No items show ✓; not-started rules show ○ "To do" in amber (a vacuously-passing rule must render ○, not ✓).   | FR-25         |
| TC-CHK-02 | Status line reflects blocking          | An estimate with a failing BLOCKER            | 1. Read the top line.                        | Shows "Blocking items present" in red; when all blockers pass it shows "All blocking checks pass" in green.   | FR-25         |
| TC-CHK-03 | Completeness bar + counts              | An estimate with mixed item states            | 1. Read the progress bar and counts.         | Bar fills to "% complete" (red bar if blocking, green otherwise); counts show "N to fix / N to do / N done".  | FR-25         |
| TC-CHK-04 | Item ordering                          | An estimate with failing + to-do + done items | 1. Read the list top-down.                   | Needs-fixing first (blockers before warnings), then to-do, then done.                                         | FR-25         |
| TC-CHK-05 | "blocks" badge only on failing BLOCKER | A failing BLOCKER present                     | 1. Find the failing blocker item.            | It shows a small red "blocks" badge; warnings/info/to-do items do not.                                        | FR-25         |
| TC-CHK-06 | Click item jumps to section            | Any actionable item                           | 1. Click a checklist item (e.g. labor role). | The page scrolls to and flashes the relevant section (or the specific offending line if named).               | FR-25, NFR-8  |
| TC-CHK-07 | "How?" guide link                      | A failing or to-do item                       | 1. Click "How?" next to an item.             | Navigates to the matching `/help#uc-…` guide.                                                                 | FR-25, NFR-12 |
| TC-CHK-08 | Re-check button                        | An estimate open                              | 1. Click "↻ Re-check".                       | The checklist re-evaluates; the "checked HH:MM:SS" timestamp updates; button shows "Re-checking…" while busy. | FR-25         |
| TC-CHK-09 | Empty-rules state                      | No applicable rules match                     | 1. Open a brand-new estimate.                | If no items match, "No checklist items match this estimate yet." + a "How?" link is shown.                    | FR-25         |
| TC-CHK-10 | Auto-evaluates on change               | An estimate open                              | 1. Add/remove a line.                        | The checklist updates to reflect the new state without a manual re-check (also refreshable via Re-check).     | FR-25         |

### 3.8 Scenarios card (FR-14)

Starts as a "Create scenario" prompt; once a group exists it becomes a compare table (Name, Status,
Grand total cost, Client price), with the current row highlighted.

| ID         | Title                   | Preconditions                      | Steps                                       | Expected result                                                                                                                        | Covers |
| ---------- | ----------------------- | ---------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| TC-SCEN-01 | Create first scenario   | An estimate with no scenario group | 1. In "Scenarios", click "Create scenario". | A scenario variant is created; the card switches to a compare table.                                                                   | FR-14  |
| TC-SCEN-02 | Compare table content   | A scenario group exists            | 1. Read the table.                          | Rows for each scenario: Name (link), Status, Grand total (cost), Client price; base row marked "· base"; current row highlighted teal. | FR-14  |
| TC-SCEN-03 | Open a scenario         | Compare table shown                | 1. Click a scenario name.                   | Navigates to that scenario's editor.                                                                                                   | FR-14  |
| TC-SCEN-04 | Create another scenario | Compare table shown                | 1. Click "Create another scenario".         | A new variant is added to the group/table.                                                                                             | FR-14  |
| TC-SCEN-05 | Money formatting        | —                                  | 1. Inspect totals/prices.                   | Each shows currency symbol + grouped 2 decimals.                                                                                       | FR-7   |

### 3.9 Baselines & versions card (FR-15)

Capture a labeled baseline of the current grand total; the table lists each with captured-by, total,
and the delta vs current (red if current is higher, green if lower).

| ID         | Title                             | Preconditions                              | Steps                                                                                      | Expected result                                                                                                      | Covers |
| ---------- | --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------ |
| TC-BASE-01 | Capture baseline                  | An estimate open                           | 1. Type `v1 approved` in the label box. 2. Click "Capture baseline".                       | A baseline row appears with the label, your email, the date, and the grand total.                                    | FR-15  |
| TC-BASE-02 | Capture disabled when label blank | —                                          | 1. Leave the label empty.                                                                  | "Capture baseline" is disabled.                                                                                      | FR-15  |
| TC-BASE-03 | Delta vs current                  | A baseline captured, then estimate changed | 1. Capture a baseline. 2. Add a line raising the total. 3. Read the "Δ vs current" column. | Delta shows a signed money value (e.g. `+$500.00`), colored red when current exceeds the baseline, green when lower. | FR-15  |
| TC-BASE-04 | Label accepts long text           | —                                          | 1. Capture with a long label.                                                              | Full label stored and shown.                                                                                         | NFR-8  |
| TC-BASE-05 | Delete baseline                   | A baseline exists                          | 1. Click "Delete" on a baseline row.                                                       | The row is removed.                                                                                                  | FR-15  |

### 3.10 Settings card

Rate card select, Global upcharge %, Contingency %, Margin %, Tax % (each a number 0–100, step 0.01),
plus a live "Upcharge $ · Contingency $" readout.

| ID        | Title                              | Preconditions                 | Steps                                                    | Expected result                                                                                                       | Covers      |
| --------- | ---------------------------------- | ----------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| TC-SET-01 | Select a rate card                 | A rate card exists            | 1. Choose a rate card from the dropdown.                 | Selection persists; labor role options now come from this card.                                                       | FR-3, FR-4  |
| TC-SET-02 | Rate card "none" option            | —                             | 1. Choose "— none —".                                    | Rate card cleared; the checklist's "rate card selected" rule then fails (BLOCKER).                                    | FR-25       |
| TC-SET-03 | Global upcharge applies            | A labor/non-labor line exists | 1. Set Global upcharge % = 10 (blur the field).          | Line/category subtotals and totals rise by the upcharge; the "Upcharge $" readout reflects it.                        | FR-22       |
| TC-SET-04 | Contingency applies after upcharge | A line + upcharge set         | 1. Set Contingency % = 5.                                | Contingency is applied to the upcharged subtotal (order: upcharge then contingency); "Contingency $" readout updates. | FR-7, FR-22 |
| TC-SET-05 | Number fields clamp 0–100          | —                             | 1. In Global upcharge %, try to enter 150 or a negative. | The input enforces min 0 / max 100 (browser spinner); only a valid number is saved on blur.                           | FR-22       |
| TC-SET-06 | Decimal precision accepted         | —                             | 1. Enter `12.34` in any percent field, blur.             | The decimal value is accepted (step 0.01) and persisted.                                                              | FR-22       |
| TC-SET-07 | Non-numeric ignored                | —                             | 1. Clear a percent field / type letters, blur.           | A non-parseable value is ignored (no save); the prior value stands.                                                   | NFR-8       |
| TC-SET-08 | Margin & Tax fields                | —                             | 1. Set Margin % and Tax %.                               | Both persist and drive the Margin/Sell/Tax/Client cards (TC-TOT-06).                                                  | FR-16       |
| TC-SET-09 | Upcharge/Contingency readout       | —                             | 1. Read the inline text in Settings.                     | Shows "Upcharge $X · Contingency $Y" money-formatted, matching the totals math.                                       | FR-22, FR-7 |

### 3.11 Labor card (`LaborSection`) — FR-5, FR-7, FR-13, FR-22, FR-23, FR-27, FR-28

This is the core authoring surface. The add-a-line row sits under the column headers; each existing line
renders in the table. Per-field box checks below; **the line total must equal rate × qty × units**
(after the effective upcharge is applied).

**Field-box checks (each box accepts and displays its value):**

| ID          | Title                                    | Preconditions                                        | Steps                                                           | Expected result                                                                                                           | Covers            |
| ----------- | ---------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| TC-LABOR-01 | Role box — select a role                 | Rate card selected with roles                        | 1. Open the Role dropdown in the add row.                       | Lists each role as "RoleName (Card) — $rate/UNIT". Selecting one enables "Add labor".                                     | FR-3, FR-5        |
| TC-LABOR-02 | Role box — long role name displays fully | A rate-card role with a very long name               | 1. Add a labor line using that role. 2. View the Role cell.     | The full role name is shown; it wraps to a second line rather than being cut off.                                         | FR-5, NFR-8       |
| TC-LABOR-03 | Resource box — accepts text              | Role selected                                        | 1. Type `Jane Doe` in the Resource box. 2. Add.                 | The line's Resource cell shows "Jane Doe"; blank shows "—".                                                               | FR-27             |
| TC-LABOR-04 | Resource box — long name displays        | —                                                    | 1. Enter a long resource name, add.                             | Full name shown (wraps), not truncated.                                                                                   | NFR-8             |
| TC-LABOR-05 | Alloc % box — accepts 0–100              | Role + resource set                                  | 1. Set Alloc to 50, add.                                        | Line shows "50%" in the Alloc column.                                                                                     | FR-27             |
| TC-LABOR-06 | Alloc % defaults to 100                  | Role + resource, Alloc left at default               | 1. Add.                                                         | Line shows "100%".                                                                                                        | FR-27             |
| TC-LABOR-07 | Window box — start & end dates           | Role selected                                        | 1. Pick a Start date and End date, add.                         | Line's Window shows a compact range like "7/1–7/31"; blank dates show "—".                                                | FR-27             |
| TC-LABOR-08 | Phase box — pick SDLC phase              | Role selected                                        | 1. Open the Phase dropdown, choose Development, add.            | Line's Phase cell shows the chosen phase; blank shows "—". Options come from `SDLC_PHASE` reference data.                 | FR-28, FR-29      |
| TC-LABOR-09 | Qty box — multi-digit                    | Role selected                                        | 1. Enter Qty `12`, Units `1`, add.                              | Qty cell shows `12`; total reflects it.                                                                                   | FR-5              |
| TC-LABOR-10 | Units box — decimal                      | Role selected                                        | 1. Enter Units `7.5`, add.                                      | Units cell shows `7.5`; total reflects it.                                                                                | FR-5              |
| TC-LABOR-11 | PERT boxes — three-point estimate        | Role selected                                        | 1. Enter o=2, m=4, p=12 in the PERT mini-inputs. 2. Add.        | Effective Units = PERT (o+4m+p)/6 = 5; the line's Units reflect the PERT result.                                          | FR-13             |
| TC-LABOR-12 | PERT ignored unless all three set        | Role selected                                        | 1. Fill only o and m (leave p blank), set Units=3, add.         | PERT is not applied; the plain Units value (3) is used.                                                                   | FR-13             |
| TC-LABOR-13 | Billing box — period select              | Role selected                                        | 1. Choose MONTHLY in Billing, add.                              | Line's Billing column shows the chosen period (label from `BILLING_PERIOD`); totals roll into Monthly/Yearly accordingly. | FR-23, FR-29      |
| TC-LABOR-14 | Rate box — snapshot shown                | A labor line added                                   | 1. View the Rate cell.                                          | Shows the role's rate as money (`$/`); add-row Rate column shows "auto" (computed).                                       | FR-3, NFR-5       |
| TC-LABOR-LT | **Line total = rate × qty × units**      | Rate card role rate known (e.g. $100/HR), upcharge 0 | 1. Add a line: qty 2, units 3, no upcharge. 2. Read Line total. | Line total = `$100 × 2 × 3 = $600.00`, money-formatted. With a 10% effective upcharge it becomes `$660.00`.               | FR-5, FR-7, FR-22 |

**Behavior & validation checks:**

| ID          | Title                            | Preconditions                                             | Steps                                                                                           | Expected result                                                                                                            | Covers       |
| ----------- | -------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ |
| TC-LABOR-15 | Over-allocation rejected on save | A resource already 100% allocated on a date               | 1. Add another line for the same resource_name overlapping that date so the sum > 100%. 2. Add. | The save is rejected server-side; a red error renders under the Labor table; the line is not added (FR-27 100%/day guard). | FR-27, FR-25 |
| TC-LABOR-16 | Split allocation allowed         | One resource, two lines at 50% each, same dates           | 1. Add both.                                                                                    | Both lines save (sum = 100%, allowed); no capacity banner.                                                                 | FR-27        |
| TC-LABOR-17 | Add disabled without a role      | No role selected                                          | 1. Observe "Add labor".                                                                         | Disabled until a role is chosen.                                                                                           | FR-5         |
| TC-LABOR-18 | Delete a labor line              | A labor line exists                                       | 1. Click "Delete" on the line.                                                                  | The line is removed; totals recalc.                                                                                        | FR-4         |
| TC-LABOR-19 | Rate snapshot immutability       | A labor line saved, then its rate card role rate changed  | 1. Note the line total. 2. In Rate Cards, change that role's rate. 3. Reopen the estimate.      | The saved line keeps its original rate snapshot and line total (unchanged).                                                | NFR-5, BR-3  |
| TC-LABOR-20 | Checklist: role-assigned rule    | A labor line with no resource where the rule requires one | 1. Read the checklist "labor role assigned" item.                                               | Reflects pass/fail correctly; clicking it jumps to the Labor section.                                                      | FR-25        |

### 3.12 Non-labor card (`NonLaborSection`) — FR-6, FR-23, FR-28

Category select (from `COST_CATEGORY` reference data), Amount, Billing period, Phase, and a computed
Line total.

| ID       | Title                                | Preconditions               | Steps                                                                                             | Expected result                                                                                | Covers       |
| -------- | ------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| TC-NL-01 | Add a non-labor line                 | An estimate open            | 1. Choose a Category. 2. Enter Amount `1500`. 3. Pick a Billing period. 4. Click "Add non-labor". | A row appears with the category, `$1,500.00` amount, billing label, and a computed line total. | FR-6         |
| TC-NL-02 | Category options governed            | Reference data seeded       | 1. Open the Category dropdown.                                                                    | Lists active `COST_CATEGORY` values (e.g. Software, Infrastructure…).                          | FR-29, FR-6  |
| TC-NL-03 | Add disabled without category/amount | —                           | 1. Leave category or amount blank.                                                                | "Add non-labor" is disabled.                                                                   | FR-6         |
| TC-NL-04 | Amount accepts decimals              | —                           | 1. Enter `1234.56` and add.                                                                       | Amount shows `$1,234.56`.                                                                      | FR-6, NFR-13 |
| TC-NL-05 | ONE_TIME → FIXED type                | Add with Billing = One-time | 1. Add.                                                                                           | Stored as FIXED; contributes to the one-time total only.                                       | FR-23        |
| TC-NL-06 | Recurring → MONTHLY/YEARLY           | Add with Billing = Monthly  | 1. Add `$100` monthly.                                                                            | Stored as RECURRING; Monthly +$100, Yearly +$1,200.                                            | FR-23        |
| TC-NL-07 | Phase tag on non-labor               | —                           | 1. Choose a Phase, add.                                                                           | Phase column shows it; the phase breakdown card includes it.                                   | FR-28        |
| TC-NL-08 | Delete a non-labor line              | A line exists               | 1. Click "Delete".                                                                                | Removed; totals recalc.                                                                        | FR-4         |
| TC-NL-09 | Line total money format              | —                           | 1. Inspect the Line total cell.                                                                   | Currency symbol + grouped 2 decimals.                                                          | FR-7         |

### 3.13 Cloud compute card (`CloudSection`) — FR-21, FR-23, FR-28, NFR-14

Picker is a `<select>` grouped by category showing "Provider · Service SKU (region) — $price/unit",
plus Qty, Usage/mo, Phase, and Add.

| ID          | Title                           | Preconditions        | Steps                                                                                                     | Expected result                                                                              | Covers       |
| ----------- | ------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ |
| TC-CLOUD-01 | Add a cloud line                | Cloud catalog seeded | 1. Open the picker, choose an AWS/GCP/Azure resource. 2. Qty `1`, Usage/mo `730`. 3. Click "Add cloud".   | A row appears: "Provider · SKU (region)", qty, usage, unit price (snapshot), and line total. | FR-21        |
| TC-CLOUD-02 | Picker grouped by category      | —                    | 1. Open the picker.                                                                                       | Options are grouped under category optgroups (Compute, Storage, Database, …), sorted.        | FR-21        |
| TC-CLOUD-03 | Unit price snapshotted          | A cloud line added   | 1. Note the Unit price. 2. (Admin) Refresh cloud prices on the Cloud Prices page. 3. Reopen the estimate. | The line's snapshot unit price and line total are unchanged by the refresh.                  | NFR-14, BR-3 |
| TC-CLOUD-04 | Defaults to MONTHLY             | —                    | 1. Add a cloud line.                                                                                      | Billing is MONTHLY; the cost rolls into Monthly and ×12 into Yearly.                         | FR-23        |
| TC-CLOUD-05 | Qty / Usage multi-digit         | —                    | 1. Enter Qty `3`, Usage `1460`, add.                                                                      | Both shown exactly; line total scales accordingly.                                           | FR-21        |
| TC-CLOUD-06 | Usage relabel/help              | —                    | 1. Hover the Usage/mo input.                                                                              | Tooltip explains hours for compute or GB/requests/seats/1-month for other units.             | FR-21        |
| TC-CLOUD-07 | Phase tag on cloud line         | —                    | 1. Choose a Phase, add.                                                                                   | Phase column shows it; included in the phase breakdown.                                      | FR-28        |
| TC-CLOUD-08 | Add disabled without a resource | No resource picked   | 1. Observe "Add cloud".                                                                                   | Disabled until a resource is selected.                                                       | FR-21        |
| TC-CLOUD-09 | Delete a cloud line             | A line exists        | 1. Click "Delete".                                                                                        | Removed; totals recalc.                                                                      | FR-4         |
| TC-CLOUD-10 | Provider label DB-driven        | —                    | 1. Inspect the provider in a line.                                                                        | Shows the `CLOUD_PROVIDER` display label (AWS/GCP/Azure/SaaS).                               | FR-29        |

### 3.14 Assumptions & notes card (FR-8)

| ID          | Title                   | Preconditions    | Steps                                                 | Expected result                                       | Covers      |
| ----------- | ----------------------- | ---------------- | ----------------------------------------------------- | ----------------------------------------------------- | ----------- |
| TC-ASSUM-01 | Add an assumption       | An estimate open | 1. Type text in "Add an assumption…". 2. Click "Add". | The assumption appears in the list; the input clears. | FR-8        |
| TC-ASSUM-02 | Add disabled when blank | —                | 1. Leave the box empty.                               | "Add" is disabled.                                    | FR-8        |
| TC-ASSUM-03 | Long assumption text    | —                | 1. Add a long multi-sentence note.                    | Full text shown without truncation.                   | FR-8, NFR-8 |
| TC-ASSUM-04 | Delete an assumption    | One exists       | 1. Click "Delete".                                    | Removed from the list.                                | FR-8        |
| TC-ASSUM-05 | Empty state             | No assumptions   | 1. View the card.                                     | Shows "None yet."                                     | FR-8        |

### 3.15 Comments card (FR-19)

| ID        | Title                   | Preconditions    | Steps                                                | Expected result                                              | Covers |
| --------- | ----------------------- | ---------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ------ |
| TC-COM-01 | Add a comment           | An estimate open | 1. Type a comment, click "Comment" (or press Enter). | Comment appears with author email + timestamp; input clears. | FR-19  |
| TC-COM-02 | Enter key submits       | —                | 1. Type, press Enter.                                | Comment is added.                                            | FR-19  |
| TC-COM-03 | Add disabled when blank | —                | 1. Empty box.                                        | "Comment" disabled.                                          | FR-19  |
| TC-COM-04 | Delete a comment        | One exists       | 1. Click "Delete".                                   | Removed.                                                     | FR-19  |
| TC-COM-05 | Empty state             | No comments      | 1. View the card.                                    | "No comments yet."                                           | FR-19  |
| TC-COM-06 | Multi-line preserved    | —                | 1. Add a comment that wraps.                         | Whitespace/newlines preserved on display.                    | FR-19  |

---

## 4. Printable summary (`PrintSummaryPage.tsx`) — FR-10, FR-23, FE-23

Read-only print view: header (name/status/currency/upcharge/contingency), totals grid (One-time,
Monthly, Yearly, Upcharge, Contingency, Grand total), labor/non-labor/cloud tables, phase & category
breakdowns, and assumptions. A "Print" button and "Back to editor" link are hidden when printing.

| ID          | Title                        | Preconditions                                                 | Steps                                       | Expected result                                                                                              | Covers       |
| ----------- | ---------------------------- | ------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ |
| TC-PRINT-01 | Summary renders all sections | An estimate with labor, non-labor, cloud, phases, assumptions | 1. Open `/estimates/{id}/print`.            | Header, six-tile totals grid, each line table present, phase + category breakdowns, and an assumptions list. | FR-10, FR-23 |
| TC-PRINT-02 | Totals match the editor      | Same estimate                                                 | 1. Compare totals against the editor cards. | One-time/Monthly/Yearly/Upcharge/Contingency/Grand total match the editor exactly.                           | FR-7, FR-23  |
| TC-PRINT-03 | Empty sections omitted       | An estimate with only labor                                   | 1. Open the print view.                     | Non-labor/cloud/assumptions tables are not rendered when empty.                                              | FR-10        |
| TC-PRINT-04 | Print button                 | —                                                             | 1. Click "Print".                           | The browser print dialog opens; the back link and Print button are hidden in the printed output.             | FR-10        |
| TC-PRINT-05 | Back to editor               | —                                                             | 1. Click "← Back to editor".                | Returns to `/estimates/{id}`.                                                                                | —            |
| TC-PRINT-06 | Money formatting throughout  | —                                                             | 1. Scan all amounts.                        | Every monetary value shows currency symbol + 2 decimals.                                                     | NFR-13       |

---

## 5. Rate cards (`RateCardsPage.tsx`) — FR-3

Create-card form (name + 3-letter currency), then one panel per card: Active checkbox, Delete card,
a sortable Role/Unit/Rate table, inline-editable rows, and an Add-role row. Rate shows a currency
symbol prefix; values normalize to 2 decimals on blur.

| ID       | Title                               | Preconditions          | Steps                                                                                | Expected result                                                                             | Covers              |
| -------- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------- |
| TC-RC-01 | Create a rate card                  | Signed in as admin     | 1. Type a name + currency `USD`. 2. Click "Create".                                  | A new card panel appears with that name and currency.                                       | FR-3                |
| TC-RC-02 | Currency upper-cased & 3 chars      | —                      | 1. Type `eur` (lowercase) in Currency.                                               | It auto-uppercases to `EUR`; max length 3 enforced.                                         | FR-3, NFR-13        |
| TC-RC-03 | Create disabled without name        | —                      | 1. Leave name blank.                                                                 | "Create" disabled.                                                                          | FR-3                |
| TC-RC-04 | Add a role                          | A card exists          | 1. In the Add-role row, type a role name + rate, choose a unit. 2. Click "Add role". | The role row is added with unit and a 2-decimal rate prefixed by the currency symbol.       | FR-3                |
| TC-RC-05 | Add-role disabled without name/rate | —                      | 1. Leave role name or rate blank.                                                    | "Add role" disabled.                                                                        | FR-3                |
| TC-RC-06 | Rate normalizes to 2 decimals       | —                      | 1. Enter `85` as a rate, blur.                                                       | Displays `85.00`. Non-numeric input is passed through unchanged (not saved).                | FR-3, NFR-5         |
| TC-RC-07 | Rate accepts large/decimal value    | —                      | 1. Enter `1234.5`, blur.                                                             | Shows `1234.50`; the symbol prefix (e.g. `$`) is shown beside it; full value retained.      | FR-3, NFR-13        |
| TC-RC-08 | Edit role name inline               | A role exists          | 1. Change the role name field, blur.                                                 | The new name persists (only if non-empty and changed).                                      | FR-3                |
| TC-RC-09 | Long role name displays fully       | —                      | 1. Add/rename a role to a long string.                                               | The full name is held in the input and round-trips to estimates' role dropdown.             | FR-3, NFR-8         |
| TC-RC-10 | Change unit                         | A role exists          | 1. Change the Unit select (Hour/Day).                                                | Persists; options come from `RATE_UNIT` reference data (fallback HOUR/DAY).                 | FR-3, FR-29         |
| TC-RC-11 | Sort by Role / Rate                 | A card with ≥2 roles   | 1. Click the "Role" header, then "Rate".                                             | Rows sort asc/desc; an arrow (▲/▼) indicates the active sort/direction.                     | NFR-8               |
| TC-RC-12 | Delete a role                       | A role exists          | 1. Click "Delete" on a role row.                                                     | The role is removed.                                                                        | FR-3                |
| TC-RC-13 | Toggle Active                       | A card exists          | 1. Toggle the "Active" checkbox.                                                     | The card's active state persists.                                                           | FR-3                |
| TC-RC-14 | Delete a card (confirm)             | A card exists          | 1. Click "Delete card". 2. Confirm the dialog.                                       | After confirming, the card is removed; cancelling leaves it.                                | FR-3                |
| TC-RC-15 | Empty state                         | No cards               | 1. Open the page.                                                                    | "No rate cards yet — create one above."                                                     | FR-3                |
| TC-RC-16 | Estimator can select but not edit   | Signed in as Estimator | 1. Attempt to create/edit a card.                                                    | Server denies the write (deny-by-default); estimators can still pick a card on an estimate. | FR-3, FR-26, NFR-16 |

---

## 6. Cloud prices (`CloudPricesPage.tsx`) — FR-21, FR-21a, FR-21b, NFR-14

Read-only catalog. A "Price freshness" card shows per-provider last-pulled date/time and a price count
(+ a "Refresh prices" button for admins). Filters: Provider, Category, and a free-text search; a table
lists Provider/Category/Region/Service/Instance/Unit/Unit price/Currency.

| ID       | Title                       | Preconditions                 | Steps                                                 | Expected result                                                                               | Covers         |
| -------- | --------------------------- | ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| TC-CP-01 | Catalog table renders       | Catalog seeded                | 1. Open `/cloud-prices`.                              | A table of seeded prices with all eight columns; provider/unit shown via DB labels.           | FR-21          |
| TC-CP-02 | Freshness card per provider | —                             | 1. Look at "Price freshness".                         | A row per provider with last-pulled (MM/DD/CCYY HH:MM:SS local, or "—") and a price count.    | FR-21b         |
| TC-CP-03 | Filter by provider          | —                             | 1. Choose AWS in Provider.                            | Only AWS rows shown.                                                                          | FR-21          |
| TC-CP-04 | Filter by category          | —                             | 1. Choose a Category.                                 | Only that category's rows shown.                                                              | FR-21          |
| TC-CP-05 | Text search                 | —                             | 1. Type `us-east-1` (or an instance like `m5.large`). | Rows narrow to matches across category/region/service/instance.                               | FR-21          |
| TC-CP-06 | No-match empty state        | —                             | 1. Search a nonsense string.                          | "No matching prices." row.                                                                    | FR-21          |
| TC-CP-07 | Admin sees Refresh button   | Signed in as admin            | 1. Look at the freshness card.                        | "Refresh prices" button present.                                                              | FR-21a         |
| TC-CP-08 | Non-admin: no Refresh       | Signed in as Estimator/Viewer | 1. Look at the freshness card.                        | No "Refresh prices" button.                                                                   | FR-21a, NFR-16 |
| TC-CP-09 | Refresh updates last-pulled | Admin                         | 1. Click "Refresh prices".                            | Button shows "Refreshing…"; on success the affected provider's last-pulled date/time updates. | FR-21a, FR-21b |
| TC-CP-10 | Unit price money format     | —                             | 1. Inspect Unit price column.                         | Currency symbol + decimals (high-precision unit prices).                                      | NFR-13, NFR-14 |

---

## 7. Users (`UsersPage.tsx`) — FR-26, NFR-16 (Admin-only)

Add-user form (Email, Password ≥8, Name, Role) + a table with inline Role select, Active checkbox,
Last login, and Delete (with confirm).

| ID          | Title                        | Preconditions                 | Steps                                                                           | Expected result                                                                | Covers        |
| ----------- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------- |
| TC-USERS-01 | Create a user                | Signed in as admin            | 1. Enter email, an 8+ char password, name, role Estimator. 2. Click "Add user". | The user appears in the table; the form clears.                                | FR-26         |
| TC-USERS-02 | Password length enforced     | —                             | 1. Enter a 5-char password.                                                     | "Add user" stays disabled until password ≥ 8.                                  | FR-26, NFR-4  |
| TC-USERS-03 | Email required               | —                             | 1. Leave email blank.                                                           | "Add user" disabled.                                                           | FR-26         |
| TC-USERS-04 | Change a user's role         | A non-admin user exists       | 1. Change the inline Role select.                                               | Role persists; affects that user's permissions (verify by signing in as them). | FR-2, FR-26   |
| TC-USERS-05 | Activate/deactivate          | A user exists                 | 1. Toggle the Active checkbox.                                                  | Active state persists; a deactivated user cannot sign in.                      | FR-26         |
| TC-USERS-06 | Last login shown             | A user who has logged in      | 1. Read the Last login column.                                                  | Shows a date for users who've signed in; "—" otherwise.                        | FR-26         |
| TC-USERS-07 | Delete a user (confirm)      | A user exists                 | 1. Click "Delete". 2. Confirm.                                                  | After confirm the user is removed (right-to-delete).                           | FR-26, NFR-11 |
| TC-USERS-08 | Role labels DB-driven        | —                             | 1. Open a Role select.                                                          | Options reflect `ROLE` reference labels (fallback Admin/Estimator/Viewer).     | FR-29         |
| TC-USERS-09 | Non-admin cannot reach Users | Signed in as Estimator/Viewer | 1. Navigate to `/users` directly.                                               | The server denies user-management API calls; the page cannot load/list users.  | FR-26, NFR-16 |
| TC-USERS-10 | Loading/error states         | —                             | 1. Open the page.                                                               | "Loading…" then the table; API error renders a red message.                    | NFR-9         |

---

## 8. Roles & permissions (`RolesPage.tsx`) — FR-2, NFR-16

Read-only reference: three role summary cards (the signed-in role highlighted) and a capability matrix
with ✓/✕ per role grouped by category, mirroring server-side guards.

| ID          | Title                              | Preconditions          | Steps                                                                                 | Expected result                                                                                                                                                         | Covers       |
| ----------- | ---------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| TC-ROLES-01 | Role summary cards                 | Signed in              | 1. Open `/roles`.                                                                     | Three cards (Admin/Estimator/Viewer) with a one-line summary each; your current role's card is highlighted teal.                                                        | FR-2         |
| TC-ROLES-02 | Capability matrix                  | —                      | 1. Read the matrix.                                                                   | Rows grouped by category (Estimates, Reference & pricing, Governance configuration, Administration, Insights) with ✓ (allowed, green) / ✕ (not allowed, grey) per role. | FR-2, NFR-16 |
| TC-ROLES-03 | Current role highlighted in matrix | Signed in as Estimator | 1. Inspect the column for your role.                                                  | Your role's column header and cells are subtly highlighted.                                                                                                             | FR-2         |
| TC-ROLES-04 | Matrix mirrors actual enforcement  | —                      | 1. Pick a capability marked ✕ for your role. 2. Try that action elsewhere in the app. | The action is actually denied server-side, matching the matrix.                                                                                                         | NFR-16       |
| TC-ROLES-05 | Accessible to all roles            | Viewer                 | 1. Open `/roles`.                                                                     | Page loads for any signed-in role (it's read-only reference).                                                                                                           | FR-2         |

---

## 9. Reference data (`ReferenceDataPage.tsx`) — FR-29, NFR-17 (Admin-only)

Left list of reference types (with value counts, "(inactive)" marker), right value editor: a tree-aware
table (Code, Display name, Order, Active, Rename/Delete) plus an Add-value row (Code, Display name,
optional parent). Built-in values show a ● and cannot be deleted (only deactivated).

| ID        | Title                          | Preconditions              | Steps                                                    | Expected result                                                                 | Covers        |
| --------- | ------------------------------ | -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------- |
| TC-REF-01 | Type list renders              | Signed in as admin         | 1. Open `/reference-data`.                               | A left list of reference types each with a "· N" value count.                   | FR-29         |
| TC-REF-02 | Select a type shows its values | —                          | 1. Click a type (e.g. SDLC_PHASE).                       | The right editor lists that type's values, child values indented under parents. | FR-29, NFR-17 |
| TC-REF-03 | Add a value                    | A type selected            | 1. Enter a new Code + Display name, click "Add value".   | The value appears; code is upper-cased; form clears.                            | FR-29         |
| TC-REF-04 | Add a child value              | A type with a parent value | 1. Choose a parent in "under …", add.                    | The new value renders indented under its parent (└).                            | FR-29, NFR-17 |
| TC-REF-05 | Add disabled without code/name | —                          | 1. Leave code or name blank.                             | "Add value" disabled.                                                           | FR-29         |
| TC-REF-06 | Rename a value                 | A value exists             | 1. Click "Rename", enter a new name in the prompt.       | The display name updates immediately.                                           | FR-29, NFR-17 |
| TC-REF-07 | Change display order           | —                          | 1. Edit the Order number, blur.                          | The value's order persists and re-sequences usage across the app.               | FR-29         |
| TC-REF-08 | Toggle Active                  | —                          | 1. Click the Active/Inactive toggle.                     | State flips; deactivated values disappear from pickers elsewhere.               | FR-29, NFR-17 |
| TC-REF-09 | Built-in cannot be deleted     | A built-in (●) value       | 1. Look for its Delete button.                           | No Delete button on built-ins; only Rename + Active toggle.                     | FR-29         |
| TC-REF-10 | Custom value deletable         | A non-built-in value       | 1. Click "Delete", confirm.                              | The value is removed.                                                           | FR-29         |
| TC-REF-11 | Duplicate code rejected        | A value with code X exists | 1. Add another with code X.                              | A red error (unique constraint) is shown; not added.                            | FR-29         |
| TC-REF-12 | Changes need no redeploy       | —                          | 1. Rename a label, then view it in an estimate dropdown. | The new label shows without any rebuild/redeploy.                               | FR-29, NFR-17 |
| TC-REF-13 | Non-admin blocked              | Estimator/Viewer           | 1. Go to `/reference-data`.                              | List loads read-only-ish but admin CRUD calls are denied server-side.           | NFR-16        |

---

## 10. FX rates (`FxRatesPage.tsx`) — FR-17, FE-12 (Admin manage)

Table of currency → USD rates with an overall "Last updated" timestamp. Admins can edit rates inline,
add a new rate, and click "Refresh rates". USD is the immutable base.

| ID       | Title                   | Preconditions             | Steps                                                       | Expected result                                                                                     | Covers       |
| -------- | ----------------------- | ------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------ |
| TC-FX-01 | Rates table renders     | Signed in as admin        | 1. Open `/fx-rates`.                                        | A table of currencies, "Rate → USD", and updated-by/at; USD row present as base.                    | FR-17        |
| TC-FX-02 | Edit a rate inline      | A non-USD currency exists | 1. Change a rate value, blur.                               | The new rate persists; the "Updated" cell reflects you + the time.                                  | FR-17        |
| TC-FX-03 | USD is not editable     | —                         | 1. Look at the USD row.                                     | USD shows a static rate (no input); base currency.                                                  | FR-17        |
| TC-FX-04 | Add a new currency rate | Admin                     | 1. Enter a 3-letter code + rate, click "Add / update rate". | The new currency row appears; inputs clear.                                                         | FR-17        |
| TC-FX-05 | Currency code validated | —                         | 1. Enter `EU` or `eurr` as the code.                        | Add is blocked unless exactly 3 letters (auto-uppercased).                                          | FR-17        |
| TC-FX-06 | Decimal precision       | —                         | 1. Enter a rate like `0.917342`.                            | Accepted (step 0.000001) and stored.                                                                | FR-17, NFR-5 |
| TC-FX-07 | Refresh rates           | Admin                     | 1. Click "Refresh rates".                                   | Button shows "Refreshing…"; on success rates/timestamp update; on failure a red error banner shows. | FR-17        |
| TC-FX-08 | Non-admin: read-only    | Estimator/Viewer          | 1. Open `/fx-rates` (if reachable).                         | No add row, no inline editing, no Refresh button; rates display as static text.                     | NFR-16       |
| TC-FX-09 | Last-updated formatting | —                         | 1. Read the "Last updated (local)" value.                   | Formatted MM/DD/CCYY HH:MM:SS local, or "—" when none.                                              | NFR-13       |

---

## 11. Dashboard (`DashboardPage.tsx`) — FR-18

Stat tiles (Estimates, Drafts, Final, Total value per-currency, base-currency equivalent), a collapsible
"By workflow stage" list with per-stage drill-down, and a "Recent activity" list.

| ID         | Title                   | Preconditions              | Steps                        | Expected result                                                                                                 | Covers       |
| ---------- | ----------------------- | -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------ |
| TC-DASH-01 | Stat tiles render       | Some estimates exist       | 1. Open `/dashboard`.        | Tiles: Estimates count, Drafts, Final, Total value (per-currency joined by ·), and "Total (<base> equivalent)". | FR-18        |
| TC-DASH-02 | Per-currency totals     | Estimates in ≥2 currencies | 1. Read "Total value".       | Shows each currency's total separated by " · ".                                                                 | FR-18, FR-17 |
| TC-DASH-03 | By workflow stage list  | Estimates across stages    | 1. Read "By workflow stage". | A row per stage with its label and a count.                                                                     | FR-18, FR-24 |
| TC-DASH-04 | Stage drill-down        | A stage with ≥1 estimate   | 1. Click a stage row.        | It expands (▾) to list that stage's estimates with total + updated date; each links to its editor.              | FR-18        |
| TC-DASH-05 | Stage with no estimates | An empty stage             | 1. Expand it.                | "No estimates in this stage."                                                                                   | FR-18        |
| TC-DASH-06 | Recent activity         | Recently edited estimates  | 1. Read "Recent activity".   | A short list of recent estimates (name link + grand total).                                                     | FR-18        |
| TC-DASH-07 | Empty states            | Fresh system               | 1. Open the dashboard.       | "No estimates yet." / "Nothing yet." placeholders; tiles show 0 / "—".                                          | FR-18        |
| TC-DASH-08 | Loading/error           | —                          | 1. Open the page.            | "Loading…" then content; API error renders red.                                                                 | NFR-9        |

---

## 12. Workflows repo (`WorkflowsRepoPage.tsx`) — FR-24, FE-43 (Admin manage)

Table of workflows (Key, Label, Description, Stages, Transitions, Active) with inline edit for admins,
a create row, and an "Edit stages →" link. The default workflow cannot be deleted.

| ID        | Title                         | Preconditions      | Steps                                                              | Expected result                                                                       | Covers |
| --------- | ----------------------------- | ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------ |
| TC-WFR-01 | Workflows table               | Signed in as admin | 1. Open `/workflows`.                                              | A table with the seeded default workflow (· default), counts, and an Active checkbox. | FR-24  |
| TC-WFR-02 | Create a workflow             | Admin              | 1. Type a label (+ optional description), click "Create workflow". | A new workflow row appears; inputs clear.                                             | FR-24  |
| TC-WFR-03 | Create disabled without label | —                  | 1. Leave label blank.                                              | "Create workflow" disabled.                                                           | FR-24  |
| TC-WFR-04 | Edit label inline             | Admin              | 1. Change a workflow's Label, blur.                                | Persists (only if non-empty and changed).                                             | FR-24  |
| TC-WFR-05 | Edit description inline       | Admin              | 1. Edit Description, blur.                                         | Persists (including clearing it).                                                     | FR-24  |
| TC-WFR-06 | Toggle Active                 | Admin              | 1. Toggle Active checkbox.                                         | Persists.                                                                             | FR-24  |
| TC-WFR-07 | Default not deletable         | —                  | 1. Look at the default workflow row.                               | No Delete link for the default; non-default workflows show Delete.                    | FR-24  |
| TC-WFR-08 | Open authoring                | —                  | 1. Click "Edit stages →".                                          | Navigates to `/workflows/{id}`.                                                       | FR-24  |
| TC-WFR-09 | Non-admin read-only           | Estimator/Viewer   | 1. Open `/workflows` (if reachable).                               | No create row, no inline edits, no delete; labels render as static text.              | NFR-16 |
| TC-WFR-10 | Mutation error surfaced       | —                  | 1. Trigger a failing create (e.g. duplicate).                      | A red role=alert banner shows the error message.                                      | NFR-9  |

---

## 13. Workflow authoring (`WorkflowPage.tsx`) — FR-24, FE-43 (Admin)

Two cards: **Stages** (Key, Label, Order, Initial, Terminal) and **Transitions** (Key, From→To, Button
label, Context, Allowed role, Needs checklist). Admins add/edit/delete; non-admins see read-only.

| ID        | Title                                     | Preconditions                    | Steps                                                                                                       | Expected result                                                                    | Covers |
| --------- | ----------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| TC-WFA-01 | Stages list                               | A workflow open                  | 1. Open `/workflows/{id}`.                                                                                  | Stages sorted by order with Key, Label, Order, Initial/Terminal checkboxes.        | FR-24  |
| TC-WFA-02 | Add a stage                               | Admin                            | 1. Enter STAGE_KEY + Label, optionally Initial/Terminal, click "Add stage".                                 | The stage appears; key upper-cased; form resets.                                   | FR-24  |
| TC-WFA-03 | Add-stage disabled without key/label      | —                                | 1. Leave one blank.                                                                                         | "Add stage" disabled.                                                              | FR-24  |
| TC-WFA-04 | Edit stage label / order                  | Admin                            | 1. Change Label or Order, blur.                                                                             | Persists; list re-sorts on order change.                                           | FR-24  |
| TC-WFA-05 | Toggle Initial / Terminal                 | Admin                            | 1. Toggle a stage's Initial or Terminal.                                                                    | Persists; intended single-initial behavior.                                        | FR-24  |
| TC-WFA-06 | Delete a stage                            | Admin                            | 1. Click "Delete" on a stage.                                                                               | Removed.                                                                           | FR-24  |
| TC-WFA-07 | Transitions list                          | —                                | 1. View the Transitions card.                                                                               | From→To shown by stage labels; role and "Needs checklist" checkbox per row.        | FR-24  |
| TC-WFA-08 | Add a transition                          | Admin                            | 1. Pick From, To, Allowed role, Button label, optional Context, Needs-checklist. 2. Click "Add transition". | The transition appears; form resets.                                               | FR-24  |
| TC-WFA-09 | Add-transition disabled                   | —                                | 1. Leave From/To/label incomplete.                                                                          | "Add transition" disabled.                                                         | FR-24  |
| TC-WFA-10 | Edit transition role/label/desc/checklist | Admin                            | 1. Change Allowed role / label / context / Needs-checklist.                                                 | Each change persists.                                                              | FR-24  |
| TC-WFA-11 | Delete a transition                       | Admin                            | 1. Click "Delete".                                                                                          | Removed.                                                                           | FR-24  |
| TC-WFA-12 | Non-admin read-only                       | Estimator/Viewer                 | 1. Open the page.                                                                                           | "· read-only (admins can edit)" note; inputs render as static text; no add/delete. | NFR-16 |
| TC-WFA-13 | Edits reflect in estimate workflow card   | Admin edits the default workflow | 1. Add/rename a transition. 2. Open an estimate in that stage.                                              | The estimate's Approval workflow card shows the updated transitions/labels.        | FR-24  |

---

## 14. Checklist rule sets repo (`ChecklistRuleSetsPage.tsx`) — FR-25, FE-44 (Admin manage)

Table of rule sets (Key, Label, Description, Rules count, Active) with inline edit, a create row, and an
"Edit rules →" link. The default set validates every estimate and gates transitions; it can't be deleted.

| ID       | Title                           | Preconditions      | Steps                                                              | Expected result                                                          | Covers |
| -------- | ------------------------------- | ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------ |
| TC-RS-01 | Rule sets table                 | Signed in as admin | 1. Open `/checklist-rules`.                                        | The default rule set (· default) with a rules count and Active checkbox. | FR-25  |
| TC-RS-02 | Create a rule set               | Admin              | 1. Type a label (+ optional description), click "Create rule set". | New row appears; inputs clear.                                           | FR-25  |
| TC-RS-03 | Create disabled without label   | —                  | 1. Blank label.                                                    | "Create rule set" disabled.                                              | FR-25  |
| TC-RS-04 | Edit label / description inline | Admin              | 1. Edit and blur.                                                  | Persists.                                                                | FR-25  |
| TC-RS-05 | Toggle Active                   | Admin              | 1. Toggle Active.                                                  | Persists.                                                                | FR-25  |
| TC-RS-06 | Default not deletable           | —                  | 1. View the default row.                                           | No Delete for the default; others show Delete.                           | FR-25  |
| TC-RS-07 | Open rule editor                | —                  | 1. Click "Edit rules →".                                           | Navigates to `/checklist-rules/{id}`.                                    | FR-25  |
| TC-RS-08 | Non-admin read-only             | Estimator/Viewer   | 1. Open the page.                                                  | No create row / inline edits / delete.                                   | NFR-16 |

---

## 15. Checklist rules editor (`ChecklistRulesPage.tsx`) — FR-25, FE-44 (Admin)

A table of rules in one set: Rule (key + editable description), Scope, Severity (BLOCKER/WARNING/INFO),
Logic (built-in check vs advisory), Active toggle, and Delete (custom rules only). An Add-rule row lets
admins add advisory rules.

| ID       | Title                           | Preconditions    | Steps                                                           | Expected result                                                                                      | Covers       |
| -------- | ------------------------------- | ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| TC-CR-01 | Rules list                      | A rule set open  | 1. Open `/checklist-rules/{id}`.                                | A table of rules with key, scope label, severity badge, Logic ("built-in check"/"advisory"), Active. | FR-25        |
| TC-CR-02 | Toggle a rule active            | Admin            | 1. Toggle a rule's Active checkbox.                             | Persists; deactivating a built-in stops it from running.                                             | FR-25        |
| TC-CR-03 | Change severity                 | Admin            | 1. Change a rule's Severity select.                             | Persists; severity badge color reflects BLOCKER(rose)/WARNING(amber)/INFO(slate).                    | FR-25        |
| TC-CR-04 | Edit description                | Admin            | 1. Change a rule's description, blur.                           | Persists (non-empty, changed).                                                                       | FR-25        |
| TC-CR-05 | Add an advisory rule            | Admin            | 1. Enter a key, description, scope, severity, click "Add rule". | A new "advisory" rule (always passes) appears; key lower-cased; form resets.                         | FR-25        |
| TC-CR-06 | Add disabled without key/desc   | —                | 1. Blank key or description.                                    | "Add rule" disabled.                                                                                 | FR-25        |
| TC-CR-07 | Built-in cannot be deleted      | A built-in rule  | 1. Look at its row.                                             | Shows "built-in" instead of a Delete button.                                                         | FR-25        |
| TC-CR-08 | Custom rule deletable           | A custom rule    | 1. Click "Delete".                                              | Removed.                                                                                             | FR-25        |
| TC-CR-09 | BLOCKER gating note             | —                | 1. Read the page intro.                                         | States a failing BLOCKER stops an estimate advancing (cross-check with TC-WF-04).                    | FR-25, FR-24 |
| TC-CR-10 | Scope/severity labels DB-driven | —                | 1. Open the scope/severity selects.                             | Options from `CHECKLIST_SCOPE` / `CHECKLIST_SEVERITY` reference data.                                | FR-29        |
| TC-CR-11 | Non-admin read-only             | Estimator/Viewer | 1. Open the page.                                               | No add row / inline edits / delete.                                                                  | NFR-16       |

---

## 16. Statements of Work list (`SowListPage.tsx`) — BR-7

Create a SOW from an **approved** estimate (a dropdown of eligible estimates) and a table of SOWs
(Number, Title, Estimate, Client, Status, PDF link, Delete). An amber notice shows when nothing is
eligible. Create/delete are Admin/Estimator only; Viewers are read-only.

| ID         | Title                             | Preconditions                                                   | Steps                                                                           | Expected result                                                                             | Covers |
| ---------- | --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| TC-SOWL-01 | Create SOW from approved estimate | An estimate advanced to Approved/Final with a passing checklist | 1. Pick it in "Select an approved estimate…". 2. Click "New SOW from estimate". | A SOW is created and you navigate to its editor.                                            | BR-7   |
| TC-SOWL-02 | No eligible estimates notice      | No approved estimates                                           | 1. Open `/sow` as Admin/Estimator.                                              | An amber notice explains you must advance an estimate to Approved/Final first; no dropdown. | BR-7   |
| TC-SOWL-03 | Create disabled without selection | Eligible estimates exist                                        | 1. Leave the dropdown blank.                                                    | "New SOW from estimate" disabled.                                                           | BR-7   |
| TC-SOWL-04 | SOW table content                 | A SOW exists                                                    | 1. Read the table.                                                              | Columns: Number (mono), Title (link), Estimate, Client (or —), Status badge (Draft/Issued). | BR-7   |
| TC-SOWL-05 | Open a SOW                        | A SOW exists                                                    | 1. Click the Title link.                                                        | Opens `/sow/{id}` editor.                                                                   | BR-7   |
| TC-SOWL-06 | PDF link                          | A SOW exists                                                    | 1. Click "PDF →".                                                               | Opens `/sow/{id}/print`.                                                                    | BR-7   |
| TC-SOWL-07 | Delete a SOW (confirm)            | A SOW exists, Admin/Estimator                                   | 1. Click "Delete", confirm.                                                     | Removed after confirm.                                                                      | BR-7   |
| TC-SOWL-08 | Empty state                       | No SOWs                                                         | 1. Open the page.                                                               | "No statements of work yet." row.                                                           | BR-7   |
| TC-SOWL-09 | Viewer read-only                  | Signed in as Viewer                                             | 1. Open `/sow`.                                                                 | No create row and no Delete buttons; can still open/print.                                  | NFR-16 |

---

## 17. SOW editor (`SowEditorPage.tsx`) — BR-7

Header (title, Draft/Issued badge, number, source estimate, currency, last-saved). Actions: Save
changes, Issue (lock), Revert to draft, Open PDF view. A 2-col party block (Title, Effective date,
Client, Provider) and section textareas (Overview, Scope, Deliverables, Timeline, Payment Terms,
Assumptions, Terms & Conditions). Issued SOWs are locked; Viewers are read-only.

| ID         | Title                          | Preconditions                | Steps                                                                     | Expected result                                                                  | Covers       |
| ---------- | ------------------------------ | ---------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| TC-SOWE-01 | Edit fields & save             | A draft SOW, Admin/Estimator | 1. Change Title, Client, and the Scope textarea. 2. Click "Save changes". | Changes persist; "✓ Saved" indicator; last-saved time updates.                   | BR-7         |
| TC-SOWE-02 | Unsaved-changes indicator      | A draft SOW                  | 1. Edit a field but don't save.                                           | "● Unsaved changes" (amber) shows; "Save changes" enabled.                       | BR-7         |
| TC-SOWE-03 | Save disabled when clean       | Just-loaded SOW              | 1. Don't edit anything.                                                   | "Save changes" is disabled (not dirty).                                          | BR-7         |
| TC-SOWE-04 | All section textareas editable | A draft SOW                  | 1. Type into each of the 7 sections.                                      | Each accepts and displays multi-line text.                                       | BR-7         |
| TC-SOWE-05 | Effective date picker          | A draft SOW                  | 1. Pick an Effective date.                                                | The date is stored and reflected in the PDF header.                              | BR-7         |
| TC-SOWE-06 | Issue (lock)                   | A draft SOW                  | 1. Click "Issue (lock)", confirm.                                         | Status flips to Issued; fields become disabled (greyed); pricing is snapshotted. | BR-7, NFR-14 |
| TC-SOWE-07 | Issued is read-only            | An issued SOW                | 1. Try to edit a field.                                                   | All inputs disabled; a note says it's issued and locked.                         | BR-7         |
| TC-SOWE-08 | Revert to draft                | An issued SOW                | 1. Click "Revert to draft".                                               | Status returns to Draft; fields editable again.                                  | BR-7         |
| TC-SOWE-09 | Open PDF view                  | Any SOW                      | 1. Click "Open PDF view".                                                 | Navigates to the print page.                                                     | BR-7         |
| TC-SOWE-10 | Viewer fully read-only         | Signed in as Viewer          | 1. Open a SOW editor.                                                     | No Save/Issue/Revert buttons; all fields disabled.                               | NFR-16       |
| TC-SOWE-11 | Long text round-trips          | —                            | 1. Paste a long Terms & Conditions block, save, reopen.                   | The full text is preserved.                                                      | BR-7, NFR-8  |
| TC-SOWE-12 | Mutation error surfaced        | —                            | 1. Force a failing save.                                                  | A red role=alert banner shows the message.                                       | NFR-9        |

---

## 18. SOW print / PDF (`SowPrintPage.tsx`) — BR-7

Official print-ready document: centered "STATEMENT OF WORK" header, number/status/effective/issued line,
Client/Provider parties, numbered sections (1 Overview … 8 Terms), a Pricing table, a 9 Acceptance block
with signature lines, and a footer. "Print / Save as PDF" and the back link are hidden on print.

| ID         | Title                        | Preconditions             | Steps                                              | Expected result                                                                                                                              | Covers       |
| ---------- | ---------------------------- | ------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| TC-SOWP-01 | Document renders             | A SOW exists              | 1. Open `/sow/{id}/print`.                         | Title header, parties, numbered sections, Pricing table, Acceptance with signature lines, and footer.                                        | BR-7         |
| TC-SOWP-02 | Pricing rows                 | —                         | 1. Read the Pricing table.                         | One-time, Monthly, Yearly (annualized), Upcharge, Contingency, Grand total (cost, bold), Total price to Client (bold) — all money-formatted. | BR-7, FR-23  |
| TC-SOWP-03 | Draft vs issued pricing note | Draft then issued SOW     | 1. Open print for a draft, then for an issued one. | Draft: "Draft pricing reflects the current estimate…". Issued: "Pricing snapshotted at issue; it will not change…".                          | BR-7, NFR-14 |
| TC-SOWP-04 | Empty sections show em-dash  | A SOW with empty sections | 1. View those sections.                            | Empty prose renders as "—" rather than blank.                                                                                                | BR-7         |
| TC-SOWP-05 | Print / Save as PDF          | —                         | 1. Click "Print / Save as PDF".                    | Browser print/PDF dialog opens; the back link and button are not in the printed output.                                                      | BR-7         |
| TC-SOWP-06 | Footer attribution           | —                         | 1. Read the footer.                                | Shows the SOW number, source estimate name, and prepared-by email if present.                                                                | BR-7         |

---

## 19. Help & use cases (`HelpPage.tsx`) — NFR-12

Searchable, category-grouped use-case cards with numbered steps, persona badge, related links,
"Go there →" route links, requirement-ID chips, and deep-link anchors (`#uc-…`).

| ID         | Title                         | Preconditions              | Steps                                                  | Expected result                                                                             | Covers        |
| ---------- | ----------------------------- | -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------- |
| TC-HELP-01 | Guides render                 | Signed in                  | 1. Open `/help`.                                       | A sticky TOC and category sections, each with use-case cards (title, goal, persona, steps). | NFR-12        |
| TC-HELP-02 | Search filters guides         | —                          | 1. Type `cloud` in the search box.                     | Only matching guides + their categories remain; no-match shows "No guides match…".          | NFR-12        |
| TC-HELP-03 | TOC link scrolls + flashes    | —                          | 1. Click a TOC item.                                   | The page scrolls to that card and briefly highlights it.                                    | NFR-12        |
| TC-HELP-04 | Deep-link anchor              | —                          | 1. Visit `/help#uc-smart-checklist` (or any valid id). | Scrolls to and flashes that use case.                                                       | NFR-12        |
| TC-HELP-05 | "Go there →" route            | A guide with a route       | 1. Click "Go there →".                                 | Navigates to the referenced screen.                                                         | NFR-12        |
| TC-HELP-06 | Requirement chips             | —                          | 1. Inspect a card.                                     | Small mono chips show the FR/FE IDs the guide covers.                                       | NFR-12        |
| TC-HELP-07 | Reached from checklist "How?" | An estimate checklist item | 1. Click a checklist item's "How?".                    | Lands on the matching Help guide (cross-check TC-CHK-07).                                   | NFR-12, FR-25 |

---

## 20. User Guide (`UserGuidePage.tsx`) & Estimation Guide (`EstimationGuidePage.tsx`) — NFR-12

| ID          | Title                    | Preconditions | Steps                                  | Expected result                                                           | Covers |
| ----------- | ------------------------ | ------------- | -------------------------------------- | ------------------------------------------------------------------------- | ------ |
| TC-GUIDE-01 | User Guide renders       | Signed in     | 1. Open `/guide`.                      | A sticky Contents TOC + section articles (prose, bullets, related links). | NFR-12 |
| TC-GUIDE-02 | Section deep-link        | —             | 1. Visit `/guide#<section-id>`.        | Scrolls to and highlights that section.                                   | NFR-12 |
| TC-GUIDE-03 | TOC navigation           | —             | 1. Click a Contents item.              | Jumps to that section.                                                    | NFR-12 |
| TC-GUIDE-04 | Link to Help             | —             | 1. Click the inline "Help guide" link. | Navigates to `/help`.                                                     | NFR-12 |
| TC-GUIDE-05 | Estimation Guide renders | Signed in     | 1. Open `/estimation-guide`.           | The estimation methodology guide content renders and is navigable.        | NFR-12 |

---

## 21. Cross-cutting / regression checks

| ID      | Title                            | Preconditions                             | Steps                                                                                                                          | Expected result                                                                                     | Covers              |
| ------- | -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------- |
| TC-X-01 | RBAC deny-by-default sweep       | A Viewer account                          | 1. As a Viewer, attempt each admin action (create user, edit rate card, edit workflow, refresh prices, manage reference data). | Every protected mutation is denied server-side; no client-only gating is relied upon.               | FR-26, NFR-16       |
| TC-X-02 | Money formatting consistency     | Estimates in $/€/£                        | 1. Spot-check totals across editor, print, dashboard, SOW.                                                                     | Each currency renders its symbol + grouped 2 decimals consistently (e.g. `€1,234.50`).              | NFR-13              |
| TC-X-03 | Snapshot immutability end-to-end | A saved estimate with labor + cloud lines | 1. Change the rate card rate and refresh cloud prices. 2. Reopen the estimate, print, and (if issued) check the SOW.           | All snapshotted figures and totals are unchanged.                                                   | NFR-5, NFR-14, BR-3 |
| TC-X-04 | Calculation order                | A line + upcharge + contingency           | 1. Set upcharge 10%, contingency 5%. 2. Verify grand total.                                                                    | Upcharge applied to base, then contingency on the upcharged subtotal; totals match the engine math. | FR-7, FR-22         |
| TC-X-05 | Reference-label round-trip       | —                                         | 1. Rename a `BILLING_PERIOD` label in Reference data. 2. View a line item / picker.                                            | The new label shows everywhere; the stored code is unchanged.                                       | FR-29, NFR-17       |
| TC-X-06 | Audit trail present              | Create/modify an estimate or rate card    | 1. Perform create + edit actions. 2. Inspect via API/audit.                                                                    | Who-created / last-modified and timestamps are recorded (UTC).                                      | FR-11, NFR-11       |
| TC-X-07 | Keyboard navigation              | Any form screen                           | 1. Tab through a form (e.g. Login, New estimate, Add labor).                                                                   | Focus moves logically through fields/buttons; controls are reachable and operable by keyboard.      | NFR-8               |
| TC-X-08 | Health/readiness endpoints       | App up                                    | 1. GET `/health` and `/ready` on the API.                                                                                      | Both return healthy responses.                                                                      | NFR-3, NFR-9        |
| TC-X-09 | Swagger UI                       | App up                                    | 1. Open `http://localhost:8000/docs`.                                                                                          | The OpenAPI/Swagger UI lists the documented endpoints.                                              | FR-12               |

---

### Coverage note

Screens/cards covered (24 distinct UI surfaces): App shell · Login · SSO callback · Estimates list ·
Estimate editor header/exports · Totals · Capacity banner · Cost by category · Cost by SDLC phase ·
Approval workflow · Smart checklist · Scenarios · Baselines · Settings · Labor · Non-labor · Cloud
compute · Assumptions · Comments · Printable summary · Rate cards · Cloud prices · Users · Roles ·
Reference data · FX rates · Dashboard · Workflows repo · Workflow authoring · Checklist rule sets ·
Checklist rules editor · SOW list · SOW editor · SOW print · Help · User Guide / Estimation Guide ·
plus cross-cutting regression.

Requirement IDs referenced are those defined in `CLAUDE.md` Section 4 (BR-1…9, FR-1…29, NFR-1…17). When
a screen exercises behavior whose exact figures depend on the seeded data, recompute the expected value
from the rule in the requirement (e.g. FR-23 monthly/yearly, FR-22 upcharge order) rather than relying on
a fixed dollar amount.
