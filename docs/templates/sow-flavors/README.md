# SOW Template Flavors

Several **styles** of Statement of Work, mined from real-world examples
(`docs/examples/sow/`) plus the built-in app template. Pick the flavor that fits the
deal; all use `{{MERGE_FIELD}}` placeholders that map to a Kerdos estimate's data
(line items, by-category breakdown, per-SDLC-phase milestones, and one-time / monthly
/ yearly totals).

| #   | Flavor                                                                                       | Best for                                            | Style                                                                                       |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | [Enterprise (Fixed-Price)](SOW-FLAVOR-1-Enterprise-FixedPrice.md)                            | Large clients, procurement/legal review             | Comprehensive, milestone-billed, full T&Cs + RACI + signatures                              |
| 2   | [Concise (SMB / Fast-Turn)](SOW-FLAVOR-2-Concise-SMB.md)                                     | SMB, short engagements, repeat clients              | Lean 1–2 pages, quick sign-off                                                              |
| 3   | [Proposal — Pricing & Implementation Overview](SOW-FLAVOR-3-Proposal-Pricing-Overview.md)    | SaaS/subscription, RFP responses, marketplace deals | Pricing-led overview with tiers, modules, timeline gantt, team                              |
| 4   | [Time & Materials (Agile)](SOW-FLAVOR-4-TimeAndMaterials-Agile.md)                           | Evolving scope, staff aug, agile delivery           | Rate-card team + sprints + not-to-exceed                                                    |
| 5   | [Implementation & Maintenance](SOW-FLAVOR-5-Implementation-Maintenance.md)                   | Build-then-run; deploy + support live               | Implementation + ongoing support with SLAs, support tiers, warranty (structured app fields) |
| 6   | [Implementation & Maintenance (Split Pricing)](SOW-FLAVOR-6-ImplMaintenance-SplitPricing.md) | Build-then-run; separate capex/opex                 | I&M with Implementation (one-time) and Maintenance (annual) cost tables                     |

## How they map to Kerdos

- **One-time totals** → fixed-price / implementation fee / milestone fees.
- **Monthly & yearly (annualized) totals** → subscription / run-rate / recurring.
- **Per-SDLC-phase subtotals** → the milestone schedule (each phase = a billable milestone).
- **Per-category breakdown** → the cost summary table.
- **Line items** → the estimate-detail table (flavors 1 & 4) / team & rates (flavor 4).

## Picking a flavor

- Fixed scope, formal buyer → **1 (Enterprise)**.
- Small/quick → **2 (Concise)**.
- Selling a product/subscription or responding to an RFP → **3 (Proposal)**.
- Scope will evolve / billing by time → **4 (Time & Materials)**.

> These are document templates today. A future enhancement could let you **choose a
> flavor when creating a SOW in the app** so the section boilerplate pre-fills to the
> selected style — see the note in `PROJECT_LOG.md`.

`.docx` versions of each flavor sit beside the Markdown sources (rendered via pandoc).
