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
  await expect(page.getByRole('cell', { name: 'Licenses' })).toBeVisible();

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
  await page.getByRole('link', { name: 'Reference data' }).click();
  await expect(page.getByRole('heading', { name: 'Reference data' })).toBeVisible();
  // The seeded SDLC_PHASE type and its values render (default selection).
  await page.getByRole('button', { name: /SDLC Phase/ }).click();
  // Built-in values render their rows (each exposes Rename; Delete is hidden).
  await expect(page.getByRole('button', { name: 'Rename' }).first()).toBeVisible();
  await expect(page.getByText('Development').first()).toBeVisible();
});

test('Dashboard summarizes estimates (FR-18)', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Total value')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'By workflow stage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
});
