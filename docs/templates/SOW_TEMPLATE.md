# Statement of Work — Response Template

## Technology Build, Implementation, and Maintenance Proposal

> **About this template.** A reusable, contract-ready Statement of Work (SOW) /
> bid-response template for technology design, build, implementation, operation,
> and maintenance engagements. It is the canonical structure the **Kerdos**
> SOW generator targets: each numbered section below maps to a field the app
> composes from an **approved estimate**, and the **Pricing Framework** section
> (§23) is populated directly from the estimate's labor, non-labor, cloud,
> upcharge, contingency, and monthly/yearly totals.
>
> **How to use it.** Replace every `{{TOKEN}}` placeholder (see the legend below),
> delete sections that do not apply, and keep the language specific enough to be
> useful but flexible enough to tailor to the final bid. Author in Markdown;
> render the customer-facing copy to `.docx` (see Appendix B).

### Placeholder legend

| Token                 | Meaning                                        |
| --------------------- | ---------------------------------------------- |
| `{{COMPANY_NAME}}`    | The responding vendor (your company)           |
| `{{CUSTOMER_NAME}}`   | The customer / agency / organization           |
| `{{SOLUTION_NAME}}`   | The solution / system / application / platform |
| `{{BID_NUMBER}}`      | Opportunity / RFP / solicitation number        |
| `{{SUBMISSION_DATE}}` | Submission date                                |
| `{{VERSION}}`         | Document version (e.g. `1.0`)                  |
| `{{EFFECTIVE_DATE}}`  | Effective date of the engagement               |

---

**Document Type:** Statement of Work / Bid Response
**Prepared For:** `{{CUSTOMER_NAME}}`
**Prepared By:** `{{COMPANY_NAME}}`
**Opportunity / RFP / Bid Number:** `{{BID_NUMBER}}`
**Submission Date:** `{{SUBMISSION_DATE}}`
**Version:** `{{VERSION}}`

---

## 1. Executive Summary

`{{COMPANY_NAME}}` is pleased to submit this Statement of Work in response to
`{{CUSTOMER_NAME}}`'s request for technology services to design, build, implement,
operate, and maintain `{{SOLUTION_NAME}}`.

Our proposed approach provides a structured, secure, scalable, and maintainable
solution that supports the customer's business objectives, operational needs,
compliance requirements, and long-term technology roadmap.

This Statement of Work defines the scope of services, delivery approach, governance
model, roles and responsibilities, assumptions, deliverables, milestones, acceptance
criteria, maintenance model, and pricing framework required to deliver the solution.

---

## 2. Customer Understanding

`{{COMPANY_NAME}}` understands that `{{CUSTOMER_NAME}}` is seeking a qualified
technology partner to:

- Design and build `{{SOLUTION_NAME}}`
- Implement secure and scalable technology
- Support business and technical users
- Integrate with existing systems
- Migrate or manage data, where applicable
- Maintain the solution after production deployment
- Support compliance, reporting, security, and operational needs
- Provide documentation, training, and knowledge transfer

The proposed solution aligns to the customer's goals of improving operational
efficiency, reducing manual effort, increasing transparency, improving system
reliability, supporting compliance and auditability, enabling future scalability,
reducing long-term maintenance risk, and improving user experience.

---

## 3. Scope of Work

### 3.1 In-Scope Services

1. Project initiation and planning
2. Requirements discovery and validation
3. Business process review
4. Solution architecture and technical design
5. User experience and interface design
6. Application development
7. Database design and development
8. API and integration development
9. Security design and implementation
10. Infrastructure and environment setup
11. DevSecOps pipeline setup
12. System and integration testing
13. User acceptance testing support
14. Performance, accessibility, and security testing
15. Deployment planning and production implementation
16. Documentation, training, and knowledge transfer
17. Post-production support
18. Ongoing maintenance and operations

### 3.2 Out-of-Scope Services

The following are excluded unless added through a formal change request (§22):

- Major changes to customer-owned legacy systems
- Third-party licensing fees not explicitly identified
- Customer data cleanup beyond the agreed scope
- Business process redesign outside the approved project scope
- Hardware procurement unless specifically included
- Custom reporting or integrations not identified in this SOW
- Support for systems not identified in this SOW
- Regulatory certification activities not explicitly included
- Work requested after acceptance of final deliverables unless covered by maintenance scope

---

## 4. Proposed Solution Overview

The proposed solution uses a modular, configurable, secure, and scalable
architecture that supports maintainability, observability, auditability, and
future enhancement.

