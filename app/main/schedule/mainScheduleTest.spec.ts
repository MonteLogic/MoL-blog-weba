import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerkSetup } from '@clerk/testing/playwright';
import {
  authFile,
  frontendApiUrl,
  password,
  publishableKey,
  username,
} from '../../../tests/.auth/constants';

/**
 *
 * This is the test which works as of:
 * Tue 11 Jun 2024 12:25:11 PM CDT
 *
 */
// I feel like if you run the test right here
// it doesn't hit the global pre-requisite test.
test.describe('app', () => {
  test('sign in and take a screenshot of main/schedule.', async ({ page }) => {
    await clerkSetup({ publishableKey, frontendApiUrl });

    await setupClerkTestingToken({
      page,
      options: { frontendApiUrl: process.env.CLERK_FRONTEND_API_URL },
    });
    await page.goto('/main/schedule');
    await expect(page.locator('h1')).toContainText('Sign in');
    await page.waitForSelector('.cl-signIn-root', { state: 'attached' });
    await page
      .locator('input[name=identifier]')
      .fill(process.env.E2E_CLERK_USER_USERNAME!);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page
      .locator('input[name=password]')
      .fill(process.env.E2E_CLERK_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.waitForURL('**/main/schedule');
    // await page.waitForTimeout(2000);

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshot6.png' });
  });
});
