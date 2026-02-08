import { test, expect } from '@playwright/test';

test.skip('checks render for DistributorHeader filter', async ({ page }) => {
  await page.goto('/', { timeout: 60000 });

  await page.waitForLoadState('networkidle');

  const headingLocator = page.locator('h1.text-xl.font-bold');
  const headingVisible = await headingLocator.isVisible();

  const listItemLocator = page.locator('ul li h4');
  const listItemVisible = await listItemLocator.isVisible();

  const imageLocator = page.locator('ul li a img');
  const imageVisible = await imageLocator.isVisible();

  const linkLocator = page.locator('a.inline-flex');
  const linkVisible = await linkLocator.isVisible();

  // Log any console messages from the page
  page.on('console', (msg) => msg.text());

  // Evaluate JavaScript within the page context
  const pageContent = await page.evaluate(() => {
    // Check for the presence of specific elements or log any error messages
    const element = document.querySelector('selector-for-element');
    return document.body.innerText;
  });

  // Produce a screenshot of the page
  await page.screenshot({ path: 'screenshot.png' });
});