### 4.1 Solution Principles

- Business-outcome alignment
- Security by design and privacy by design
- Accessibility by design
- Cloud-ready, scalable, modular, configurable architecture
- High availability where required
- Maintainable code and documentation
- Automated testing and deployment
- Clear operational ownership
- Full traceability from requirements to delivery
- Audit-ready logging and reporting

### 4.2 Technology Stack

The final stack is confirmed during discovery and design. The proposed stack may include:

| Layer                  | Proposed Technology                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| User Interface         | `{{UI_TECH}}` (e.g. React / Angular / Vue / Blazor / Swift / Kotlin)                             |
| Backend Services       | `{{BACKEND_TECH}}` (e.g. .NET / Java / Node.js / Python)                                         |
| API Layer              | REST, GraphQL, SOAP/XML if required                                                              |
| Database               | `{{DB_TECH}}` (e.g. PostgreSQL / SQL Server / Oracle / MySQL)                                    |
| Cloud Platform         | `{{CLOUD_PLATFORM}}` (e.g. AWS / Azure / GCP / On-Premises / Hybrid)                             |
| Identity               | SAML, OAuth2, OIDC, MFA, RBAC                                                                    |
| DevSecOps              | GitHub Actions, Azure DevOps, GitLab CI, Jenkins                                                 |
| Infrastructure as Code | Terraform, CloudFormation, Bicep                                                                 |
| Monitoring & Logging   | Centralized logging + audit logging; Datadog / Prometheus / Grafana / CloudWatch / Azure Monitor |
| Security               | Static + dependency scanning, secrets management, vulnerability management                       |
| Documentation          | Markdown, architecture diagrams, runbooks                                                        |

---

## 5. Delivery Methodology

### 5.1 Delivery Phases

| Phase                    | Description                                                                  | Key Deliverables                                     |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1. Initiation            | Establish governance, scope, schedule, communication model                   | Project charter, project plan, stakeholder matrix    |
| 2. Discovery             | Confirm business, technical, security, compliance requirements               | Requirements traceability matrix, discovery findings |
| 3. Architecture & Design | Define target architecture, data model, integrations, security, environments | Solution architecture, technical design, data design |
| 4. Build & Configuration | Develop and configure components                                             | Application code, database objects, integrations     |
| 5. Testing               | Validate functional and non-functional requirements                          | Test plans, results, defect logs                     |
| 6. Deployment            | Prepare and execute production implementation                                | Deployment plan, rollback plan, release notes        |
| 7. Stabilization         | Support early production operations (hypercare)                              | Hypercare report, issue log, support transition      |
| 8. Maintenance           | Provide ongoing operational support and enhancements                         | Runbooks, SLA reports, maintenance backlog           |

### 5.2 Agile and Governance Approach

Delivery may follow agile, hybrid, or waterfall based on customer preference and
contract requirements. Recommended practices: sprint planning, backlog grooming,
daily standups, sprint reviews and retrospectives, weekly status reporting, risk
and issue management, a change control board, requirements traceability, formal
deliverable review and approval, and executive steering committee updates.

---

## 6. Governance Model

### 6.1 Objectives

Clear accountability, transparent reporting, controlled scope, timely
decision-making, risk visibility, issue escalation, customer alignment, contract
compliance, and quality oversight.

### 6.2 Structure

| Governance Body               | Purpose                                              | Frequency            |
| ----------------------------- | ---------------------------------------------------- | -------------------- |
| Executive Steering Committee  | Strategic direction, major decisions, escalation     | Monthly or as needed |
| Project Leadership Meeting    | Schedule, budget, scope, risks, decisions            | Weekly               |
| Technical Architecture Review | Architecture decisions, technical risks, standards   | Weekly or biweekly   |
| Security & Compliance Review  | Security controls, privacy, auditability, compliance | As needed            |
| Change Control Board          | Review and approve scope, schedule, cost changes     | As needed            |
| Operational Readiness Review  | Production readiness and support handoff             | Prior to go-live     |

---

## 7. Roles and Responsibilities

### 7.1 Vendor (`{{COMPANY_NAME}}`) Responsibilities

Provide qualified personnel; manage delivery; develop and maintain the project plan;
conduct discovery; prepare design documentation; build and configure the solution;
perform agreed testing and support customer testing; prepare deployment plans;
support implementation; report status; manage risks and issues; provide knowledge
transfer; support post-production stabilization; and deliver maintenance services as agreed.

