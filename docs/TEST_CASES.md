# Test Case Catalog — Kerdos (cost-reaper)

A human-readable catalog of **every automated test case** in the project, derived
directly from the test suites (`*.spec.ts` / `*.test.ts`). Each case is one `it()`
assertion; suites are grouped by the card / area they exercise.

**Total: 833 test cases across 33 suites.** All run in CI
(build → format → lint → typecheck → **test** → build) and must pass before merge;
the Playwright suite additionally runs the full stack end-to-end.

> Regenerate after adding tests: `python3 scripts/gen-test-catalog.py`, then prettier
> the file and re-render the .docx with the `pandoc/core` container.

## Summary

| Area                                        | Source file                                                                  |   Cases |
| ------------------------------------------- | ---------------------------------------------------------------------------- | ------: |
| Audit log                                   | `apps/api/src/common/audit/audit.spec.ts`                                    |      16 |
| GM visibility scope (FR-2)                  | `apps/api/src/common/gm-scope.spec.ts`                                       |      13 |
| RFC7807 problem+json                        | `apps/api/src/common/http/problem-details.spec.ts`                           |       2 |
| Pagination (FR-9)                           | `apps/api/src/common/pagination.spec.ts`                                     |      42 |
| Zod validation pipe                         | `apps/api/src/common/pipes/zod-validation.pipe.spec.ts`                      |       3 |
| Auth service                                | `apps/api/src/modules/auth/auth.service.spec.ts`                             |       4 |
| SSO config                                  | `apps/api/src/modules/auth/sso/sso-config.spec.ts`                           |       5 |
| Cloud price mappers                         | `apps/api/src/modules/cloud-pricing/price-mappers.spec.ts`                   |       5 |
| Dashboard card                              | `apps/api/src/modules/dashboard/dashboard-card.spec.ts`                      |      51 |
| Dashboard summariser                        | `apps/api/src/modules/dashboard/dashboard-summary.spec.ts`                   |       5 |
| Supporting documents                        | `apps/api/src/modules/documents/documents.spec.ts`                           |       6 |
| Assumptions / Comments / Reference / FX     | `apps/api/src/modules/estimates/assumptions-comments-reference-card.spec.ts` |      54 |
| Cloud compute card                          | `apps/api/src/modules/estimates/cloud-card.spec.ts`                          |      52 |
| Engine mapping                              | `apps/api/src/modules/estimates/engine-mapping.spec.ts`                      |       2 |
| Totals / Cost-by-category / SDLC-phase card | `apps/api/src/modules/estimates/engine-totals-card.spec.ts`                  |      56 |
| CSV export                                  | `apps/api/src/modules/estimates/estimate-csv.spec.ts`                        |       1 |
| Settings card                               | `apps/api/src/modules/estimates/estimate-settings-card.spec.ts`              |      52 |
| Labor card                                  | `apps/api/src/modules/estimates/labor-card.spec.ts`                          |      78 |
| Non-labor card                              | `apps/api/src/modules/estimates/nonlabor-card.spec.ts`                       |      52 |
| Volume / performance                        | `apps/api/src/modules/estimates/volume.spec.ts`                              |      10 |
| Excel export                                | `apps/api/src/modules/estimates/xlsx.spec.ts`                                |       6 |
| FX rate mapper                              | `apps/api/src/modules/fx/fx-rates.mapper.spec.ts`                            |       2 |
| Rate cards card                             | `apps/api/src/modules/rate-cards/rate-card.spec.ts`                          |      52 |
| Reference tree                              | `apps/api/src/modules/reference/reference-tree.spec.ts`                      |       3 |
| Roles & permissions (FR-30)                 | `apps/api/src/modules/roles/roles-permissions.spec.ts`                       |      36 |
| SOW milestone schedule                      | `apps/api/src/modules/sow/sow-milestones.spec.ts`                            |      14 |
| Users & Roles (RBAC)                        | `apps/api/src/modules/users/users-rbac-card.spec.ts`                         |      52 |
| Checklist rule sets card                    | `apps/api/src/modules/workflow/checklist-rule-sets.spec.ts`                  |      61 |
| Smart-checklist engine                      | `apps/api/src/modules/workflow/checklist-rules.spec.ts`                      |       8 |
| Approval workflow card                      | `apps/api/src/modules/workflow/workflow-card.spec.ts`                        |      52 |
| smoke                                       | `apps/web/e2e/smoke.spec.ts`                                                 |      13 |
| Estimation engine                           | `packages/engine/src/estimation-engine.test.ts`                              |      19 |
| Resource capacity (FR-27)                   | `packages/engine/src/resource-capacity.test.ts`                              |       6 |
| **Total**                                   |                                                                              | **833** |

---

## Audit log

_Source: `apps/api/src/common/audit/audit.spec.ts` — 16 cases_

**Audit · list query contract**

- AU-01 defaults to page 1, pageSize 50
- AU-02 coerces numeric strings (query params)
- AU-03 accepts a free-text search
- AU-04 accepts an entity-type filter
- AU-05 rejects page below 1
- AU-06 rejects pageSize above 200
- AU-07 rejects pageSize below 1
- AU-08 rejects a non-integer page
- AU-09 rejects an over-long search string
- AU-10 rejects an over-long entityType

**Audit · event DTO shape**

- AU-11 accepts a complete event
- AU-12 allows a null actor (system / deleted user)
- AU-13 rejects a missing action
- AU-14 rejects a non-uuid id

**Audit · permission (FR-30)**

- AU-15 audit.view is a valid permission
- AU-16 audit.view is in the permission catalog

## GM visibility scope (FR-2)

_Source: `apps/api/src/common/gm-scope.spec.ts` — 13 cases_

**GM scope · visible stages**

- GM-01 the queue is exactly In Review + Approved

**GM scope · isGmScoped**

- GM-02 a GM is scoped
- GM-03 Admin / Estimator / Viewer are not scoped
- GM-04 a custom role is not scoped
- GM-05 a missing / null user is not scoped

**GM scope · gmStageWhere**

- GM-06 a GM is limited to the queue stages
- GM-07 everyone else gets no restriction
- GM-08 the fragment is a fresh object (no shared mutable state)

**GM scope · gmCanViewStage**

- GM-09 a GM may view In Review
- GM-10 a GM may view Approved
- GM-11 a GM may not view Draft
- GM-12 a GM may not view Final / Archived / Unassigned
- GM-13 a non-GM may view any stage

## RFC7807 problem+json

_Source: `apps/api/src/common/http/problem-details.spec.ts` — 2 cases_

**toProblemDetails**

- builds a minimal problem+json document
- includes optional fields when provided

