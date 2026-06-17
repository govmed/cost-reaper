import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'change_me';

test('login → create estimate → add a line → see totals', async ({ page }) => {
  // Login (FR-1)
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Estimates' })).toBeVisible();
  // Brand: the app shell shows the Kerdos / Veridion LLC name.
  await expect(page.getByRole('link', { name: 'Kerdos' })).toBeVisible();

  // Create an estimate (FR-4)
  const name = `E2E Estimate ${Date.now()}`;
  await page.getByPlaceholder('Q3 Platform build').fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Grand total')).toBeVisible();

  // Add a non-labor line (FR-6) and see it appear
  await page.getByTitle('Cost category').selectOption('Licenses');
  await page.getByPlaceholder('amount').fill('1000');
  await page.getByRole('button', { name: 'Add non-labor', exact: true }).click();
  // Scope to the non-labor section — "Licenses" also appears in the category breakdown.
  await expect(page.locator('#sec-nonlabor').getByRole('cell', { name: 'Licenses' })).toBeVisible();
  // Billing period renders its DB-driven label ("One-time"), not the raw code (FR-29).
  await expect(
    page.locator('#sec-nonlabor').getByRole('cell', { name: 'One-time', exact: true }),
  ).toBeVisible();

  // The governance checklist panel renders (FR-25)
  await expect(page.getByRole('heading', { name: 'Smart checklist' })).toBeVisible();
  // Checklist items are clickable and a rate-card selector exists to fix them.
  await expect(page.getByText(/click an item to jump/)).toBeVisible();
  await expect(page.getByText('Rate card', { exact: true })).toBeVisible();

  // Printable summary (FE-23): opens a print-ready view with the estimate + Print button.
  await page.getByRole('link', { name: 'Printable summary' }).click();
  await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Grand total')).toBeVisible();
});

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Estimates' })).toBeVisible();
}

test('SDLC phase breakdown (FR-28), resource capacity guard (FR-27) + stage gate', async ({
  page,
}) => {
  await login(page);

  const name = `E2E Phase/Cap ${Date.now()}`;
  await page.getByPlaceholder('Q3 Platform build').fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // FR-28: tag a non-labor line with an SDLC phase → per-phase breakdown appears.
  await page.getByTitle('Cost category').selectOption('Infrastructure');
  await page.getByPlaceholder('amount').fill('500');
  await page.locator('select:has(option:has-text("Phase…"))').nth(1).selectOption('DEVELOPMENT');
  await page.getByRole('button', { name: 'Add non-labor', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cost by SDLC phase' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'DEVELOPMENT' }).first()).toBeVisible();

  // Stage gate (FR-24/25): with no rate card selected, a BLOCKER fails so the
  // "Submit for review" transition is gated (button disabled).
  await expect(page.getByRole('button', { name: 'Submit for review' })).toBeDisabled();

  // FR-27: book a resource at 60% for July…
  const roleSelect = page.locator('select:has(option:has-text("Select role"))');
  const dates = page.locator('input[type="date"]');
  await roleSelect.selectOption({ index: 1 });
  await page.getByPlaceholder('resource (optional)').fill('CapTester');
  await page.getByPlaceholder('alloc %').fill('60');
  await dates.nth(0).fill('2026-07-01');
  await dates.nth(1).fill('2026-07-31');
  await page.getByRole('button', { name: 'Add labor', exact: true }).click();
  await expect(
    page.locator('#sec-labor tbody').getByRole('cell', { name: 'CapTester' }),
  ).toBeVisible();

  // …a second overlapping 60% booking would exceed 100% → save is rejected.
  await roleSelect.selectOption({ index: 1 });
  await page.getByPlaceholder('resource (optional)').fill('CapTester');
  await page.getByPlaceholder('alloc %').fill('60');
  await dates.nth(0).fill('2026-07-15');
  await dates.nth(1).fill('2026-08-15');
  await page.getByRole('button', { name: 'Add labor', exact: true }).click();
  await expect(page.getByText(/over-allocated/i)).toBeVisible();
});

test('Reference data admin page serves DB-driven values (FR-29)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByRole('link', { name: 'Reference Data' }).click();
  await expect(page.getByRole('heading', { name: 'Reference data' })).toBeVisible();
  // The seeded SDLC_PHASE type and its values render (default selection).
  await page.getByRole('button', { name: /SDLC Phase/ }).click();
  // Built-in values render their rows (each exposes Rename; Delete is hidden).
  await expect(page.getByRole('button', { name: 'Rename' }).first()).toBeVisible();
  await expect(page.getByText('Development').first()).toBeVisible();
});

test('Help guide lists use cases and deep-links by anchor', async ({ page }) => {
  await login(page);
  // The persistent floating Help button is present on authenticated pages.
  await expect(page.getByRole('link', { name: 'Help and guides' })).toBeVisible();
  await page.getByRole('button', { name: 'Docs' }).click();
  await page.getByRole('link', { name: 'Help', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Help & use cases' })).toBeVisible();
  // A known meta-tagged use case renders with its steps.
  await expect(
    page.getByRole('heading', { name: 'Choose a rate card for an estimate' }),
  ).toBeVisible();

  // Deep-link straight into a specific use case by its anchor (the join key the
  // smart checklist's "How?" link uses).
  await page.goto('/help#uc-add-cloud-line');
  await expect(
    page.getByRole('heading', { name: 'Add a cloud compute line (AWS / GCP / Azure)' }),
  ).toBeVisible();

  // Search narrows the catalog.
  await page.getByPlaceholder(/Search guides/).fill('upcharge');
  await expect(
    page.getByRole('heading', { name: 'Apply an upcharge (global + per-line)' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Choose a rate card for an estimate' }),
  ).toHaveCount(0);
});

test('FX rates show last-updated time and a refresh button (FR-17)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Pricing' }).click();
  await page.getByRole('link', { name: 'FX Rates' }).click();
  await expect(page.getByRole('heading', { name: 'FX rates' })).toBeVisible();
  await expect(page.getByText('Last updated (local)')).toBeVisible();
  // Admin sees a refresh control. Not clicked here — it makes a live network call.
  await expect(page.getByRole('button', { name: 'Refresh rates' })).toBeVisible();
});

test('Workflow repo lists workflows and opens the editor (FR-24)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Governance' }).click();
  await page.getByRole('link', { name: 'Workflows', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workflows' })).toBeVisible();
  // The default workflow's system key renders as text (the label is an editable input for admins).
  await expect(page.getByText('WF-DEFAULT')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create workflow' })).toBeVisible();
  // Open the default workflow's stage/transition editor.
  await page
    .getByRole('link', { name: /Edit stages/ })
    .first()
    .click();
  await expect(page.getByRole('cell', { name: 'DRAFT', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transitions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add stage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add transition' })).toBeVisible();
});

test('Checklist rule-set repo lists sets and opens the rule editor (FR-25)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Governance' }).click();
  await page.getByRole('link', { name: 'Checklist Rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Checklist rule sets' })).toBeVisible();
  // The default set's system key renders as text (the label is an editable input for admins).
  await expect(page.getByText('RS-DEFAULT')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create rule set' })).toBeVisible();
  // Open the default set's rule editor.
  await page
    .getByRole('link', { name: /Edit rules/ })
    .first()
    .click();
  // A seeded built-in rule renders (read-only assertions — no mutation of shared rules).
  await expect(page.getByText('rate_card_selected')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible();
});

test('User Guide page renders and deep-links by section (NFR-12)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Docs' }).click();
  await page.getByRole('link', { name: 'User Guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'User Guide' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Building an estimate' })).toBeVisible();
  // Deep-link by section anchor.
  await page.goto('/guide#administration');
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
});

