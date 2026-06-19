# Pricing & Implementation Overview (Proposal Style)

> **Flavor:** Vendor proposal / pricing-led overview that precedes an order form —
> modeled on a real SaaS implementation proposal (KMS-Lighthouse-style).
> **Best for:** SaaS/subscription deals, RFP responses, deals closed via an Order
> Form or cloud marketplace.
> **Maps to Kerdos:** recurring (monthly/yearly) pricing → subscription tiers;
> one-time totals → implementation fee; cloud lines → hosting/modules. `{{…}}` merge.

---

**{{PROVIDER_NAME}}** — Pricing and Implementation Project Overview for **{{CLIENT_NAME}}**
{{EFFECTIVE_DATE}} · Prepared by {{PREPARED_BY}} · Ref {{SOW_NUMBER}}

## Table of Contents

1. Introduction
2. Implementation Project Details
3. Project Deliverables
4. Standard Project Timeline
5. Preconditions & Assumptions
6. Roles & Responsibilities
7. Project Team
8. Pricing
9. General Assumptions
10. How to Purchase

## 1. Introduction

This document provides a high-level outline of the proposed implementation plan and
pricing for {{CLIENT_NAME}}, based on the scope discussed and information gathered
from the RFP and discovery meetings. {{OVERVIEW}}

## 2. Implementation Project Details

The following phases are completed by {{PROVIDER_NAME}} in collaboration with the
{{CLIENT_NAME}} team. Final scope and related fees are confirmed at kickoff and
approved by both parties before the Order Form is executed.

{{SOLUTION_OVERVIEW}}

- **Deployment / setup** — environment, security, SSO (SAML 2.0), branding.
- **Discovery / business analysis** — workshops for {{N}} lines of business.
- **Configuration** — {{CONFIG_SUMMARY}}.
- **Training** — admin, content/manager, and train-the-trainer sessions.
- **UAT & go-live** — UAT plan, support window, hypercare.

## 3. Project Deliverables

- **Deployment:** {{DEPLOYMENT_DELIVERABLES}}
- **Configuration:** {{CONFIG_DELIVERABLES}}
- **Training & documentation:** {{TRAINING_DELIVERABLES}}
- **Support:** ticketing access, onboarding guide, support SLAs.

## 4. Standard Project Timeline

| Workstream               | M1  | M2  | M3  | M4  |
| ------------------------ | :-: | :-: | :-: | :-: |
| Installation / setup     |  ▓  |     |     |     |
| Analysis & customization |  ▓  |  ▓  |     |     |
| Content / data migration |     |  ▓  |  ▓  |     |
| Integrations & config    |     |  ▓  |  ▓  |     |
| Training & testing (UAT) |     |     |  ▓  |  ▓  |
| Go-live & hypercare      |     |     |     |  ▓  |

_Actual dates are confirmed at kickoff; timeline depends on Client resource availability._

## 5. Preconditions & Assumptions

**Preconditions:** {{PRECONDITIONS}}

**Assumptions:** {{ASSUMPTIONS}}

## 6. Roles & Responsibilities

| Task                             | {{CLIENT_NAME}} | {{PROVIDER_NAME}} |
| -------------------------------- | --------------- | ----------------- |
| Project initialization / kickoff | Support         | Responsible       |
| Environment setup & QA           | Informed        | Responsible       |
| Analysis & customization         | Support         | Responsible       |
| Content / data migration         | Responsible     | Support           |
| Training                         | Informed        | Responsible       |
| UAT & approvals                  | Responsible     | Support           |
| Post-production support          | Informed        | Responsible       |

## 7. Project Team

| Name          | Role             | Contact        |
| ------------- | ---------------- | -------------- |
| {{PM_NAME}}   | Project Manager  | {{PM_EMAIL}}   |
| {{LEAD_NAME}} | Delivery Lead    | {{LEAD_EMAIL}} |
| {{CSM_NAME}}  | Customer Success | {{CSM_EMAIL}}  |

## 8. Pricing

### 8.1 Subscription (recurring)

| Tier / package | Unit          |     List price | {{CLIENT_NAME}} price |
| -------------- | ------------- | -------------: | --------------------: |
| {{TIER_1}}     | per user / mo | {{TIER_1_SRP}} |      {{TIER_1_PRICE}} |
| …              | …             |              … |                     … |

_Recurring figures map to the estimate's monthly / yearly (annualized) totals
({{MONTHLY_TOTAL}} / {{YEARLY_TOTAL}}). The subscription includes hosting, support, and updates._

### 8.2 Optional modules / add-ons

| Module     | Description     |     Annual fee |
| ---------- | --------------- | -------------: |
| {{MODULE}} | {{MODULE_DESC}} | {{MODULE_FEE}} |

### 8.3 Implementation & professional services (one-time)

| Service                          |                   Fee |
| -------------------------------- | --------------------: |
| One-time implementation (per §2) |     {{ONETIME_TOTAL}} |
| Optional services                | {{OPTIONAL_SERVICES}} |

## 9. General Assumptions

- Fees are billed {{BILLING_CADENCE}}; all pricing in {{CURRENCY}}, exclusive of taxes.
- Out-of-scope work requires written approval before it begins.
- {{GENERAL_ASSUMPTIONS}}

## 10. How to Purchase

Available directly via an Order Form, or through a cloud marketplace private offer
(AWS Marketplace / Microsoft Azure Marketplace) — applicable toward EDP/MACC
commitments, with simplified onboarding and identical terms.

_© {{YEAR}} {{PROVIDER_NAME}}. Confidential — for {{CLIENT_NAME}} evaluation only._