## Pagination (FR-9)

_Source: `apps/api/src/common/pagination.spec.ts` — 42 cases_

**Pagination · PaginationQuery contract**

- PG-01 defaults to page 1, pageSize 20, order desc
- PG-02 coerces numeric query strings
- PG-03 accepts order asc
- PG-04 rejects an unknown order
- PG-05 accepts an optional sort field
- PG-06 rejects page below 1
- PG-07 rejects pageSize above 200
- PG-08 rejects pageSize below 1
- PG-09 rejects a non-integer page
- PG-10 accepts pageSize at the bounds (1 and 200)

**Pagination · EstimateListQuery contract**

- PG-11 defaults to page 1, pageSize 20
- PG-12 coerces numeric query strings
- PG-13 accepts a search term and ownerId
- PG-14 rejects a non-uuid ownerId
- PG-15 rejects page below 1
- PG-16 rejects pageSize above 200
- PG-17 rejects pageSize below 1
- PG-18 rejects a non-integer pageSize
- PG-19 accepts pageSize at the 200 bound

**Pagination · pageSkipTake (DB skip/take)**

- PG-20 page 1 starts at skip 0
- PG-21 page 2 skips one page
- PG-22 page 3 skips two pages (size 50)
- PG-23 take equals pageSize
- PG-24 page 1 size 1
- PG-25 never returns a negative skip

**Pagination · lastPage**

- PG-26 zero rows is still 1 page
- PG-27 an exact multiple
- PG-28 a partial last page rounds up
- PG-29 fewer than one page is 1 page
- PG-30 exactly one full page
- PG-31 one over a page

**Pagination · paginate (slice semantics)**

- PG-32 an empty list yields no data, total 0
- PG-33 returns the first page slice
- PG-34 returns the second page slice (rows 21–40)
- PG-35 the last page may be partial
- PG-36 an out-of-range page returns no data but keeps the total
- PG-37 a page holds at most pageSize items
- PG-38 total is the full count regardless of page
- PG-39 echoes the requested page and pageSize
- PG-40 a single item on page 1
- PG-41 an exact page boundary fills the last page
- PG-42 pageSize 1 returns one item per page

## Zod validation pipe

_Source: `apps/api/src/common/pipes/zod-validation.pipe.spec.ts` — 3 cases_

**ZodValidationPipe**

- returns parsed value for valid input
- throws on invalid input
- reports the failing field path in the message

## Auth service

_Source: `apps/api/src/modules/auth/auth.service.spec.ts` — 4 cases_

**AuthService**

- registers a new user and returns a token pair
- rejects a duplicate email
- logs in with the correct password and rejects a wrong one
- issues fresh tokens from a valid refresh token

## SSO config

_Source: `apps/api/src/modules/auth/sso/sso-config.spec.ts` — 5 cases_

**resolveSsoConfig — picks which protocol to use**

- uses the built-in LOCAL identity by default / when off / when chosen
- resolves OIDC with its required fields
- resolves SAML and WSFED
- fails closed (disabled + reason) when required fields are missing
- reports an unknown protocol

## Cloud price mappers

_Source: `apps/api/src/modules/cloud-pricing/price-mappers.spec.ts` — 5 cases_

**mapAzureItems (FR-21a)**

- matches the Linux on-demand hourly price by Standard\_<sku>
- ignores Spot, Windows, wrong region and non-consumption items

**mapAwsPriceList (FR-21a)**

- extracts the on-demand USD/hour price for the matching instance type

**mapGcpSkus (FR-21a)**

- computes instance price = cores×core + ramGb×ram from separate SKUs
- returns nothing when the region or a SKU is missing

## Dashboard card

_Source: `apps/api/src/modules/dashboard/dashboard-card.spec.ts` — 51 cases_

**Dashboard · empty input**

- DB-01 totalEstimates is 0 for no estimates
- DB-02 has no byStatus field (status removed; stage is the source of truth)
- DB-03 byStage is empty
- DB-04 totalsByCurrency is empty
- DB-05 recent is empty
- DB-06 baseCurrencyTotal is 0.0000
- DB-07 baseCurrency is the configured base (USD)

**Dashboard · total count**

- DB-08 counts a single estimate
- DB-09 counts several estimates
- DB-10 counts a large volume

**Dashboard · by stage (counts)**

- DB-11 a single stage is counted
- DB-12 multiple stages are counted separately
- DB-13 In Review and Approved coexist as distinct buckets
- DB-14 the same stage aggregates into one bucket
- DB-15 accepts arbitrary (data-driven) stage keys
- DB-16 stage counts sum to the total
- DB-17 a bucket exists per distinct stage

**Dashboard · by stage**

- DB-18 a single stage is counted
- DB-19 multiple stages are counted separately
- DB-20 a null stage key buckets under UNASSIGNED
- DB-21 a null stage with no label shows "Unassigned"
- DB-22 the stage label comes from currentStageLabel
- DB-23 mixes assigned + unassigned stages
- DB-24 stage counts sum to the total
- DB-25 the first-seen label wins for a stage key

**Dashboard · totals by currency (exact decimals)**

- DB-26 sums a single currency
- DB-27 keeps currencies separate
- DB-28 is sorted by currency code
- DB-29 sums exact decimals (no float drift)
- DB-30 nets positive and negative amounts
- DB-31 a single estimate yields its own total
- DB-32 sums many values precisely
- DB-33 one bucket per distinct currency

**Dashboard · recent estimates**

- DB-34 returns most-recently-updated first
- DB-35 caps at the default limit of 5
- DB-36 honors a custom recent limit
- DB-37 returns all when fewer than the limit
- DB-38 a recentLimit of 0 returns none
- DB-39 the cap keeps the newest, drops the oldest
- DB-40 each recent row carries the headline fields
- DB-41 a recent row preserves a null stage key
- DB-42 does not mutate the input array order

**Dashboard · base-currency FX roll-up (FR-17)**

- DB-43 base currency passes through at rate 1
- DB-44 converts a foreign currency via the FX rate
- DB-45 sums base + converted foreign totals
- DB-46 a currency with no FX rate contributes 0
- DB-47 default (no fxRates) counts only base-currency totals
- DB-48 converts multiple foreign currencies
- DB-49 applies a fractional FX rate exactly
- DB-50 converts negative totals too

**Dashboard · output shape**

- DB-51 returns every dashboard field

## Dashboard summariser

_Source: `apps/api/src/modules/dashboard/dashboard-summary.spec.ts` — 5 cases_

**summarizeDashboard (FR-18)**