test('Estimation Guide renders and deep-links by section (NFR-12)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Docs' }).click();
  await page.getByRole('link', { name: 'Estimation Guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Estimation Guide' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Estimation techniques' })).toBeVisible();
  await page.goto('/estimation-guide#glossary');
  await expect(page.getByRole('heading', { name: 'Glossary' })).toBeVisible();
});

test('Roles & permissions page shows the capability matrix (FR-2/NFR-16)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Governance' }).click();
  await page.getByRole('link', { name: 'Roles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Roles & permissions' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Author estimates' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Manage users' })).toBeVisible();
  // The three role columns render.
  await expect(page.getByRole('columnheader', { name: 'Estimator' })).toBeVisible();
});

test('Dashboard summarizes estimates and drills into a stage (FR-18)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Total value')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'By workflow stage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();

  // Click a workflow-stage row to drill into its estimates.
  const stageSection = page.locator('section:has(h2:has-text("By workflow stage"))');
  await expect(stageSection.getByText('Click a stage to see its estimates.')).toBeVisible();
  const firstStage = stageSection.getByRole('button').first();
  await firstStage.click();
  await expect(firstStage).toHaveAttribute('aria-expanded', 'true');
});

test('Statement of Work: create from an approved estimate, edit, open PDF (BR-7)', async ({
  page,
}) => {
  await login(page);

  // A SOW can only be built from an APPROVED estimate; the seed ships one, so it's
  // the only option in the picker (a draft estimate would not appear).
  await page.getByRole('link', { name: 'SOW', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Statements of Work' })).toBeVisible();
  await page.locator('select[title="Source estimate"]').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'New SOW from estimate' }).click();

  // Lands on the editor — a system SOW number + editable title + Save.
  await expect(page.getByText(/SOW-/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();

  // Open the official PDF view (browser print-to-PDF).
  await page.getByRole('link', { name: 'Open PDF view' }).click();
  await expect(page.getByRole('heading', { name: 'Statement of Work', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Print/ })).toBeVisible();
  // Pricing is §9 now that the SOW follows the full template structure (BR-7).
  await expect(page.getByRole('heading', { name: '9. Pricing' })).toBeVisible();
});

test('a freshly created estimate has no green checklist items (FR-25)', async ({ page }) => {
  await login(page);

  // Just create an estimate — touch nothing else.
  const name = `E2E Fresh Checklist ${Date.now()}`;
  await page.getByPlaceholder('Q3 Platform build').fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  const checklist = page.locator('section:has(h2:has-text("Smart checklist"))');
  await expect(checklist).toBeVisible();
  // Untouched estimate → 0% complete and NOTHING green (no ✓ anywhere in the panel).
  await expect(checklist.getByText('0% complete')).toBeVisible();
  await expect(checklist.getByText('✓')).toHaveCount(0);
  // The real prerequisites are flagged (red ✕); not-started rules read as an
  // actionable "To do" (amber ○), never a green pass.
  await expect(checklist.getByText('Select a rate card for the estimate.')).toBeVisible();
  await expect(checklist.getByText('Add at least one line item.')).toBeVisible();
  await expect(checklist.getByText('To do:').first()).toBeVisible();
  await expect(checklist.getByText('Add labor lines and assign each a role.')).toBeVisible();
  // Polish: a completeness progress bar + at-a-glance counts ("N to fix" / "M to do").
  await expect(checklist.getByRole('progressbar')).toBeVisible();
  await expect(checklist.getByText(/\d+ to fix/)).toBeVisible();
  await expect(checklist.getByText(/\d+ to do/)).toBeVisible();
});
