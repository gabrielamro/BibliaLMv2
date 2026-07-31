import { expect, test } from '@playwright/test';

test.describe('Pão Diário guiado', () => {
  test('conduz pelas cinco etapas e abre a prévia específica do feed', async ({ page }) => {
    await page.goto('/devocional');

    await expect(page.getByTestId('pao-diario-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('pao-diario-header')).toBeVisible();
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
    await expect(page.getByTestId('cultoplus-desktop-menu')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pão Diário', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('devotional-reading-article')).toBeVisible();
    await expect(page.getByTestId('devotional-study-reader')).toBeVisible();
    await expect(page.getByTestId('pao-diario-header').locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'A Palavra antes de tudo' })).toHaveCount(0);
    await expect(page.locator('aside')).toHaveCount(1);
    await expect(page.getByTitle('Abrir Obreiro IA')).toHaveCount(0);
    await expect(page.getByTestId('devotional-stage-navigation')).toBeVisible();
    await expect(page.getByText('Etapas do estudo', { exact: true })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(5);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveAttribute('aria-label', /etapa 1: ler a palavra/i);
    await expect(page.getByTestId('devotional-step-1')).toBeVisible();
    await expect(page.getByTestId('devotional-verse-overview')).toBeVisible();
    await expect(page.getByTestId('devotional-biblical-context')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contexto bíblico imediato' })).toBeVisible();
    await expect(page.getByTestId('devotional-biblical-context').getByText(/· texto bíblico$/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('devotional-biblical-context').locator('li[aria-current="location"]').first()).toBeVisible();
    expect(await page.getByTestId('devotional-biblical-context').locator('li').count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByRole('heading', { name: 'Observe no texto' })).toBeVisible();
    await expect(page.getByTestId('devotional-observation')).toBeVisible();
    await expect(page.getByTestId('devotional-pastoral-reflection')).toBeVisible();
    const centralText = page.getByTestId('devotional-central-text');
    await expect(centralText).toBeVisible();
    expect(await centralText.locator('p').count()).toBeGreaterThanOrEqual(2);
    expect(await centralText.locator('strong').count()).toBeGreaterThan(0);
    expect(await centralText.locator('p').first().evaluate((element) => getComputedStyle(element).textAlign)).toBe('justify');
    const [reflectionBox, centralTextBox] = await Promise.all([
      page.getByTestId('devotional-pastoral-reflection').boundingBox(),
      centralText.boundingBox(),
    ]);
    expect(reflectionBox).not.toBeNull();
    expect(centralTextBox).not.toBeNull();
    expect(Math.abs((reflectionBox!.x + reflectionBox!.width / 2) - (centralTextBox!.x + centralTextBox!.width / 2))).toBeLessThan(2);
    await expect(page.getByText('Reflexão pastoral para auxiliar a leitura; confira sempre o sentido no capítulo completo.')).toBeVisible();
    const readingOrder = await page.evaluate(() => {
      const selectors = [
        '[data-testid="devotional-main-verse"]',
        '[data-testid="devotional-pastoral-reflection"]',
        '[data-testid="devotional-biblical-context"]',
        '[data-testid="devotional-observation"]',
        '[data-testid="devotional-stage-navigation"]',
      ];
      return selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return -1;
        return Array.from(document.querySelectorAll('*')).indexOf(element);
      });
    });
    expect(readingOrder.every((position) => position >= 0)).toBe(true);
    expect(readingOrder).toEqual([...readingOrder].sort((first, second) => first - second));
    for (let step = 2; step <= 5; step += 1) {
      await expect(page.getByTestId(`devotional-step-${step}`)).toHaveCount(0);
    }

    await page.getByRole('button', { name: 'Concluir leitura e continuar' }).click();
    await expect(page.getByTestId('devotional-step-2')).toBeVisible();
    await expect(page.getByTestId('devotional-step-1')).toHaveCount(0);
    await page.getByLabel('O que esta Palavra despertou em você?').fill('Quero praticar esta Palavra com serenidade.');
    await page.getByRole('button', { name: 'Salvar e continuar' }).click();
    await expect(page.getByTestId('devotional-step-3')).toBeVisible();
    await page.getByRole('button', { name: 'Dizer Amém e continuar' }).click();
    await expect(page.getByTestId('devotional-step-4')).toBeVisible();
    await page.getByRole('button', { name: /Marcar como praticado/ }).click();
    await page.getByRole('button', { name: 'Ir para conclusão' }).click();
    await expect(page.getByTestId('devotional-step-5')).toBeVisible();
    await page.getByRole('button', { name: 'Concluir Pão Diário' }).click();

    await expect(page.getByText('Pão Diário concluído', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Criar publicação no feed' }).click();
    await expect(page.getByRole('dialog', { name: 'Compartilhar o que edificou você' })).toBeVisible();
    await expect(page.getByTestId('devotional-feed-card')).toBeVisible();
    await expect(page.getByText('Sua reflexão pessoal não será publicada.')).toBeVisible();
    await expect(page.getByTestId('devotional-feed-card').getByText('Quero praticar esta Palavra com serenidade.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Publicar no feed' }).click();
    await expect(page.getByRole('dialog', { name: 'Compartilhar o que edificou você' })).toHaveCount(0);
    await expect(page.getByTestId('auth-modal-heading')).toHaveText('Bem-vindo');
  });

  test('oferece tamanho de texto e modo sem interrupções', async ({ page }) => {
    await page.goto('/devocional');
    await expect(page.getByTestId('pao-diario-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();

    const largeTextButton = page.getByRole('button', { name: 'Aumentar texto' });
    await largeTextButton.click();
    await expect(largeTextButton).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Modo sem interrupções' }).first().click();
    await expect(page.getByRole('button', { name: 'Sair do modo sem interrupções' })).toBeVisible();
    await expect(page.getByTestId('cultoplus-page-shell')).toHaveCount(0);
    await page.getByRole('button', { name: 'Sair do modo sem interrupções' }).click();
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
  });

  test('mantém a experiência legível no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/devocional');
    await expect(page.getByTestId('pao-diario-page')).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId('devotional-step-1')).toBeVisible();
    await expect(page.getByTestId('cultoplus-mobile-menu-header')).toBeVisible();
    await expect(page.getByRole('button', { name: /Começar estudo|Continuar estudo|Revisitar a Palavra/ })).toBeVisible();
    await expect(page.getByTestId('cultoplus-mobile-bottom-nav')).toHaveCount(0);
    const [stepBox, navigationBox] = await Promise.all([
      page.getByTestId('devotional-step-1').boundingBox(),
      page.getByTestId('devotional-stage-navigation').boundingBox(),
    ]);
    expect(stepBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect(navigationBox!.y).toBeGreaterThanOrEqual(stepBox!.y + stepBox!.height - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const titleSize = await page.getByTestId('pao-diario-header').locator('h1').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    expect(titleSize).toBeLessThanOrEqual(30);
  });

  test('confirma a atualização discreta no desktop e o gesto de puxar no mobile', async ({ page }) => {
    await page.goto('/devocional');
    await expect(page.getByTestId('pao-diario-page')).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
    await expect(page.getByText('Gerar um novo Pão Diário?')).toBeVisible();
    await expect(page.getByText(/uma atualização por dia/i)).toBeVisible();
    await page.getByRole('button', { name: 'Manter o atual' }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const main = document.querySelector<HTMLElement>('[data-testid="pao-diario-page"]');
      if (!main) throw new Error('Página do Pão Diário não encontrada.');
      const start = new Touch({ identifier: 1, target: main, clientX: 190, clientY: 10 });
      const end = new Touch({ identifier: 1, target: main, clientX: 190, clientY: 180 });
      main.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start] }));
      main.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [end] }));
      main.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [end] }));
    });
    await expect(page.getByText('Gerar um novo Pão Diário?')).toBeVisible();
  });

  test('usa tema bíblico premium, tipografia clássica e largura total', async ({ page }) => {
    await page.goto('/devocional');
    await expect(page.getByTestId('devotional-study-reader')).toBeVisible({ timeout: 30_000 });

    const [headerBox, readerBox] = await Promise.all([
      page.getByTestId('pao-diario-header').boundingBox(),
      page.getByTestId('devotional-study-reader').boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(readerBox).not.toBeNull();
    expect(readerBox!.width).toBeGreaterThan(headerBox!.width * 0.9);

    const verseFont = await page.getByTestId('devotional-step-1').locator('blockquote').evaluate((element) => getComputedStyle(element).fontFamily);
    expect(verseFont).toMatch(/Georgia|Cambria|Times New Roman/i);

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('devotional-focus-verse').first()).toBeVisible({ timeout: 30_000 });
    const [verseColor, focusVerseColor, readerColor] = await Promise.all([
      page.getByTestId('devotional-main-verse').evaluate((element) => getComputedStyle(element).color),
      page.getByTestId('devotional-focus-verse').first().locator('span').last().evaluate((element) => getComputedStyle(element).color),
      page.getByTestId('devotional-study-reader').evaluate((element) => getComputedStyle(element).backgroundColor),
    ]);
    const darkPalette = { verse: verseColor, focusVerse: focusVerseColor, reader: readerColor };
    expect(darkPalette).toEqual({
      verse: 'rgb(231, 224, 212)',
      focusVerse: 'rgb(231, 224, 212)',
      reader: 'rgb(35, 33, 31)',
    });

    const headerBackground = await page.getByTestId('pao-diario-header').evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(headerBackground).toContain('linear-gradient');
  });

  test('permite rolar o leitor do cabeçalho até o rodapé', async ({ page }) => {
    await page.goto('/devocional');
    await expect(page.getByTestId('devotional-study-reader')).toBeVisible({ timeout: 30_000 });

    const scrollState = await page.getByTestId('cultoplus-page-shell').evaluate((shell) => {
      let scroller: HTMLElement | null = shell.parentElement;
      while (scroller && !['auto', 'scroll'].includes(getComputedStyle(scroller).overflowY)) {
        scroller = scroller.parentElement;
      }
      if (!scroller) return { found: false, canScroll: false };
      const canScroll = scroller.scrollHeight > scroller.clientHeight + 20;
      scroller.scrollTop = scroller.scrollHeight;
      return { found: true, canScroll };
    });

    expect(scrollState).toEqual({ found: true, canScroll: true });
    await page.waitForTimeout(400);
    const scrollTop = await page.getByTestId('cultoplus-page-shell').evaluate((shell) => {
      let scroller: HTMLElement | null = shell.parentElement;
      while (scroller && !['auto', 'scroll'].includes(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
      return scroller?.scrollTop ?? 0;
    });
    expect(scrollTop).toBeGreaterThan(0);
    await expect(page.getByText(/A reflexão auxilia a leitura/)).toBeVisible();
  });
});