- returns zeros for no estimates
- counts by stage, and sums grand totals per currency exactly
- returns the most-recently-updated estimates, newest first, capped
- converts per-currency totals to the base currency via FX (FR-17)
- buckets estimates with no stage under Unassigned

## Supporting documents

_Source: `apps/api/src/modules/documents/documents.spec.ts` — 6 cases_

**Documents · DTO + limits**

- DOC-01 accepts a complete document
- DOC-02 allows a null description
- DOC-03 allows a null uploader (deleted user)
- DOC-04 rejects a non-integer size
- DOC-05 rejects a non-uuid id
- DOC-06 the upload limit is 10 MB

## Assumptions / Comments / Reference / FX

_Source: `apps/api/src/modules/estimates/assumptions-comments-reference-card.spec.ts` — 54 cases_

**Assumptions card (FR-8)**

- TC-01 a non-empty assumption is valid
- TC-02 rejects an empty assumption
- TC-03 rejects a missing text field
- TC-04 accepts a 2000-char assumption
- TC-05 rejects an assumption over 2000 chars
- TC-06 accepts a single character
- TC-07 rejects a non-string text
- TC-08 accepts multi-line text

**Comments card (FR-19)**

- TC-09 a non-empty comment is valid
- TC-10 rejects an empty comment
- TC-11 accepts a 4000-char comment
- TC-12 rejects a comment over 4000 chars
- TC-13 rejects a missing text
- TC-14 comments allow more text than assumptions (4000 vs 2000)
- TC-15 accepts emoji/unicode

**Reference-data card — types (FR-29)**

- TC-16 a valid reference type is accepted
- TC-17 displayOrder defaults to 0
- TC-18 accepts a description
- TC-19 rejects a lowercase code
- TC-20 rejects a code with a hyphen
- TC-21 rejects an empty code
- TC-22 accepts a code with digits
- TC-23 rejects an empty displayName
- TC-24 rejects a code over 80 chars
- TC-25 rejects a negative displayOrder

**Reference-data card — values (FR-29, parent/child)**

- TC-26 a valid reference value is accepted
- TC-27 accepts a parentId (hierarchy: phase → task)
- TC-28 accepts a null parentId (top-level value)
- TC-29 accepts metadata
- TC-30 rejects a non-uuid parentId
- TC-31 rejects a lowercase code
- TC-32 accepts a 160-char displayName
- TC-33 rejects a 161-char displayName
- TC-34 value update may deactivate (soft-delete)
- TC-35 value update may re-sequence via displayOrder
- TC-36 value update may rename the label (no code change)
- TC-37 value update rejects a negative displayOrder
- TC-38 value update may be empty

**FX card — rate contract (FR-12/FR-17)**

- TC-39 a positive decimal rate is valid
- TC-40 an integer rate string is valid
- TC-41 rejects a negative rate
- TC-42 rejects a non-numeric rate
- TC-43 rejects a numeric (non-string) rate
- TC-44 accepts a high-precision rate

**FX card — conversion math (scaleMoney)**

- TC-45 converts at a 1.1 rate
- TC-46 identity rate leaves the amount unchanged
- TC-47 converts down at a sub-1 rate
- TC-48 zero amount stays zero
- TC-49 keeps exact decimals
- TC-50 rounds half-up at 4 dp
- TC-51 honors a custom scale
- TC-52 large amount conversion
- TC-53 conversion is deterministic
- TC-54 a tiny rate converts precisely

## Cloud compute card

_Source: `apps/api/src/modules/estimates/cloud-card.spec.ts` — 52 cases_

**Cloud card · contract — valid + defaults**

- TC-01 minimal (cloudPriceId) is valid
- TC-02 quantity defaults to 1
- TC-03 usageHoursPerMonth defaults to 730
- TC-04 billingPeriod defaults to MONTHLY (cloud is recurring)
- TC-05 accepts an explicit quantity
- TC-06 accepts custom usage hours
- TC-07 accepts billingPeriod ONE_TIME (e.g. a reserved upfront)
- TC-08 accepts billingPeriod YEARLY
- TC-09 accepts a per-line upcharge override
- TC-10 accepts a null upcharge override
- TC-11 accepts an SDLC phase
- TC-12 accepts a null SDLC phase
- TC-13 accepts quantity 0
- TC-14 accepts usage 0
- TC-15 accepts a fractional usage value
- TC-16 accepts a large quantity

**Cloud card · contract — rejected**

- TC-17 rejects a missing cloudPriceId
- TC-18 rejects a non-uuid cloudPriceId
- TC-19 rejects a negative quantity
- TC-20 rejects negative usage hours
- TC-21 rejects an unknown billingPeriod
- TC-22 rejects an upcharge override above 100
- TC-23 rejects a negative upcharge override
- TC-24 rejects a string quantity (no coercion)
- TC-25 rejects an SDLC phase over 80 chars

**Cloud card · line total = unitPrice × (qty × usage)**

- TC-26 one instance, full month at $0.10/hr → 730 hrs = 73
- TC-27 three instances, full month
- TC-28 partial usage (200 hrs)
- TC-29 high-precision unit price (6 dp)
- TC-30 zero usage → zero
- TC-31 zero quantity → zero
- TC-32 storage priced per GB-month (qty=GB, usage=1)
- TC-33 large fleet
- TC-34 fractional usage hours
- TC-35 unit price with trailing precision rounds half-up

**Cloud card · snapshot immutability intent (NFR-14)**

- TC-36 total depends only on the snapshot passed in
- TC-37 same inputs always yield the same total (deterministic)
- TC-38 a different snapshot yields a different total

**Cloud card · boundary values**

- TC-39 upcharge override exactly 100
- TC-40 upcharge override exactly 0
- TC-41 quantity exactly 0 is allowed by the contract
- TC-42 default usage 730 reflects ~hours per month
- TC-43 ONE_TIME cloud line (reserved upfront) is valid
- TC-44 a fractional quantity is allowed
- TC-45 a very small unit price computes
- TC-46 a reserved-instance upfront ($/qty, usage 1)
- TC-47 730-hour month is the recurring default basis
- TC-48 requests-priced service (qty=millions, usage=1)
- TC-49 a GB-month at $0.09
- TC-50 a multi-instance partial-usage workload
- TC-51 accepts usage at a high value
- TC-52 accepts a combined custom quantity + usage + phase + override

## Engine mapping

_Source: `apps/api/src/modules/estimates/engine-mapping.spec.ts` — 2 cases_

**buildEngineInput + computeEstimate**

- maps labor (one-time) + cloud (monthly) with a global upcharge
- respects a per-line upcharge override

## Totals / Cost-by-category / SDLC-phase card

