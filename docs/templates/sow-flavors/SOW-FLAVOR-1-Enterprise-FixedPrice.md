# Statement of Work — Enterprise (Fixed-Price)

> **Flavor:** Formal, comprehensive, fixed-price engagement with milestone billing.
> **Best for:** Large clients, procurement/legal review, regulated buyers.
> **Maps to Kerdos:** the current built-in SOW (per-SDLC-phase milestone schedule +
> per-category cost breakdown + line-item detail). Merge fields in `{{…}}`.

---

**Statement of Work No.** {{SOW_NUMBER}} · **Effective Date:** {{EFFECTIVE_DATE}}
**Client:** {{CLIENT_NAME}} · **Provider:** {{PROVIDER_NAME}}
Issued under the Master Services Agreement dated {{MSA_DATE}} (the "Agreement").

## 1. Executive Summary

{{EXECUTIVE_SUMMARY}}

## 2. Understanding of Client Needs

{{CUSTOMER_UNDERSTANDING}}

## 3. Project Overview & Objectives

{{OVERVIEW}}

## 4. Scope of Services

**In scope**

{{SCOPE}}

**Out of scope**

{{OUT_OF_SCOPE}}

## 5. Proposed Solution

{{SOLUTION_OVERVIEW}}

## 6. Deliverables & Milestone Schedule

Deliverables are organized by SDLC phase. **Each phase is a billable milestone:**
on the Client's written acceptance of a phase's deliverables, the Provider invoices
that phase's one-time milestone fee per the schedule below (derived from the
approved estimate).

| Phase / Milestone | Deliverables             | Milestone fee (one-time) |      Recurring (monthly) |      Recurring (yearly) |
| ----------------- | ------------------------ | -----------------------: | -----------------------: | ----------------------: |
| {{PHASE_1}}       | {{PHASE_1_DELIVERABLES}} |      {{PHASE_1_ONETIME}} |      {{PHASE_1_MONTHLY}} |      {{PHASE_1_YEARLY}} |
| …                 | …                        |                        … |                        … |                       … |
| **Total**         |                          | **{{ONETIME_SUBTOTAL}}** | **{{MONTHLY_SUBTOTAL}}** | **{{YEARLY_SUBTOTAL}}** |

_Phase amounts exclude the project contingency. Recurring amounts bill on their
stated cadence (see §9)._

## 7. Timeline

{{TIMELINE}}

## 8. Roles & Responsibilities (RACI)

| Activity                     | {{CLIENT_NAME}} | {{PROVIDER_NAME}} |
| ---------------------------- | --------------- | ----------------- |
| Project kickoff & governance | Accountable     | Responsible       |
| Requirements & SME access    | Responsible     | Support           |
| Build / configuration        | Informed        | Responsible       |
| UAT & acceptance             | Responsible     | Support           |
| Go-live & hypercare          | Support         | Responsible       |

## 9. Pricing

**Estimate detail (line items)**

| Item          | Category     |     Qty | Rate / amount | Billing     |     Line total |
| ------------- | ------------ | ------: | ------------: | ----------- | -------------: |
| {{LINE_ITEM}} | {{CATEGORY}} | {{QTY}} |      {{RATE}} | {{BILLING}} | {{LINE_TOTAL}} |

**Cost breakdown by category** (post-upcharge, pre-contingency)

| Cost category |    One-time |     Monthly |     Yearly |
| ------------- | ----------: | ----------: | ---------: |
| {{CATEGORY}}  | {{ONETIME}} | {{MONTHLY}} | {{YEARLY}} |

**Totals**

|                           |               Amount |
| ------------------------- | -------------------: |
| One-time total            |    {{ONETIME_TOTAL}} |
| Monthly total             |    {{MONTHLY_TOTAL}} |
| Yearly total (annualized) |     {{YEARLY_TOTAL}} |
| Contingency               |      {{CONTINGENCY}} |
| **Grand total (cost)**    |  **{{GRAND_TOTAL}}** |
| **Total price to Client** | **{{CLIENT_PRICE}}** |

All amounts in {{CURRENCY}}, exclusive of applicable taxes.

## 10. Payment Terms

{{PAYMENT_TERMS}}

## 11. Assumptions

{{ASSUMPTIONS}}

## 12. Risks & Mitigation

{{RISKS_MITIGATION}}

## 13. Acceptance Criteria

{{ACCEPTANCE_CRITERIA}}

## 14. Change Control

{{CHANGE_CONTROL}}

## 15. Terms & Conditions

{{TERMS_AND_CONDITIONS}}

## 16. Signatures

| {{CLIENT_NAME}}                       | {{PROVIDER_NAME}}                     |
| ------------------------------------- | ------------------------------------- |
| Signature: **\*\*\*\***\_**\*\*\*\*** | Signature: **\*\*\*\***\_**\*\*\*\*** |
| Name:                                 | Name:                                 |
| Title:                                | Title:                                |
| Date:                                 | Date:                                 |

_Prepared by {{PREPARED_BY}} · {{SOW_NUMBER}}_