### 7.2 Customer (`{{CUSTOMER_NAME}}`) Responsibilities

Provide access to stakeholders, systems, and environments; provide timely decisions
and approvals; provide business rules and subject-matter expertise; review and approve
deliverables; support user acceptance testing; provide test data where required;
manage customer-side communications; provide infrastructure/security access where
applicable; participate in governance; and support change-control decisions.

---

## 8. RACI Matrix

| Activity                   | Vendor | Customer | Third Party |
| -------------------------- | ------ | -------- | ----------- |
| Project planning           | R      | A/C      | I           |
| Requirements discovery     | R      | A/C      | C           |
| Business rule validation   | C      | A/R      | I           |
| Solution architecture      | R      | A/C      | C           |
| Security architecture      | R      | A/C      | C           |
| Application development    | R      | C        | I           |
| Database development       | R      | C        | I           |
| Integration development    | R      | C        | C           |
| Test planning              | R      | A/C      | I           |
| User acceptance testing    | C      | A/R      | I           |
| Deployment planning        | R      | A/C      | C           |
| Production deployment      | R      | A/C      | C           |
| Post-production support    | R      | A/C      | C           |
| Maintenance and operations | R      | A/C      | C           |

**Legend:** R = Responsible · A = Accountable · C = Consulted · I = Informed

---

## 9. Deliverables

| Deliverable                      | Description                                           | Acceptance Criteria                           |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Project Management Plan          | Schedule, governance, risks, communication, reporting | Approved by customer                          |
| Requirements Document            | Functional and non-functional requirements            | Approved by business + technical stakeholders |
| Requirements Traceability Matrix | Maps requirements to design, build, test, acceptance  | Complete and reviewed                         |
| Solution Architecture Document   | Target architecture and major design decisions        | Approved by architecture stakeholders         |
| Technical Design Document        | Application, data, integration, security design       | Approved by technical stakeholders            |
| Data Model                       | Logical and physical data structures                  | Reviewed and approved                         |
| Integration Design               | APIs, batch jobs, files, messages, event flows        | Reviewed and approved                         |
| Security Design                  | Authn, authz, encryption, logging, controls           | Approved by security stakeholders             |
| Test Strategy                    | Testing approach and responsibilities                 | Approved by project leadership                |
| Test Cases and Results           | Executed tests and results                            | Meets exit criteria                           |
| Deployment Plan                  | Production implementation steps                       | Approved before go-live                       |
| Rollback Plan                    | Recovery approach if deployment fails                 | Approved before go-live                       |
| User Guide                       | Supports end-user adoption                            | Reviewed and accepted                         |
| Operations Runbook               | Supports production operations                        | Reviewed and accepted                         |
| Knowledge Transfer Materials     | Supports customer/support handoff                     | Delivered and reviewed                        |
| Final Acceptance Package         | Confirms delivery completion                          | Signed by customer                            |

---

## 10. Functional Requirements

Finalized during discovery. Initial functional areas may include: user registration
and access management; role-based permissions; administrative configuration; data
entry and management; workflow processing; document generation; search and reporting;
notifications and alerts; dashboards and analytics; integration with external systems;
audit trail and activity history; customer-specific business rules; data import/export;
and user support / help content.

---

## 11. Non-Functional Requirements

### 11.1 Security

Role-based access control; MFA where required; encryption in transit and at rest;
secrets management; secure API access; audit logging; vulnerability management;
secure configuration; least-privilege access.

### 11.2 Performance

Defined response-time and throughput targets; load testing for critical workflows;
performance monitoring; database tuning; scalable architecture.

### 11.3 Availability & Reliability

Defined availability targets; backup and recovery; disaster recovery planning; error
handling; logging and monitoring; automated alerts; operational runbooks.

### 11.4 Accessibility

WCAG 2.2 and Section 508 alignment where applicable; keyboard navigation; screen-reader
support; color-contrast compliance; accessible forms and error messages.

### 11.5 Maintainability

Modular code; configurable business rules where practical; code documentation;
automated testing; version control; release notes; technical-debt tracking.

### 11.6 Auditability

User-activity and system-event logging; change history; data-modification history;
reportable audit trail; retention policies; requirements-to-delivery traceability.

---

## 12. Security and Compliance Approach

Secure software development lifecycle practices: security-requirements review; threat
modeling; authentication/authorization design; data classification; encryption design;
secure API design; logging and monitoring design; static application security testing;
dependency vulnerability scanning; container image scanning (if applicable); penetration
testing support (if required); security defect remediation; security documentation; and
operational security handoff.