_Source: `apps/api/src/modules/estimates/engine-totals-card.spec.ts` — 56 cases_

**Totals card · base roll-ups**

- TC-01 empty estimate → all zeros
- TC-02 single one-time line → one-time subtotal
- TC-03 quantity multiplies the base
- TC-04 one-time grand total equals its subtotal with no contingency
- TC-05 one-time does not contribute to monthly/yearly subtotals
- TC-06 monthly line → monthly subtotal + ×12 yearly
- TC-07 monthly line grand total is the annualized (×12) figure
- TC-08 yearly line → yearly subtotal + ÷12 monthly
- TC-09 yearly line grand total equals its amount
- TC-10 mixed one-time + monthly + yearly grand total
- TC-11 zero base line contributes nothing
- TC-12 multiple one-time lines aggregate

**Totals card · upcharge (FR-22)**

- TC-13 global upcharge marks up the line
- TC-14 upchargeAmount reports the added markup
- TC-15 per-line override beats the global
- TC-16 a per-line override of 0 disables upcharge for that line
- TC-17 a null override falls back to the global
- TC-18 global upcharge 0 → no markup
- TC-19 100% upcharge doubles the line
- TC-20 upcharge total sums across lines
- TC-21 upcharge applies before the recurring annualization

**Totals card · contingency (FR-7)**

- TC-22 contingency applies on the upcharged subtotal
- TC-23 contingencyAmount reported
- TC-24 upcharge THEN contingency (order matters)
- TC-25 contingency 0 → grand equals upcharged subtotal sum
- TC-26 oneTimeTotal applies contingency to the one-time subtotal
- TC-27 yearlyTotal applies contingency to the yearly subtotal

**Totals card · margin & tax (FR-16)**

- TC-28 margin: sell = grand / (1 − margin)
- TC-29 marginAmount = sell − grand
- TC-30 margin 0 → sell equals grand
- TC-31 margin 100 is guarded (sell = grand, no divide-by-zero)
- TC-32 tax applies on the sell price
- TC-33 margin then tax compose
- TC-34 no margin/tax → clientPrice equals grand

**Cost-by-category card**

- TC-35 one bucket per category
- TC-36 lines of the same category aggregate
- TC-37 categories are sorted alphabetically
- TC-38 category monthly bucket annualizes into its yearly column
- TC-39 category yearly bucket back-fills its monthly column (÷12)
- TC-40 category subtotal reflects per-line upcharge
- TC-41 distinct categories produce distinct buckets

**Cost-by-SDLC-phase card (FR-28)**

- TC-42 a null phase rolls up under "Unassigned"
- TC-43 a tagged phase appears by code
- TC-44 phases sort in lifecycle order
- TC-45 "Unassigned" sorts after the canonical phases
- TC-46 lines of the same phase aggregate
- TC-47 phase monthly/yearly columns annualize like categories
- TC-48 an unknown (admin-added) phase sorts after the canonical ones but before Unassigned-only

**Totals card · rounding & scale (NFR-5)**

- TC-49 default money scale is 4 decimals
- TC-50 a custom money scale of 2 is honored
- TC-51 a money scale of 0 rounds to whole units
- TC-52 thirds round half-up at scale (100/3 monthly → yearly exact 1200)
- TC-53 exact decimal accumulation across many lines

**Totals card · combined scenario**

- TC-54 upcharge + contingency + margin + tax end-to-end
- TC-55 categories and phases both populate from one set of lines
- TC-56 grand total ties out to one-time + annualized recurring after contingency

## CSV export

_Source: `apps/api/src/modules/estimates/estimate-csv.spec.ts` — 1 cases_

**toCsv**

- includes a header, the line, and the grand total; escapes commas

## Settings card

_Source: `apps/api/src/modules/estimates/estimate-settings-card.spec.ts` — 52 cases_

**Settings card · create — valid + defaults**

- TC-01 minimal create (name + currency) is valid
- TC-02 percents default to 0
- TC-03 accepts a description
- TC-04 accepts a rateCardId (uuid)
- TC-05 accepts a global upcharge
- TC-06 accepts a contingency
- TC-07 accepts a margin
- TC-08 accepts a tax
- TC-09 accepts a 1-char name
- TC-10 accepts a 200-char name
- TC-11 accepts EUR / GBP currencies
- TC-12 accepts upcharge at the 100 bound
- TC-13 accepts contingency at the 0 bound
- TC-14 accepts a 4000-char description
- TC-15 accepts a fractional contingency

**Settings card · create — rejected**

- TC-16 rejects an empty name
- TC-17 rejects a name over 200 chars
- TC-18 rejects a missing currency
- TC-19 rejects a lowercase currency
- TC-20 rejects a 2-letter currency
- TC-21 rejects a 4-letter currency
- TC-22 rejects a non-uuid rateCardId
- TC-23 rejects an upcharge above 100
- TC-24 rejects a negative upcharge
- TC-25 rejects a contingency above 100
- TC-26 rejects a negative margin
- TC-27 rejects a tax above 100
- TC-28 rejects a description over 4000 chars
- TC-29 rejects a non-string name
- TC-30 rejects a string percent (no coercion)

**Settings card · update — partial edits**

- TC-31 an empty update is valid (no-op)
- TC-32 update just the name
- TC-33 update no longer carries a status (workflow stage is the source of truth)
- TC-34 update only the global upcharge
- TC-35 update only the contingency
- TC-36 update margin + tax together
- TC-37 clear the description with null
- TC-38 clear the rate card with null
- TC-39 set a rate card by uuid
- TC-40 update does NOT accept a currency change (fixed at create)
- TC-41 accepts a name at the 200-char bound
- TC-42 rejects a name over 200 chars
- TC-43 rejects an empty name on update
- TC-44 rejects an upcharge over 100 on update
- TC-45 rejects a negative contingency on update
- TC-46 rejects a non-uuid rateCardId on update
- TC-47 accepts upcharge 0 on update (explicit zero)
- TC-48 accepts margin at the 100 bound
- TC-49 rejects a description over 4000 on update
- TC-50 accepts a description at exactly 4000 on update
- TC-51 accepts a fractional tax on update
- TC-52 accepts all settings updated at once

## Labor card

_Source: `apps/api/src/modules/estimates/labor-card.spec.ts` — 78 cases_

**Labor card · input contract — valid**

