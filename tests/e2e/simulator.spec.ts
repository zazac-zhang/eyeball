import { test, expect } from '@playwright/test';

test.describe('Eyeball Surgery Simulator', () => {
  test('loads the application with canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('renders HUD panels after hydration', async ({ page }) => {
    await page.goto('/');
    // Wait for React to hydrate and render the panels
    await page.waitForTimeout(2000);
    await expect(page.locator('canvas')).toBeVisible();
    // Check that the page has content (basic smoke test)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('canvas is interactive (OrbitControls)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    // Try dragging - should not crash
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();
  });
});
