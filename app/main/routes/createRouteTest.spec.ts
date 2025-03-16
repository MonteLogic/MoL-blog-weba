import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerkSetup } from '@clerk/testing/playwright';
import {
  authFile,
  frontendApiUrl,
  password,
  publishableKey,
  username,
} from '#/tests/.auth/constants';

async function authenticateUser(page: any) {
  await clerkSetup({ publishableKey, frontendApiUrl });
  await setupClerkTestingToken({
    page,
    options: { frontendApiUrl: process.env.CLERK_FRONTEND_API_URL },
  });
  await page.goto('/main');
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
  await page.waitForURL('**/main');
  await page.waitForLoadState('networkidle');
  // Choose organization
}

/**
 *
 * Editing:
 * Wed 19 Jun 2024 07:14:20 AM CDT
 *
 */

test.describe('app', () => {
  test('sign in', async ({ page }) => {
    await authenticateUser(page);
    await page.screenshot({ path: 'screenshot7.png' });
  });

  test('Create a route with two shifts', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/main/routes');
    // await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshot8.png' });

    // Fill in the route name
    await page.locator('#route-name-input-1').fill('Main Street Route');
    await page.screenshot({ path: 'screenshot9.png' });

    // Fill in the route ID
    await page.locator('#route-id-input-1').fill('MSR001');

    // Add the first shift
    await page.fill('input[placeholder="Shift Trip Name"]', 'Morning Shift');
    await page.fill('input[placeholder="Start Time"]', '05:00');
    await page.fill('input[placeholder="End Time"]', '09:00');
    await page.click('button:has-text("Add Shift")');

    // Add the second shift
    await page.fill('input[placeholder="Shift Trip Name"]', 'Afternoon Shift');
    await page.fill('input[placeholder="Start Time"]', '15:00');
    await page.fill('input[placeholder="End Time"]', '19:00');
    await page.click('button:has-text("Add Shift")');
    await page.screenshot({ path: 'screenshot10.png' });
    // Check if the <ul> element exists
    const ulRouteShifts = await page.locator('ul#route-shifts-ul-1');
    await expect(ulRouteShifts).toBeVisible();

    // Select the <li> element with the ID "li-of-ul-0"
    const targetListItem = await page.$('ul#route-shifts-ul-1 li#li-of-ul-0');

    if (targetListItem) {
      // Retrieve the text content of the <span> within the target <li>
      const spanText = await targetListItem.$eval(
        'span',
        (el) => el.textContent,
      );

      // Assert that the text content matches the expected value
      expect(spanText).toBe('Morning Shift: 05:00 - 09:00');
    } else {
      throw new Error('The <li> element with ID "li-of-ul-0" was not found.');
    }

    // Await the allTextContents() method to get the text contents

    // Select all the <li> elements within the <ul>
    const listItems = await page.$$('ul#route-shifts-ul-1 li');

    // Iterate over each <li> element
    for (const listItem of listItems) {
      if (listItem) {
        // Retrieve the text content of the <span> within the <li>
        const spanText = await listItem.$eval('span', (el) => el.textContent);
        console.log(spanText);
      } else {
        console.log('An <li> element was not found.');
      }
    }
    // Click the "Add Route" button
    await page.click('button:has-text("Add Route")');

    // Add assertions to verify the route creation success message or redirection
    // For example:
    // await expect(page.locator('text=Route created successfully')).toBeVisible();
    // Or:
    // await expect(page).toHaveURL('http://localhost:3000/routes');
  });
});
