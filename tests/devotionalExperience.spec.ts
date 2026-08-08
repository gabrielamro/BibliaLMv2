import { expect, test } from '@playwright/test';

const devotionalFixture = {
  id: 'daily:2026-08-04:test',
  date: '2026-08-04',
  title: 'A Paz Que Supera Toda Preocupação',
  verseReference: 'Filipenses 4:6-7',
  verseText: 'Não andem ansiosos por coisa alguma; apresentem seus pedidos a Deus.',
  content: 'Paulo nos convida a trocar a ansiedade pela oração. A paz de Deus guarda o coração de quem confia em Cristo.',
  prayer: 'Senhor, recebe minhas preocupações e firma meu coração em tua paz. Amém.',
  source: 'catalog',
  refreshAvailable: true,
};

test.describe('Pão Diário guiado', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/devotional/daily', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(devotionalFixture) });
    });
    await page.route('**/api/bible/context**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          verses: [
            { number: 5, text: 'Perto está o Senhor.' },
            { number: 6, text: devotionalFixture.verseText },
            { number: 7, text: 'A paz de Deus guardará os vossos corações.' },
            { number: 8, text: 'Tudo o que é verdadeiro, nisso pensai.' },
          ],
          startVerse: 5,
          endVerse: 8,
          hasSurroundingVerses: true,
        }),
      });
    });
  });

  test('apresenta a Palavra e conduz pelas cinco etapas', async ({ page }) => {
    await page.goto('/devocional');

    await expect(page.getByTestId('pao-diario-page')).toBeVisible();
    await expect(page.getByTestId('pao-diario-header')).toBeVisible();
    await expect(page.getByTestId('devotional-desktop-date-card')).toBeVisible();
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
    await expect(page.getByTestId('cultoplus-desktop-menu')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pão Diário', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: devotionalFixture.title })).toBeVisible();
    await expect(page.getByTestId('devotional-verse-overview')).toBeVisible();
    await expect(page.getByTestId('devotional-study-reader')).toBeVisible();
    await expect(page.getByTestId('devotional-stage-navigation')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(5);
    await expect(page.getByRole('tab', { name: 'Etapa 1: Ler a Palavra' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('devotional-step-1')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contexto bíblico imediato' })).toBeVisible();
    await expect(page.getByTestId('devotional-focus-verse').first()).toBeVisible();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByTestId('devotional-step-2')).toBeVisible();
    await expect(page.getByLabel('O que esta Palavra despertou em você?')).toBeVisible();
  });

  test('oferece tamanho de texto e modo sem interrupções sem recarregar o estudo', async ({ page }) => {
    await page.goto('/devocional');
    await expect(page.getByTestId('pao-diario-page')).toBeVisible();

    const largeTextButton = page.getByRole('button', { name: 'Aumentar texto' });
    await largeTextButton.click();
    await expect(largeTextButton).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Modo sem interrupções' }).click();
    await expect(page.getByRole('button', { name: 'Sair do modo sem interrupções' })).toBeVisible();
    await expect(page.getByTestId('pao-diario-page')).toBeVisible();
    await expect(page.getByTestId('cultoplus-page-shell')).toHaveCount(0);
    await page.getByRole('button', { name: 'Sair do modo sem interrupções' }).click();
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
  });

  test('mantém a experiência legível no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/devocional');

    await expect(page.getByTestId('pao-diario-page')).toBeVisible();
    await expect(page.getByTestId('pao-diario-header')).toBeVisible();
    await expect(page.getByTestId('devotional-date')).toBeVisible();
    await expect(page.getByTestId('devotional-desktop-date-card')).toBeHidden();
    await expect(page.getByTestId('devotional-step-1')).toBeVisible();
    await expect(page.getByTestId('cultoplus-mobile-menu-header')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar estudo' })).toBeVisible();
    await expect(page.getByTestId('cultoplus-mobile-bottom-nav')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('preserva tipografia bíblica, largura editorial e rolagem até o rodapé', async ({ page }) => {
    await page.goto('/devocional');
    const reader = page.getByTestId('devotional-study-reader');
    await expect(reader).toBeVisible();

    const [headerBox, readerBox] = await Promise.all([
      page.getByTestId('pao-diario-header').boundingBox(),
      reader.boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(readerBox).not.toBeNull();
    expect(readerBox!.width).toBeGreaterThan(headerBox!.width * 0.55);

    const verseFont = await page.getByTestId('devotional-main-verse').evaluate((element) => getComputedStyle(element).fontFamily);
    expect(verseFont).toMatch(/Georgia|Cambria|Times New Roman/i);

    const disclaimer = page.getByText(/A reflexão auxilia a leitura/);
    await disclaimer.scrollIntoViewIfNeeded();
    await expect(disclaimer).toBeVisible();
  });
});