- TC-01 accepts the minimal line (just units) and applies defaults
- TC-02 accepts units = 0 (the engine yields a 0 line total)
- TC-03 accepts quantity = 0 at the contract level (web now blocks it)
- TC-04 accepts a fractional quantity
- TC-05 accepts a fractional units value
- TC-06 accepts a valid rateCardRoleId (uuid)
- TC-07 accepts an explicit rateSnapshot decimal string
- TC-08 accepts billingPeriod MONTHLY
- TC-09 accepts billingPeriod YEARLY
- TC-10 defaults billingPeriod to ONE_TIME when omitted
- TC-11 accepts allocationPercent at the lower bound (0)
- TC-12 accepts a split allocationPercent (50)
- TC-13 accepts allocationPercent at the upper bound (100)
- TC-14 accepts a null upcharge override (use the global)
- TC-15 accepts a fractional upcharge override
- TC-16 accepts a start+end window with end after start
- TC-17 accepts a single-day window (start === end)
- TC-18 accepts a valid ascending three-point (PERT) estimate
- TC-19 accepts an equal three-point estimate (o = m = p)
- TC-20 accepts an SDLC phase code
- TC-21 accepts a null SDLC phase
- TC-22 accepts a resourceName at the 200-char limit
- TC-23 accepts a description at the 500-char limit

**Labor card · input contract — rejected**

- TC-24 rejects a line with no units
- TC-25 rejects negative units
- TC-26 rejects negative quantity
- TC-27 rejects a rateCardRoleId that is not a uuid
- TC-28 rejects an unknown billingPeriod
- TC-29 rejects allocationPercent above 100
- TC-30 rejects a negative allocationPercent
- TC-31 rejects an upcharge override above 100
- TC-32 rejects a start date with no end date
- TC-33 rejects an end date with no start date
- TC-34 rejects an end date before the start date
- TC-35 rejects a non-ISO date format
- TC-36 rejects a partial three-point estimate (only optimistic)
- TC-37 rejects a partial three-point estimate (missing pessimistic)
- TC-38 rejects a three-point estimate that is not ordered (o > m > p)
- TC-39 rejects a three-point estimate with most-likely above pessimistic
- TC-40 rejects an SDLC phase longer than 80 chars
- TC-41 rejects a resourceName longer than 200 chars
- TC-42 rejects a description longer than 500 chars
- TC-43 KNOWN LIMITATION: a calendar-invalid but well-formatted date is accepted (regex-only)

**Labor card · PERT effective units**

- TC-44 (o + 4m + p) / 6 for 8/10/18 = 11
- TC-45 all-zero three-point yields 0
- TC-46 equal three-point yields that value
- TC-47 wide spread 10/20/60 = 25
- TC-48 produces a fractional expected value (2/4/9 = 4.5)
- TC-49 produces a repeating fraction (1/2/4 ≈ 2.1667)

**Labor card · line total math**

- TC-50 rate × quantity → 4 decimals
- TC-51 mirrors the service: rate × (qty × units) for 2 × 160 @ $100
- TC-52 fractional rate
- TC-53 zero quantity → zero
- TC-54 zero rate → zero
- TC-55 keeps exact decimals (33.333 × 3 = 99.9990)
- TC-56 rounds half-up at the 4th decimal
- TC-57 honors a custom scale

**Labor card · PERT drives the line total**

- TC-58 8/10/18 over qty 2 @ $100 → 2 × 11 × 100 = 2200
- TC-59 equal three-point 6/6/6 over qty 4 @ $100 → 2400
- TC-60 fractional PERT 2/4/9 (=4.5) over qty 1 @ $90 → 405

**Labor card · resource capacity (FR-27)**

- TC-61 no lines → no violations
- TC-62 a single 100% line is fine
- TC-63 a line with no resource name is ignored
- TC-64 a resource line with no dates is ignored (unschedulable)
- TC-65 a line with a start but no end is ignored
- TC-66 two non-overlapping windows for the same resource are fine
- TC-67 overlapping 60% + 60% on the same resource over-allocates (120%)
- TC-68 reports the earliest offending date
- TC-69 adjacent windows (end day, next start day) do NOT overlap
- TC-70 same-day boundary (A ends 07-10, B starts 07-10) DOES overlap
- TC-71 a clean 50% + 50% split to exactly 100% is fine
- TC-72 50% + 60% to 110% over-allocates
- TC-73 exactly 100% is NOT a violation (strict greater-than)
- TC-74 three overlapping 40% lines reach 120%
- TC-75 different resources do not pool capacity
- TC-76 a malformed window (end before start) is skipped
- TC-77 resource names are trimmed so " Alice " and "Alice" pool together
- TC-78 reports one violation per over-allocated resource

## Non-labor card

_Source: `apps/api/src/modules/estimates/nonlabor-card.spec.ts` — 52 cases_

**Non-labor card · contract — valid + defaults**

- TC-01 minimal (category + amount) is valid
- TC-02 type defaults to FIXED
- TC-03 billingPeriod defaults to ONE_TIME
- TC-04 periods defaults to 1
- TC-05 accepts type RECURRING
- TC-06 accepts billingPeriod MONTHLY
- TC-07 accepts billingPeriod YEARLY
- TC-08 accepts a description
- TC-09 accepts a decimal amount
- TC-10 accepts amount 0
- TC-11 accepts a multi-period count
- TC-12 accepts a per-line upcharge override
- TC-13 accepts a null upcharge override
- TC-14 accepts an SDLC phase
- TC-15 accepts a null SDLC phase
- TC-16 accepts a 120-char category
- TC-17 accepts a 500-char description

**Non-labor card · contract — rejected**

- TC-18 rejects an empty category
- TC-19 rejects a missing amount
- TC-20 rejects a non-decimal amount
- TC-21 rejects a numeric (non-string) amount
- TC-22 rejects an unknown type
- TC-23 rejects an unknown billingPeriod
- TC-24 rejects periods below 1
- TC-25 rejects a fractional period count
- TC-26 rejects a negative period count
- TC-27 rejects an upcharge override above 100
- TC-28 rejects a category over 120 chars
- TC-29 rejects a description over 500 chars
- TC-30 rejects an SDLC phase over 80 chars

**Non-labor card · line total = amount × periods**

- TC-31 single period
- TC-32 twelve periods
- TC-33 decimal amount × periods
- TC-34 zero amount
- TC-35 large period count
- TC-36 fractional amount keeps exact decimals
- TC-37 single big amount
- TC-38 rounds half-up at 4 dp

**Non-labor card · billing-period intent (documents recurring roll-up)**

- TC-39 a FIXED one-time license is a single charge
- TC-40 a RECURRING monthly subscription is valid
- TC-41 a RECURRING yearly subscription is valid
- TC-42 amount × periods for a 3-year prepay
- TC-43 a monthly amount across 6 periods
- TC-44 a high-precision unit amount

**Non-labor card · boundary values**