Compliance requirements are confirmed during discovery and may include industry
regulatory requirements, customer security policies, privacy and data-retention
requirements, accessibility standards, audit-reporting requirements, change-management
requirements, and records-management requirements. Applicable frameworks may include
`{{COMPLIANCE_FRAMEWORKS}}` (e.g. HIPAA, SOC 2, FedRAMP, NIST 800-53, NIST 800-171,
PCI DSS, WCAG 2.2, Section 508).

---

## 13. Testing Strategy

### 13.1 Testing Types

Unit, component, system, integration, regression, user acceptance (support),
performance, load, accessibility, security (support), disaster recovery (if required),
and deployment-validation testing.

### 13.2 Test Exit Criteria

Critical/high defects resolved or formally accepted; requirements traceability complete;
test cases executed and results documented; security findings addressed or accepted;
performance targets met or formally waived; UAT approval received; deployment readiness approved.

---

## 14. Implementation and Deployment Plan

Developed during the project; includes environment readiness; deployment roles and
responsibilities; pre-deployment checklist; deployment steps; data migration/conversion
steps; configuration steps; smoke testing; business validation; rollback criteria and
steps; communication plan; go-live approval; and post-deployment monitoring.

---

## 15. Maintenance and Support Model

### 15.1 Support Scope

Incident resolution; problem investigation; minor enhancements; security patching;
application updates; configuration changes; monitoring and alert response; database
maintenance; performance tuning; release support; documentation updates; operational reporting.

### 15.2 Support Levels

| Support Level  | Description                                                |
| -------------- | ---------------------------------------------------------- |
| Tier 1         | Initial intake, triage, known-issue resolution             |
| Tier 2         | Functional support, configuration support, defect review   |
| Tier 3         | Engineering support; code, integration, and database fixes |
| Vendor Support | Third-party product/platform support, if applicable        |

### 15.3 Service Level Targets

Final SLAs are defined in the contract. Example targets:

| Priority | Description                    | Initial Response Target |                Resolution Target |
| -------- | ------------------------------ | ----------------------: | -------------------------------: |
| P1       | Critical production outage     |              30 minutes | Work continuously until restored |
| P2       | Major functionality impaired   |         1 business hour |                1–2 business days |
| P3       | Moderate issue with workaround |          1 business day |               5–10 business days |
| P4       | Minor issue or request         |         2 business days |                     As scheduled |

---

## 16. Project Schedule and Milestones

The final schedule is confirmed after discovery. Sample milestone structure:

| Milestone               | Description                        | Estimated Timing |
| ----------------------- | ---------------------------------- | ---------------- |
| Contract Award          | Customer awards work               | Week 0           |
| Project Kickoff         | Launch delivery activities         | Week 1           |
| Discovery Complete      | Requirements and scope validated   | Week 4           |
| Architecture Complete   | Architecture and design approved   | Week 6           |
| Build Complete          | Core development completed         | Week 14          |
| System Testing Complete | Internal testing completed         | Week 18          |
| UAT Complete            | Customer validation completed      | Week 22          |
| Production Deployment   | Solution implemented               | Week 24          |
| Hypercare Complete      | Stabilization completed            | Week 28          |
| Maintenance Start       | Transition to steady-state support | Week 29          |

---

## 17. Staffing Plan

Adjusted to project size, complexity, schedule, and customer requirements.

| Role                     | Responsibility                               |
| ------------------------ | -------------------------------------------- |
| Executive Sponsor        | Executive oversight and escalation           |
| Program Manager          | Overall delivery leadership                  |
| Project Manager          | Schedule, budget, risks, issues, status      |
| Solution Architect       | End-to-end solution design                   |
| Technical Architect      | Detailed technical design and standards      |
| Security Architect       | Security controls and compliance alignment   |
| Business Analyst         | Requirements, process flows, traceability    |
| UX/UI Designer           | User experience and interface design         |
| Lead Developer           | Application technical leadership             |
| Developers               | Application build and unit testing           |
| Database Developer       | Database design and stored procedures        |
| Integration Engineer     | APIs, batch, file, event integrations        |
| DevSecOps Engineer       | CI/CD, automation, infrastructure as code    |
| QA Lead                  | Test strategy and quality oversight          |
| Testers                  | Test-case execution and defect validation    |
| Performance Engineer     | Performance testing and tuning               |
| Accessibility Specialist | Accessibility review and validation          |
| Production Support Lead  | Support transition and operations readiness  |
| Technical Writer         | User guides, runbooks, support documentation |

