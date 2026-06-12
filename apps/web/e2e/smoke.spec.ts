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
  await page.getByPlaceholder('Category (e.g. Licenses)').fill('Tooling');
  await page.getByPlaceholder('amount').fill('1000');
  await page.getByRole('button', { name: 'Add non-labor' }).click();
  await expect(page.getByRole('cell', { name: 'Tooling' })).toBeVisible();

  // The governance checklist panel renders (FR-25)
  await expect(page.getByRole('heading', { name: 'Smart checklist' })).toBeVisible();
});