- TC-45 upcharge override exactly 100 is valid
- TC-46 upcharge override exactly 0 is valid
- TC-47 periods exactly 1 is valid
- TC-48 a 1-char category is valid
- TC-49 negative amount string is allowed by Money format (credit)
- TC-50 amount with many decimals is allowed
- TC-51 RECURRING + ONE_TIME is accepted by the contract (engine handles roll-up)
- TC-52 FIXED + MONTHLY is accepted by the contract

## Volume / performance

_Source: `apps/api/src/modules/estimates/volume.spec.ts` — 10 cases_

**Volume · large single estimate**

- VOL-01 computes a 500-line estimate with the correct grand total
- VOL-02 a 500-line estimate computes well under 500ms
- VOL-03 a 200-line recalculation (NFR-1) completes under 500ms
- VOL-04 categories aggregate correctly at volume (5 buckets of 100 lines)
- VOL-05 a 1000-line estimate still computes under 1s and stays exact

**Volume · 500-estimate batch (NFR-2)**

- VOL-06 computes 500 estimates with consistent, correct totals
- VOL-07 the 500-estimate batch completes in a reasonable time
- VOL-08 a 500-estimate batch with mixed billing periods annualizes correctly

**Volume · capacity sweep at scale (FR-27)**

- VOL-09 500 non-overlapping single-day assignments for distinct resources → no violations
- VOL-10 one over-allocated resource among 500 is detected

## Excel export

_Source: `apps/api/src/modules/estimates/xlsx.spec.ts` — 6 cases_

**crc32**

- matches the standard CRC-32 check vector

**colRef**

- maps 0-based indexes to A1 column letters

**zip**

- produces a valid archive whose entries inflate back to their content

**buildXlsx**

- is a ZIP starting with the PK magic
- contains the required OOXML parts (filenames stored in headers)
- round-trips the sheet XML with numeric and inline-string cells

## FX rate mapper

_Source: `apps/api/src/modules/fx/fx-rates.mapper.spec.ts` — 2 cases_

**mapFxRates**

- inverts foreign-per-USD into USD-per-foreign (rateToBase), 6 dp
- omits USD and skips unknown / non-positive / non-finite rates

## Rate cards card

_Source: `apps/api/src/modules/rate-cards/rate-card.spec.ts` — 52 cases_

**Rate card · create contract — valid**

- TC-01 minimal card (name + currency) is valid
- TC-02 roles default to an empty array
- TC-03 a card with roles is valid
- TC-04 a card with several roles is valid
- TC-05 accepts EUR currency
- TC-06 accepts a 160-char name
- TC-07 accepts a 1-char name

**Rate card · create contract — rejected**

- TC-08 rejects an empty name
- TC-09 rejects a name over 160 chars
- TC-10 rejects a missing currency
- TC-11 rejects a lowercase currency
- TC-12 rejects a malformed currency
- TC-13 rejects a card whose role is invalid
- TC-14 rejects roles that are not an array

**Rate card · role contract — valid**

- TC-15 a HOUR role is valid
- TC-16 a DAY role is valid
- TC-17 accepts a decimal rate
- TC-18 accepts a high-precision rate
- TC-19 accepts a rate of 0
- TC-20 accepts a 120-char role name

**Rate card · role contract — rejected**

- TC-21 rejects an empty role name
- TC-22 rejects a role name over 120 chars
- TC-23 rejects an unknown unit
- TC-24 rejects a lowercase unit
- TC-25 rejects a non-decimal rate
- TC-26 rejects a numeric (non-string) rate
- TC-27 rejects a missing unit
- TC-28 rejects a missing rate

**Rate card · update contracts**

- TC-29 an empty card update is valid
- TC-30 rename a card
- TC-31 deactivate a card
- TC-32 rejects an empty name on card update
- TC-33 an empty role update is valid
- TC-34 update only a role rate
- TC-35 update only a role unit
- TC-36 rejects an invalid unit on role update
- TC-37 rejects a bad rate on role update

**Rate card · labor line total from a snapshotted rate**

- TC-38 $150/hr × 2 people × 160 hrs = 48,000
- TC-39 $200/hr × 1 × 40 hrs = 8,000
- TC-40 a DAY-unit role: $1,200/day × 1 × 10 days = 12,000
- TC-41 fractional rate $187.50/hr × 1 × 8 = 1,500
- TC-42 rate 0 → line total 0
- TC-43 high-precision rate keeps exact decimals
- TC-44 a 1-hour task
- TC-45 a team of 5 for a full month (5 × 160)

**Rate card · snapshot semantics (BR-3, NFR-5)**

- TC-46 total uses the snapshot, not a later rate
- TC-47 a changed rate would only affect new lines (different result)
- TC-48 the same snapshot is deterministic
- TC-49 a card may legitimately carry a 0 rate (placeholder role)
- TC-50 a very high rate is allowed
- TC-51 currency lives on the card, not the role
- TC-52 a card with many roles parses

## Reference tree

_Source: `apps/api/src/modules/reference/reference-tree.spec.ts` — 3 cases_

**buildReferenceTree (FR-29)**

- nests children under their parent, preserving input order
- surfaces an orphaned child (missing/inactive parent) as a root
- maps metadataJson to metadata and dates to ISO strings

## Roles & permissions (FR-30)

_Source: `apps/api/src/modules/roles/roles-permissions.spec.ts` — 36 cases_

**FR-30 · permission catalog**

- TC-01 the wildcard permission is "\*"
- TC-02 estimate.author is a valid permission
- TC-03 roles.manage is a valid permission
- TC-04 users.manage is a valid permission
- TC-05 an unknown permission is rejected
- TC-06 the wildcard is NOT a catalog permission key
- TC-07 the catalog covers every permission key
- TC-08 every catalog entry has a label, description, and group
- TC-09 there are no duplicate permission keys
- TC-10 the catalog includes the workflow.advance permission

**FR-30 · RoleCode format**

- TC-11 accepts UPPER_SNAKE
- TC-12 accepts digits and underscores
- TC-13 accepts the built-in codes
- TC-14 rejects lowercase
- TC-15 rejects a hyphen
- TC-16 rejects a space
- TC-17 rejects a leading digit
- TC-18 rejects empty
- TC-19 rejects over 40 chars

**FR-30 · create role contract**

- TC-20 a minimal role is valid
- TC-21 permissions default to an empty array
- TC-22 accepts a set of valid permissions
- TC-23 accepts a description
- TC-24 rejects a malformed code
- TC-25 rejects an empty display name
- TC-26 rejects an unknown permission
- TC-27 rejects the wildcard as an assignable permission (built-in only)
- TC-28 rejects a display name over 80 chars

