import { expect, test } from '@playwright/test';

test('pain point detail renders (visual smoke)', async ({ page }) => {
  await page.goto('/blog/pain-points', { timeout: 60000 });
  await page.waitForLoadState('networkidle');

  const firstPainPoint = page.locator('a[href^="/blog/pain-points/"]').first();
  await expect(firstPainPoint).toBeVisible();
  await firstPainPoint.click();

  await page.waitForLoadState('networkidle');

  await expect(page).not.toHaveTitle(/not found/i);
  const notFoundHeading = page.getByRole('heading', { name: /not found/i });
  await expect(notFoundHeading).toHaveCount(0);

  const mainHeading = page.locator('article h1').first();
  await expect(mainHeading).toBeVisible();

  await page.screenshot({
    path: 'test-results/visual-pain-point-detail.png',
    fullPage: true,
  });
});