---

## 18. Assumptions

- Customer stakeholders are available for workshops and reviews.
- Customer provides timely decisions and approvals.
- Customer provides required access to systems, data, environments, and documentation.
- Requirements are baselined after discovery.
- Scope changes follow the approved change-control process (§22).
- Customer provides test data unless otherwise stated.
- Customer provides third-party vendor coordination where required.
- Environments are available per the agreed schedule.
- Security reviews are scheduled in alignment with the project timeline.
- Delays caused by missing access, approvals, decisions, or dependencies may impact schedule and cost.

---

## 19. Constraints

Fixed procurement or regulatory deadlines; customer environment availability;
third-party vendor timelines; legacy-system limitations; data-quality issues; security
approval timelines; budget limitations; resource availability; change-freeze periods;
production release windows.

---

## 20. Risks and Mitigation

| Risk                          | Impact                          | Mitigation                                   |
| ----------------------------- | ------------------------------- | -------------------------------------------- |
| Unclear requirements          | Rework, schedule delays         | Discovery workshops and formal sign-off      |
| Customer approval delays      | Schedule impact                 | Approval SLAs and escalation path            |
| Third-party dependency delays | Integration delays              | Identify dependencies early; track weekly    |
| Data quality issues           | Testing and production issues   | Data assessment and cleansing plan           |
| Late security findings        | Delayed go-live                 | Include security early in design and testing |
| Scope growth                  | Cost and schedule impact        | Formal change control                        |
| Environment instability       | Testing delays                  | Environment readiness checklist              |
| Resource constraints          | Delivery delays                 | Staffing plan and backup resources           |
| Performance issues            | Adoption and reliability impact | Performance testing and tuning               |
| Operational readiness gaps    | Production support issues       | Runbooks and support transition              |

---

## 21. Acceptance Criteria

A deliverable is accepted when it is submitted in the agreed format; satisfies approved
requirements; review comments are addressed or formally dispositioned; required reviews
are complete; required approvals are received; and acceptance is documented in writing.
If the customer does not provide feedback within the agreed review period, the deliverable
may be considered accepted per the terms of the contract.

---

## 22. Change Control

Any change to scope, schedule, cost, deliverables, assumptions, acceptance criteria, or
maintenance obligations is managed through a formal change-control process:

1. Change-request submission
2. Impact analysis
3. Cost and schedule estimate
4. Risk assessment
5. Customer review
6. Approval or rejection
7. Baseline update
8. Implementation tracking

No work outside approved scope begins until the change request is approved by authorized
customer and vendor representatives.

---

## 23. Pricing Framework

> **Kerdos mapping.** When this SOW is generated from a Kerdos estimate, this section
> is populated from the estimate's computed totals: labor, non-labor, and cloud line
> items; the applied **upcharge** and **contingency**; and the **one-time, monthly, and
> annualized (yearly)** roll-ups. The snapshotted unit prices on the estimate ensure the
> SOW pricing does not drift if rate cards or the cloud catalog are later refreshed.

Pricing is finalized based on the approved scope, delivery model, staffing plan,
technology stack, timeline, and maintenance requirements.

### 23.1 Pricing Options

Fixed price; time and materials; not-to-exceed; monthly managed services; milestone-based
payments; retainer-based support; hybrid delivery and maintenance.

### 23.2 Cost Categories

Project management; business analysis; architecture and design; development; testing;
security support; DevSecOps; cloud/hosting; licensing; third-party services; data
migration; training; documentation; production support; maintenance and enhancements.

### 23.3 Pricing Summary

| Cost Category                        |                One-Time |                Monthly |      Annualized (Yearly) |
| ------------------------------------ | ----------------------: | ---------------------: | -----------------------: |
| `{{CATEGORY}}`                       |          `{{ONE_TIME}}` |          `{{MONTHLY}}` |             `{{YEARLY}}` |
| **Subtotal**                         | `{{SUBTOTAL_ONE_TIME}}` | `{{SUBTOTAL_MONTHLY}}` |    `{{SUBTOTAL_YEARLY}}` |
| Upcharge (`{{UPCHARGE_PCT}}`%)       |                         |                        |    `{{UPCHARGE_AMOUNT}}` |
| Contingency (`{{CONTINGENCY_PCT}}`%) |                         |                        | `{{CONTINGENCY_AMOUNT}}` |
| **Grand Total**                      |                         |                        |        `{{GRAND_TOTAL}}` |