**FR-30 · update role contract**

- TC-29 an empty update is valid
- TC-30 may set permissions
- TC-31 may set an empty permission set (revoke all)
- TC-32 may deactivate
- TC-33 may rename
- TC-34 may clear the description with null
- TC-35 rejects an unknown permission on update
- TC-36 rejects an empty display name on update

## SOW milestone schedule

_Source: `apps/api/src/modules/sow/sow-milestones.spec.ts` — 14 cases_

**SOW milestone schedule = cost per SDLC phase**

- MS-01 each tagged phase becomes a milestone with its one-time fee
- MS-02 the milestone fee is qty × base for the phase
- MS-03 multiple lines in the same phase aggregate into one milestone
- MS-04 milestones list in SDLC lifecycle order
- MS-05 untagged lines roll up under an "Unassigned" milestone, listed last
- MS-06 the milestone fees sum to the one-time subtotal (the milestone total)
- MS-07 a recurring-only phase has a ZERO one-time milestone fee (billed on cadence, not a milestone)
- MS-08 a phase mixing one-time + monthly splits the milestone fee from the recurring
- MS-09 a yearly-billed phase annualizes (monthly = yearly ÷ 12), one-time stays 0
- MS-10 the milestone fee INCLUDES the upcharge (post-markup)
- MS-11 a per-line upcharge override flows into that phase milestone fee
- MS-12 contingency is EXCLUDED from milestone fees (carried in the grand total)
- MS-13 an estimate with no lines has no milestones
- MS-14 a full phased build produces one milestone per phase with correct fees

## Users & Roles (RBAC)

_Source: `apps/api/src/modules/users/users-rbac-card.spec.ts` — 52 cases_

**Roles · the Role enum (FR-2, FR-26)**

- TC-01 ADMIN is a valid role
- TC-02 ESTIMATOR is a valid role
- TC-03 VIEWER is a valid role
- TC-04 GM is a valid role (the approver role)
- TC-05 the enum has exactly the four known roles
- TC-06 an unknown role is rejected
- TC-07 a lowercase role is rejected
- TC-08 an empty role is rejected

**Users · create contract — valid + defaults**

- TC-09 minimal create (email + password) is valid
- TC-10 role defaults to ESTIMATOR
- TC-11 create an ADMIN
- TC-12 create a GM
- TC-13 create a VIEWER
- TC-14 accepts a display name
- TC-15 accepts an exactly-8-char password
- TC-16 accepts a 120-char display name
- TC-17 accepts a plus-addressed email

**Users · create contract — rejected**

- TC-18 rejects a missing email
- TC-19 rejects an invalid email
- TC-20 rejects a missing password
- TC-21 rejects a password under 8 chars
- TC-22 rejects a malformed role code (membership is validated server-side, FR-30)
- TC-23 rejects an empty display name
- TC-24 rejects a display name over 120 chars
- TC-25 rejects an email without a domain

**Users · update contract (admin edits, FR-26)**

- TC-26 an empty update is valid
- TC-27 change role to ADMIN
- TC-28 change role to GM
- TC-29 change role to VIEWER
- TC-30 deactivate an account
- TC-31 reactivate an account
- TC-32 rename the display name
- TC-33 change role and active together
- TC-34 rejects a malformed role code on update (membership server-side, FR-30)
- TC-35 rejects an empty display name on update
- TC-36 rejects a non-boolean isActive

**Auth · login contract (FR-1)**

- TC-37 valid login
- TC-38 rejects a missing password
- TC-39 rejects an empty password
- TC-40 rejects an invalid email
- TC-41 login does not enforce the 8-char min (that is for sign-up)

**Auth · self-registration contract (FR-1)**

- TC-42 valid registration
- TC-43 accepts an optional display name
- TC-44 rejects a password under 8 chars
- TC-45 rejects an invalid email
- TC-46 registration carries no role field (least privilege assigned server-side)

**RBAC · role-string round-trips (used by guards & reference data)**

- TC-47 ADMIN round-trips through the enum
- TC-48 GM round-trips through the enum
- TC-49 a create with each role parses
- TC-50 an update to each role parses
- TC-51 whitespace role is rejected
- TC-52 numeric role is rejected

## Checklist rule sets card

_Source: `apps/api/src/modules/workflow/checklist-rule-sets.spec.ts` — 61 cases_

**Rule sets · severity enum**

- CS-01 BLOCKER is valid
- CS-02 WARNING is valid
- CS-03 INFO is valid
- CS-04 an unknown severity is rejected
- CS-05 a lowercase severity is rejected
- CS-06 the enum has exactly the three severities

**Rule sets · scope enum**

- CS-07 ESTIMATE is valid
- CS-08 LABOR / NONLABOR / CLOUD / RESOURCE are valid
- CS-09 an unknown scope is rejected
- CS-10 the enum has exactly the five scopes

**Rule sets · rule-set DTO**

- CS-11 a complete rule-set DTO is valid
- CS-12 a null description is allowed
- CS-13 ruleCount must be an integer
- CS-14 a non-uuid id is rejected
- CS-15 isDefault must be a boolean

**Rule sets · create-rule-set contract**

- CS-16 minimal (name) is valid
- CS-17 with a description is valid
- CS-18 rejects an empty name
- CS-19 rejects a missing name
- CS-20 accepts a 1-char name
- CS-21 accepts an 80-char name
- CS-22 rejects a name over 80 chars
- CS-23 accepts a 500-char description
- CS-24 rejects a description over 500 chars

**Rule sets · update-rule-set contract**

- CS-25 an empty update is valid (no-op)
- CS-26 rename is valid
- CS-27 deactivate is valid
- CS-28 reactivate is valid
- CS-29 update name + description + active together
- CS-30 rejects an empty name on update
- CS-31 rejects a description over 500 on update

**Rule sets · rule DTO**

- CS-32 a complete built-in rule is valid
- CS-33 an advisory rule (hasLogic false, not built-in) is valid
- CS-34 rejects a bad severity
- CS-35 rejects a bad scope
- CS-36 rejects a non-uuid ruleSetId

**Rule sets · create-rule contract (lower_snake_case key)**

- CS-37 a valid rule is accepted
- CS-38 accepts a key with digits and underscores
- CS-39 rejects an uppercase key
- CS-40 rejects a hyphenated key
- CS-41 rejects a key starting with a digit
- CS-42 rejects a key with a space
- CS-43 rejects an empty key
- CS-44 rejects a key over 60 chars
- CS-45 rejects an empty description
- CS-46 rejects a description over 200 chars
- CS-47 rejects an unknown severity
- CS-48 rejects an unknown scope
- CS-49 accepts an optional target ruleSetId
- CS-50 rejects a non-uuid ruleSetId
- CS-51 ruleSetId is optional (defaults to the default set)

