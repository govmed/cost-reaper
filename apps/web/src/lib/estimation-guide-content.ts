import type { GuideSection } from './user-guide-content';

/**
 * Estimation Guide (NFR-12) — methodology & training for *how to estimate well*,
 * complementing the User Guide (how to use the tool). Rendered at
 * `/estimation-guide`; each section is deep-linkable by anchor.
 */
export const ESTIMATION_GUIDE: GuideSection[] = [
  {
    id: 'why',
    title: 'Why estimate well',
    body: [
      'A good estimate is a defensible, repeatable statement of what a project will cost — not a guess. It lets you compare options, set a budget, price a proposal, and re-baseline as scope changes. The goal is not a single "right" number but a transparent model whose assumptions and method anyone can inspect.',
      'KerdosSOW is a bottom-up estimating tool: you build the number from line items (labor, non-labor, cloud, managed services, SaaS), apply contingency and markup, and record the assumptions behind it. This guide covers the estimating discipline; the User Guide covers the software.',
    ],
    links: [{ label: 'Open the User Guide', to: '/guide' }],
  },
  {
    id: 'techniques',
    title: 'Estimation techniques',
    body: [
      'Most estimates blend a few techniques. Pick the one that fits how much you know, then refine as detail emerges.',
    ],
    bullets: [
      'Analogous (top-down) — scale from a similar past project ("like the last platform build, +30%"). Fast, rough; good for early ballparks.',
      'Parametric — multiply a rate by a size driver (e.g. $/story point, $/integration, $/seat). Reliable when you have a calibrated rate and a countable size.',
      'Bottom-up — sum detailed line items by role, task, and resource. The most accurate and the most effort; this is KerdosSOW’s core model.',
      'Three-point / PERT — capture optimistic (o), most-likely (m), and pessimistic (p) effort, then use the weighted mean (o + 4m + p) / 6. It tames optimism bias and surfaces risk.',
    ],
    links: [{ label: 'Use PERT in the tool', to: '/help#uc-pert-estimate' }],
  },
  {
    id: 'sizing',
    title: 'Sizing the work',
    body: [
      'Break the work down until each piece is small enough to estimate with confidence (a day or two of effort, or a clear unit of cloud usage). Decompose by SDLC phase (planning, design, development, testing, deployment, maintenance) and by role.',
      'For each labor line, estimate quantity × units (hours or days) at the governed role rate. For infrastructure, count the resources you’ll actually run. A tagged SDLC phase lets you see where the cost concentrates.',
    ],
    bullets: [
      'Estimate effort per role, not as a lump sum — different rates, different risk.',
      'Tag lines with an SDLC phase to get a phase breakdown.',
      'Use the category breakdown to sanity-check the mix (labor vs compute vs storage vs SaaS).',
    ],
    links: [
      { label: 'Add a labor line', to: '/help#uc-add-labor-line' },
      { label: 'SDLC phases', to: '/help#uc-tag-sdlc-phase' },
    ],
  },
  {
    id: 'uncertainty',
    title: 'Accounting for uncertainty',
    body: [
      'Every estimate is a range, not a point. Make the uncertainty explicit instead of padding silently. Two complementary tools: three-point estimation on risky lines, and a contingency on the whole estimate.',
      'Contingency covers known-unknowns — things you expect to go wrong but can’t yet price. Size it to the project’s risk: a well-understood build might carry 10–15%; a novel, dependency-heavy effort 25–40%. Record why you chose the number.',
    ],
    bullets: [
      'Use three-point/PERT where effort is genuinely uncertain; use point estimates where it isn’t.',
      'Set contingency from risk, not habit — and note the rationale in the assumptions.',
      'Contingency is applied after upcharge, on the upcharged subtotal — a single, consistent order.',
    ],
    links: [{ label: 'Apply contingency', to: '/help#uc-apply-contingency' }],
  },
  {
    id: 'pricing',
    title: 'From cost to price',
    body: [
      'Cost is what delivery consumes; price is what the client pays. Keep them separate. An upcharge (global, with per-line overrides) marks lines up; margin and tax turn internal cost into a client-facing price. Be deliberate about which number you’re quoting.',
    ],
    bullets: [
      'Upcharge for blended overhead/risk on specific lines; margin for business profit on the whole.',
      'The grand total is cost; the client price includes margin and tax.',
    ],
    links: [
      { label: 'Apply an upcharge', to: '/help#uc-apply-upcharge' },
      { label: 'Margin, tax & client price', to: '/help#uc-margin-tax-client-price' },
    ],
  },
  {
    id: 'run-costs',
    title: 'Build cost vs. run cost',
    body: [
      'Distinguish one-time build cost from the ongoing run-rate. Cloud, managed services, and SaaS are mostly recurring — they keep costing money after go-live. Model them as monthly or yearly so the estimate shows total cost of ownership, not just the project to build it.',
      'Each line has a billing period; recurring lines roll up to monthly and yearly totals. For cloud and SaaS, set the usage realistically (hours, GB, requests, or seats per month).',
    ],
    links: [
      { label: 'One-time vs monthly vs yearly', to: '/help#uc-set-billing-period' },
      { label: 'Cloud resources & categories', to: '/guide#cloud-categories' },
    ],
  },
  {
    id: 'assumptions',
    title: 'Documenting assumptions',
    body: [
      'An estimate without assumptions can’t be defended or compared. Write down what you assumed about scope, team, rates, dependencies, and environment. When a number is questioned, the assumption is the answer — and when scope changes, the assumptions tell you what to revisit.',
    ],
    links: [{ label: 'Record assumptions', to: '/help#uc-record-assumptions' }],
  },
  {
    id: 'baselines',
    title: 'Baselines & re-estimation',
    body: [
      'Capture a baseline when an estimate is approved — a frozen snapshot of the totals. As the project evolves, re-estimate and compare against the baseline to see drift and explain variance. Estimating is iterative: refine as uncertainty resolves.',
    ],
    links: [
      { label: 'Capture a baseline', to: '/help#uc-baselines-versions' },
      { label: 'Compare scenarios', to: '/help#uc-scenarios-compare' },
    ],
  },
  {
    id: 'pitfalls',
    title: 'Common pitfalls & biases',
    body: ['Most bad estimates fail in predictable ways. Watch for these:'],
    bullets: [
      'Optimism bias — assuming the best case. Counter with three-point estimation and contingency.',
      'Anchoring — fixating on the first number heard (a client’s budget, a gut figure). Estimate bottom-up first, then compare.',
      'Forgetting non-labor — licenses, infrastructure, cloud egress, support, and SaaS subscriptions add up.',
      'Ignoring run cost — quoting only the build and missing the monthly/yearly operating cost.',
      'Scope creep & the planning fallacy — under-counting tasks and integration/testing effort.',
      'Padding silently — burying buffer in line items instead of an explicit, defensible contingency.',
    ],
  },
  {
    id: 'worked-example',
    title: 'A worked example',
    body: ['A small API platform, bottom-up:'],
    bullets: [
      '1. Pick a rate card so labor uses governed rates.',
      '2. Labor by role & phase — Architect (design), 2 Engineers (development), QA (testing); use three-point units where effort is uncertain.',
      '3. Cloud run-rate — compute (a couple of instances), a managed database, storage, and egress, set to monthly usage.',
      '4. SaaS & tools — observability (Datadog), source control (GitHub), and identity (Okta), priced per seat/host per month.',
      '5. Contingency — 20% for a moderately novel build; note the rationale in the assumptions.',
      '6. Markup — a global upcharge, then margin & tax for the client price.',
      '7. Review the category and SDLC-phase breakdowns, capture a baseline, and export.',
    ],
    links: [
      { label: 'Create an estimate', to: '/help#uc-create-estimate' },
      { label: 'Use the smart checklist', to: '/help#uc-smart-checklist' },
    ],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    body: ['Common estimating terms used throughout KerdosSOW:'],
    bullets: [
      'Bottom-up — building the total from detailed line items.',
      'PERT / three-point — (optimistic + 4×most-likely + pessimistic) / 6.',
      'Contingency — a risk buffer applied to the (upcharged) subtotal.',
      'Upcharge — a markup percentage on lines (global or per-line).',
      'Margin / markup — business profit added to turn cost into price.',
      'Rate card — a governed set of roles and rates.',
      'SDLC phase — planning, design, development, testing, deployment, maintenance.',
      'Run-rate — recurring monthly/yearly operating cost.',
      'TCO — total cost of ownership: build cost plus run cost over time.',
      'Baseline — a frozen snapshot of the totals for comparison.',
      'Snapshot — a rate or unit price captured onto a line so saved estimates never change.',
    ],
  },
];
