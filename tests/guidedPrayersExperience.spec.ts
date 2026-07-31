import { expect, test } from '@playwright/test';

test.describe('Orações no tema bíblico Culto+', () => {
  test('usa a mesma linguagem visual do Pão Diário e preserva os fluxos principais', async ({ page }) => {
    await page.goto('/oracoes');

    const prayerPage = page.getByTestId('guided-prayers-page');
    const dailyPrayer = page.getByTestId('prayer-of-the-day');
    const generator = page.getByTestId('personal-prayer-generator');

    await expect(prayerPage).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
    await expect(dailyPrayer).toBeVisible();
    await expect(generator).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Oração do Dia' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ouvir oração do dia' })).toBeVisible();

    const heroBackground = await dailyPrayer.evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(heroBackground).toContain('linear-gradient');
    expect(heroBackground).not.toMatch(/6,\s*63,\s*58|8,\s*122,\s*107/);

    const prayerTextColor = await dailyPrayer.locator('.smart-text-content').evaluate((element) => (
      getComputedStyle(element.parentElement as HTMLElement).color
    ));
    expect(prayerTextColor).toBe('rgb(231, 224, 212)');

    const allFilter = page.getByRole('button', { name: 'Tudo', exact: true });
    const morningFilter = page.getByRole('button', { name: 'Manhã', exact: true });
    await expect(allFilter).toHaveAttribute('aria-pressed', 'true');
    await morningFilter.click();
    await expect(morningFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('guided-prayers-grid')).toBeVisible();

    const topicInput = page.getByPlaceholder('Pelo que você quer orar? Ex: entrevista de emprego');
    const generateButton = page.getByRole('button', { name: 'Gerar oração personalizada' });
    await expect(generateButton).toBeDisabled();
    await topicInput.fill('sabedoria');
    await expect(generateButton).toBeEnabled();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('mantém o template responsivo no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/oracoes');

    await expect(page.getByTestId('guided-prayers-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('cultoplus-mobile-menu-header')).toBeVisible();
    await expect(page.getByTestId('prayer-of-the-day')).toBeVisible();
    await expect(page.getByTestId('personal-prayer-generator')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