---

## 24. Maintenance Pricing Model

Ongoing maintenance may be priced using a monthly fixed support fee; annual support
agreement; hourly support bank; enhancement-backlog model; SLA-based managed services; or
a production-support retainer. Maintenance pricing should clearly define included support
hours, coverage window, response targets, exclusions, enhancement pricing, after-hours
pricing, escalation process, and reporting frequency.

---

## 25. Communication Plan

| Communication               | Audience                   | Frequency          | Owner              |
| --------------------------- | -------------------------- | ------------------ | ------------------ |
| Project status report       | Project stakeholders       | Weekly             | Project Manager    |
| Executive summary           | Executive sponsors         | Monthly            | Program Manager    |
| Risk and issue log          | Project leadership         | Weekly             | Project Manager    |
| Technical review            | Technical stakeholders     | Weekly or biweekly | Solution Architect |
| Security review             | Security stakeholders      | As needed          | Security Architect |
| Deployment readiness review | Project + operations teams | Prior to go-live   | Project Manager    |
| Maintenance report          | Operations stakeholders    | Monthly            | Support Lead       |

---

## 26. Documentation Requirements

Project charter; schedule; status reports; risk/issue logs; requirements document;
requirements traceability matrix; solution architecture document; technical design
document; data model; interface control document; API documentation; security design
document; test strategy, cases, and results; deployment and rollback plans; user and
administrator guides; training materials; operations runbook; maintenance guide; and
knowledge-transfer materials.

---

## 27. Quality Management

Managed through requirements traceability; design, code, peer, security, and
accessibility reviews; automated and manual testing; defect tracking; performance
validation; release-readiness reviews; acceptance-criteria validation; and continuous
improvement.

Quality metrics may include defect density, defect leakage, test pass rate, requirements
coverage, code coverage, security-vulnerability counts, SLA performance, release success
rate, incident trends, and customer satisfaction.

---

## 28. Intellectual Property

Governed by the final contract. The SOW should clearly define ownership of
custom-developed code; reusable frameworks; pre-existing vendor assets; customer data;
documentation; configuration; scripts; templates; automation assets; and third-party
components.

---

## 29. Data Ownership and Privacy

Customer data remains the property of `{{CUSTOMER_NAME}}` unless otherwise defined by
contract. The solution supports data-privacy requirements; data access controls;
retention, archival, and deletion rules; data encryption; audit logging; and data-breach
notification processes where applicable.

---

## 30. Warranty

Warranty terms are defined in the final contract. Typical coverage: correction of defects
caused by vendor-developed code; support for agreed production defects; validation against
approved requirements; and exclusions for customer changes, third-party failures,
environment changes, or use outside the approved design.

---

## 31. Sign-Off

By signing below, both parties acknowledge they have reviewed this Statement of Work and
agree to the scope, assumptions, responsibilities, deliverables, and terms described
herein, subject to the final contract.

| Name                       | Title                       | Organization        | Signature | Date |
| -------------------------- | --------------------------- | ------------------- | --------- | ---- |
| `{{CUSTOMER_SIGNER_NAME}}` | `{{CUSTOMER_SIGNER_TITLE}}` | `{{CUSTOMER_NAME}}` |           |      |
| `{{VENDOR_SIGNER_NAME}}`   | `{{VENDOR_SIGNER_TITLE}}`   | `{{COMPANY_NAME}}`  |           |      |

---

## Appendix A — Bid Response Writing Guidance

When preparing a SOW in response to a bid, ensure the response: directly addresses the
requested scope; uses the customer's terminology; maps deliverables to bid requirements;
clearly defines what is included and excluded; avoids overpromising; includes measurable
acceptance criteria; includes assumptions that protect delivery; includes a realistic
support and maintenance model; identifies dependencies and customer responsibilities;
includes security, compliance, accessibility, and operational readiness; and is written
in professional, contract-ready language.

---

## Appendix B — Rendering to `.docx`

Author this template in Markdown, then render the customer-facing copy to Word with
pandoc (no local toolchain required — use the container):

```bash
docker run --rm -v "$PWD/docs/templates":/data pandoc/core \
  SOW_TEMPLATE.md -o SOW_TEMPLATE.docx
```

A pre-rendered `SOW_TEMPLATE.docx` is committed alongside this file.
