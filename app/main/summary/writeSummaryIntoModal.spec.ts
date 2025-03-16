import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerkSetup } from '@clerk/testing/playwright';
import {
  authFile,
  frontendApiUrl,
  password,
  publishableKey,
  username,
} from '#/tests/.auth/constants';

/**
 *
 * Edited: Thu 13 Jun 2024 02:16:23 PM CDT
 * Not successful.
 *
 */
test.describe('app', () => {
  test(
    'Sign in, open modal, navigate to the summary tab, write to the summary a random string, save it then close modal and reopen modal to see if the summary is still there.'
    
    
    , async ({ page }) => {
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
