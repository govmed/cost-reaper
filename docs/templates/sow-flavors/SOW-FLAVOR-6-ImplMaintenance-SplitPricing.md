# Statement of Work — Implementation & Maintenance (Split Pricing)

> **Flavor:** Same as **Implementation & Maintenance** (SLAs, support tiers,
> warranty, security) — but the pricing is split into **Implementation (one-time)**
> and **Maintenance (annual / recurring)**, each broken down by cost element.
> **Best for:** Build-then-run deals where the buyer wants capex (implementation)
> and opex (maintenance) shown separately.
> **Maps to Kerdos:** one-time line items → Implementation; monthly/yearly → annual
> Maintenance; per-category breakdown + contingency from the approved estimate. `{{…}}` merge.

---

Sections 1–14 and 16–20 are identical to
[Implementation & Maintenance](SOW-FLAVOR-5-Implementation-Maintenance.md) — the
only change is **Section 15 (Fees & Payment)**, below.

## 15. Fees & Payment

> **Basis of estimate:** the figures are produced by the project estimate, which
> rolls up labor by SDLC phase, compute/infrastructure, and non-labor, then applies
> contingency. Update the estimate and these numbers flow through.

### 15.1 Implementation (one-time)

| Cost element                                    |                  Amount |
| ----------------------------------------------- | ----------------------: |
| Labor — SDLC phases (discovery → hypercare)     |       {{LABOR_ONETIME}} |
| Compute / infrastructure (non-prod)             |     {{COMPUTE_ONETIME}} |
| Non-labor (licenses, tooling, training, travel) |    {{NONLABOR_ONETIME}} |
| Subtotal (one-time)                             |    {{ONETIME_SUBTOTAL}} |
| Contingency                                     | {{ONETIME_CONTINGENCY}} |
| **Total implementation**                        |   **{{ONETIME_TOTAL}}** |

### 15.2 Maintenance (annual / recurring)

| Cost element                                           |                 Annual |
| ------------------------------------------------------ | ---------------------: |
| Maintenance labor (support, DevOps, service mgmt)      |       {{LABOR_ANNUAL}} |
| Compute / infrastructure (production, annual)          |     {{COMPUTE_ANNUAL}} |
| Non-labor (production licenses, SaaS, support tooling) |    {{NONLABOR_ANNUAL}} |
| Subtotal (annual)                                      |    {{ANNUAL_SUBTOTAL}} |
| Contingency                                            | {{ANNUAL_CONTINGENCY}} |
| **Annual maintenance total**                           |   **{{YEARLY_TOTAL}}** |
| Monthly equivalent                                     |      {{MONTHLY_TOTAL}} |

### 15.3 Pricing basis & payment

- Implementation priced as {{IMPL_BASIS}} per the estimate's phase-cost breakdown.
- **Payment schedule:** {{PAYMENT_SCHEDULE}} — milestone values map to per-phase costs.
- Maintenance billed {{MAINT_CADENCE}} in {{ADVANCE_ARREARS}}.
- Expenses {{EXPENSES}}. Invoices payable within {{NET_DAYS}} days.

_Total price to Client: **{{CLIENT_PRICE}}**._
