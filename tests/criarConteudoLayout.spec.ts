import { expect, test } from '@playwright/test';

test('empty top-level paragraphs do not break two half-width blocks into separate rows', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Novo Estudo B.blico/i })).toBeVisible({ timeout: 20000 });

  const layout = await page.evaluate(async () => {
    const sandbox = document.createElement('div');
    sandbox.className = 'ProseMirror';
    sandbox.style.width = '1000px';
    sandbox.style.position = 'fixed';
    sandbox.style.left = '0';
    sandbox.style.top = '0';
    sandbox.style.visibility = 'hidden';
    sandbox.innerHTML = `
      <div data-type="custom-block" layoutwidth="1/2" style="height: 120px; background: rgb(240, 230, 210);"></div>
      <p><br class="ProseMirror-trailingBreak"></p>
      <div data-type="custom-block" layoutwidth="1/2" style="height: 120px; background: rgb(230, 220, 200);"></div>
    `;
    document.body.appendChild(sandbox);

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const blocks = Array.from(sandbox.children).filter(
      (child) => child instanceof HTMLElement && child.getAttribute('data-type') === 'custom-block',
    ) as HTMLElement[];
    if (blocks.length !== 2) {
      throw new Error(`Expected 2 custom blocks, found ${blocks.length}`);
    }

    const firstBox = blocks[0].getBoundingClientRect();
    const secondBox = blocks[1].getBoundingClientRect();

    const result = {
      firstTop: firstBox.top,
      secondTop: secondBox.top,
    };
    sandbox.remove();
    return result;
  });

  expect(Math.abs(layout.firstTop - layout.secondTop)).toBeLessThan(8);
});

test('shows related verses as a slider when the editor canvas is in mobile mode', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Novo Estudo B.blico/i })).toBeVisible({ timeout: 20000 });
  await page.getByTitle('Mobile (375px)').click();

  const relatedSection = page
    .locator('section')
    .filter({ has: page.getByText(/Versiculos Relacionados|Versículos Relacionados/i) })
    .first();

  await expect(relatedSection).toBeVisible();
  await expect(relatedSection.getByRole('button', { name: /proximo versiculo|próximo versículo/i })).toBeVisible();
  await expect(relatedSection.locator('[data-testid="related-verses-mobile-slider"]')).toBeVisible();
  await expect(relatedSection.locator('[data-testid="related-verses-desktop-grid"]')).toBeHidden();
});

test('does not render blocks hidden for the current editor canvas', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Novo Estudo B.blico/i })).toBeVisible({ timeout: 20000 });
  await page.getByTitle('Mobile (375px)').click();

  await expect(page.getByText(/Oculto nesta visualiza/i)).toHaveCount(0);
});

test('keeps the criar-conteudo editor fitted in mobile canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Novo Estudo B.blico/i })).toBeVisible({ timeout: 20000 });

  const metrics = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const canvas = document.querySelector('.canvas-mobile') as HTMLElement | null;
    const slide = document.querySelector('[data-testid="slide-block-canvas"]') as HTMLElement | null;
    const biblicalToolbar = document.querySelector('[data-testid="biblical-style-toolbar"]') as HTMLElement | null;
    const sortableBlocks = Array.from(document.querySelectorAll('[data-testid="sortable-block"]')) as HTMLElement[];
    const canvasRect = canvas?.getBoundingClientRect();
    const slideRect = slide?.getBoundingClientRect();
    const toolbarRect = biblicalToolbar?.getBoundingClientRect();

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      canvasWidth: canvasRect?.width ?? 0,
      slideWidth: slideRect?.width ?? 0,
      slideHeight: slideRect?.height ?? 0,
      biblicalToolbarWidth: toolbarRect?.width ?? 0,
      biblicalToolbarTextLength: biblicalToolbar?.textContent?.trim().length ?? 0,
      narrowSortableBlocks: sortableBlocks.filter((block) => {
        const rect = block.getBoundingClientRect();
        return rect.width > 0 && canvasRect && rect.width < canvasRect.width * 0.86;
      }).length,
    };
  });

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.canvasWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.slideWidth).toBeLessThanOrEqual(metrics.canvasWidth);
  expect(metrics.slideHeight).toBeLessThanOrEqual(430);
  expect(metrics.biblicalToolbarWidth).toBeLessThanOrEqual(metrics.canvasWidth);
  expect(metrics.biblicalToolbarTextLength).toBe(0);
  expect(metrics.narrowSortableBlocks).toBe(0);
});
