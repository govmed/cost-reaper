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

  // Create an estimate (FR-4)
  const name = `E2E Estimate ${Date.now()}`;
  await page.getByPlaceholder('Q3 Platform build').fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Grand total')).toBeVisible();

  // Add a non-labor line (FR-6) and see it appear
  await page.getByTitle('Cost category').selectOption('Licenses');
  await page.getByPlaceholder('amount').fill('1000');
  await page.getByRole('button', { name: 'Add non-labor' }).click();
  // Scope to the non-labor section — "Licenses" also appears in the category breakdown.
  await expect(page.locator('#sec-nonlabor').getByRole('cell', { name: 'Licenses' })).toBeVisible();
  // Billing period renders its DB-driven label ("One-time"), not the raw code (FR-29).
  await expect(page.getByRole('cell', { name: 'One-time', exact: true })).toBeVisible();

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
  await page.getByRole('button', { name: 'Add non-labor' }).click();
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
  await page.getByRole('button', { name: 'Add labor' }).click();
  await expect(page.getByRole('cell', { name: 'CapTester' })).toBeVisible();

  // …a second overlapping 60% booking would exceed 100% → save is rejected.
  await roleSelect.selectOption({ index: 1 });
  await page.getByPlaceholder('resource (optional)').fill('CapTester');
  await page.getByPlaceholder('alloc %').fill('60');
  await dates.nth(0).fill('2026-07-15');
  await dates.nth(1).fill('2026-08-15');
  await page.getByRole('button', { name: 'Add labor' }).click();
  await expect(page.getByText(/over-allocated/i)).toBeVisible();
});

test('Reference data admin page serves DB-driven values (FR-29)', async ({ page }) => {
  await login(page);
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
  await page.getByRole('link', { name: 'FX Rates' }).click();
  await expect(page.getByRole('heading', { name: 'FX rates' })).toBeVisible();
  await expect(page.getByText('Last updated (local)')).toBeVisible();
  // Admin sees a refresh control. Not clicked here — it makes a live network call.
  await expect(page.getByRole('button', { name: 'Refresh rates' })).toBeVisible();
});

test('Workflow admin page shows the configurable default workflow (FR-24)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Workflow', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Workflow' })).toBeVisible();
  await expect(page.getByText('Default Approval Workflow')).toBeVisible();
  // Seeded stages + a seeded transition render (read-only assertions — no mutation).
  await expect(page.getByRole('cell', { name: 'DRAFT', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transitions' })).toBeVisible();
  // Admin sees the authoring controls.
  await expect(page.getByRole('button', { name: 'Add stage' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add transition' })).toBeVisible();
});

test('Checklist-rules admin page lists the rules (FR-25)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Checklist Rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Checklist rules' })).toBeVisible();
  // A seeded built-in rule renders (read-only assertions — no mutation of shared rules).
  await expect(page.getByText('rate_card_selected')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible();
});

test('User Guide page renders and deep-links by section (NFR-12)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'User Guide', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'User Guide' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Building an estimate' })).toBeVisible();
  // Deep-link by section anchor.
  await page.goto('/guide#administration');
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
});

test('Roles & permissions page shows the capability matrix (FR-2/NFR-16)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Roles', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Roles & permissions' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Create & edit estimates' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Manage users & roles' })).toBeVisible();
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
