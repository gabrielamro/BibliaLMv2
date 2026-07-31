import { expect, test } from '@playwright/test';

test.describe('Largura editorial do Reino', () => {
  test('aproveita melhor o desktop sem ocupar toda a página', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/social');

    const column = page.getByTestId('kingdom-feed-column');
    await expect(column).toBeVisible({ timeout: 30_000 });

    const box = await column.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(940);
    expect(box!.width).toBeLessThanOrEqual(980);

    const heroBox = await page.getByTestId('kingdom-hero').boundingBox();
    const composerBox = await page.getByTestId('kingdom-composer-shortcut').boundingBox();
    expect(heroBox).not.toBeNull();
    expect(composerBox).not.toBeNull();
    expect(Math.abs(heroBox!.width - composerBox!.width)).toBeLessThan(2);
  });

  test('continua fluido no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/social');

    await expect(page.getByTestId('kingdom-feed-column')).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