**Rule sets · update-rule contract**

- CS-52 an empty update is valid
- CS-53 re-tune the severity
- CS-54 edit the description
- CS-55 toggle active (deactivate a built-in)
- CS-56 rejects an unknown severity
- CS-57 rejects an empty description
- CS-58 cannot change the key (no key field on update)

**Rule sets · gating result (what a rule set produces)**

- CS-59 a complete result parses; item defaults fill entityIds + applicable
- CS-60 completeness must be within 0..1
- CS-61 a blocking result (a BLOCKER failed) is well-formed

## Smart-checklist engine

_Source: `apps/api/src/modules/workflow/checklist-rules.spec.ts` — 8 cases_

**evaluateChecklist**

- blocks when a BLOCKER rule fails (no rate card)
- passes when blocking rules are satisfied
- flags a labor line missing its role and rate, naming the line for deep-linking
- marks a per-line rule "To do" (not a vacuous pass) when there are no such lines
- shows nothing green on a brand-new estimate — defaults are "To do", not passes

**resource_capacity rule (FR-27)**

- passes when overlapping allocations stay within 100%
- blocks when a resource exceeds 100% on overlapping dates
- does not flag non-overlapping windows (handoff on adjacent days)

## Approval workflow card

_Source: `apps/api/src/modules/workflow/workflow-card.spec.ts` — 52 cases_

**Workflow card · definition contract**

- TC-01 minimal create (name) is valid
- TC-02 accepts a description
- TC-03 rejects an empty name
- TC-04 rejects a name over 80 chars
- TC-05 rejects a description over 500 chars
- TC-06 update may be empty
- TC-07 update can deactivate
- TC-08 update rejects an empty name

**Workflow card · stage contract + UPPER_SNAKE keys**

- TC-09 a valid stage is accepted
- TC-10 DRAFT key is valid
- TC-11 a key with digits/underscores is valid
- TC-12 rejects a lowercase key
- TC-13 rejects a key with a hyphen
- TC-14 rejects a key that starts with a digit
- TC-15 rejects a key with spaces
- TC-16 rejects an empty key
- TC-17 rejects a key over 40 chars
- TC-18 rejects an empty label
- TC-19 rejects a label over 80 chars
- TC-20 accepts isInitial/isTerminal flags
- TC-21 accepts an explicit sortOrder
- TC-22 rejects a negative sortOrder
- TC-23 rejects a fractional sortOrder
- TC-24 stage update may be empty
- TC-25 stage update can flip isTerminal

**Workflow card · transition contract + role gating (FR-2)**

- TC-26 a valid transition is accepted
- TC-27 Approve gated to GM is valid (the approver role)
- TC-28 Submit gated to ESTIMATOR is valid
- TC-29 Finalize gated to ADMIN is valid
- TC-30 a transition gated to VIEWER is structurally valid
- TC-31 rejects a malformed allowedRole code (membership server-side, FR-30)
- TC-32 rejects a missing allowedRole
- TC-33 rejects an empty fromStageKey
- TC-34 rejects an empty toStageKey
- TC-35 rejects an empty label
- TC-36 rejects a label over 80 chars
- TC-37 accepts a description
- TC-38 rejects a description over 500 chars
- TC-39 accepts requiresChecklistPass = true
- TC-40 accepts requiresChecklistPass = false
- TC-41 requiresChecklistPass is optional
- TC-42 transition update may change just the role to GM
- TC-43 transition update may be empty
- TC-44 transition update rejects a malformed role code (membership server-side, FR-30)
- TC-45 transition update can toggle requiresChecklistPass

**Workflow card · per-estimate transition request**

- TC-46 a transition request needs a target stage
- TC-47 rejects an empty target stage
- TC-48 accepts an optional note
- TC-49 rejects a note over 2000 chars
- TC-50 accepts a note at exactly 2000 chars
- TC-51 the default workflow Approve→GM shape parses
- TC-52 the default workflow Return-to-draft→GM shape parses

## smoke

_Source: `apps/web/e2e/smoke.spec.ts` — 13 cases_

- login → create estimate → add a line → see totals
- SDLC phase breakdown (FR-28), resource capacity guard (FR-27) + stage gate
- Reference data admin page serves DB-driven values (FR-29)
- Help guide lists use cases and deep-links by anchor
- FX rates show last-updated time and a refresh button (FR-17)
- Workflow repo lists workflows and opens the editor (FR-24)
- Checklist rule-set repo lists sets and opens the rule editor (FR-25)
- User Guide page renders and deep-links by section (NFR-12)
- Estimation Guide renders and deep-links by section (NFR-12)
- Roles & permissions page shows the capability matrix (FR-2/NFR-16)
- Dashboard summarizes estimates and drills into a stage (FR-18)
- Statement of Work: create from an approved estimate, edit, open PDF (BR-7)
- a freshly created estimate has no green checklist items (FR-25)

## Estimation engine

_Source: `packages/engine/src/estimation-engine.test.ts` — 19 cases_

**computeEstimate**

- returns zeros for an empty estimate
- computes a single one-time line with no markup
- applies a global upcharge to the line base
- lets a per-line override win over the global upcharge (FR-22)
- honors an explicit 0 override against a non-zero global (FR-22)
- rolls a MONTHLY line up to monthly + yearly×12 (FR-23)
- rolls a YEARLY line up to yearly + monthly÷12 (FR-23)
- applies contingency AFTER upcharge, on the upcharged subtotal (order matters)
- multiplies the base by quantity
- handles a mixed estimate with categories (sorted, no contingency)
- groups cost per SDLC phase in lifecycle order, Unassigned last (FR-28)
- applies margin (on cost) then tax (on sell price) for a client price (FR-16)
- leaves client price equal to cost when margin and tax are zero
- rounds money half-up to the configured scale
- respects a custom money scale
- scales to a 200-line estimate without losing precision (NFR-1)

**pert (FR-13)**

- weights the most-likely 4× ((o + 4m + p) / 6)

**effectiveUpcharge**

- uses the global when no override is set
- uses the override when set, including 0

## Resource capacity (FR-27)

_Source: `packages/engine/src/resource-capacity.test.ts` — 6 cases_

**findCapacityViolations (FR-27)**

- returns nothing for unscheduled lines (no dates)
- allows a resource split to exactly 100% on overlapping dates
- flags the earliest day a resource exceeds 100%
- treats adjacent (non-overlapping) windows as fine
- keeps resources independent
- reports one violation per over-allocated resource
