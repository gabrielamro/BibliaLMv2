import { expect, test } from '@playwright/test';

test('renders the create content v2 editorial experience', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Criar Conteudo V2' })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('heading', { name: /Painel esquerdo/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Editor estilo/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Painel direito/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Template 1 coluna' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Template 2 colunas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Template 3 colunas' })).toBeVisible();
});

test('lets the user configure columns and preview content in v2', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByText('Hero Editorial').first().click();
  const heroSplitBlock = page.getByTestId('builder-block-hero-split-1');
  await heroSplitBlock.click();
  await heroSplitBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  const dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByLabel('Titulo').fill('Esperanca que Sustenta a Igreja');
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();
  await page.getByRole('button', { name: 'Template 1 coluna' }).click();

  await page.getByRole('button', { name: 'Preview' }).click();

  await expect(page.getByText('preview 1 coluna')).toBeVisible();
  await expect(page.getByText('Esperanca que Sustenta a Igreja')).toBeVisible();

  await page.getByRole('button', { name: 'Publicar simulacao' }).click();

  await expect(page.getByText('Publicado em simulacao').first()).toBeVisible({ timeout: 20000 });
});

test('packs two sequential half-width blocks into the same row in 2-column template', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 2 colunas' }).click();

  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  let dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByRole('button', { name: 'Largura 1/2' }).click();
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();

  const outlineBlock = page.getByTestId('builder-block-study-outline-4');
  await outlineBlock.click();
  await outlineBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Preview' }).click();

  const firstFlowRow = page.getByTestId('preview-row-0');

  await expect(firstFlowRow).toBeVisible();
  await expect(firstFlowRow.locator('[data-width=\"1/2\"]')).toHaveCount(2);
  await expect(firstFlowRow.getByText(/Roteiro do Estudo/i)).toBeVisible();
});

test('starts outline and related verses as 1/3 blocks in the 3-column template', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();

  const secondFlowRow = page.getByTestId('preview-row-1');

  await expect(secondFlowRow).toBeVisible();
  await expect(secondFlowRow.locator('[data-width=\"1/3\"]')).toHaveCount(2);
  await expect(secondFlowRow.getByText(/Roteiro do Estudo/i)).toBeVisible();
  await expect(secondFlowRow.getByText(/Versiculos Relacionados/i)).toBeVisible();
});

test('keeps 1/2 as half width in the 3-column template', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();
  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  const dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByRole('button', { name: 'Largura 1/2' }).click();
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();

  const firstFlowBlock = page.getByTestId(/preview-block-/).first();

  await expect(firstFlowBlock).toHaveAttribute('data-width', '1/2');
  await expect(firstFlowBlock).toHaveAttribute('data-units', '3');
});

test('applies fractional widths on the editing canvas', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();
  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  const dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByRole('button', { name: 'Largura 1/2' }).click();
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();

  const editingBlock = page.getByTestId('builder-block-study-content-3');

  await expect(editingBlock).toHaveAttribute('data-width', '1/2');
  await expect(editingBlock).toHaveAttribute('data-units', '3');
});

test('opens block properties in a popup and applies block alignment', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();
  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();

  const dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });

  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Largura 1/3' }).click();
  await dialog.getByRole('button', { name: 'Alinhamento centro' }).click();
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();

  const editingBlock = page.getByTestId('builder-block-study-content-3');

  await expect(editingBlock).toHaveAttribute('data-width', '1/3');
  await expect(editingBlock).toHaveAttribute('data-align', 'center');
});

test('cycles block width from the action bar without opening the popup', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();

  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Ajustar largura do bloco' }).click({ force: true });
  await expect(studyBlock).toHaveAttribute('data-width', '1/2');

  await studyBlock.getByRole('button', { name: 'Ajustar largura do bloco' }).click({ force: true });
  await expect(studyBlock).toHaveAttribute('data-width', '1/3');

  await studyBlock.getByRole('button', { name: 'Ajustar largura do bloco' }).click({ force: true });
  await expect(studyBlock).toHaveAttribute('data-width', '1/1');
});

test('uses a full-screen editor shell with a scrollable canvas workspace', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  const shell = page.getByTestId('create-content-v2-shell');
  const workspace = page.getByTestId('create-content-v2-workspace');
  const canvasWorkspace = page.getByTestId('create-content-v2-canvas-workspace');

  await expect(shell).toBeVisible();
  await expect(workspace).toBeVisible();
  await expect(canvasWorkspace).toBeVisible();
  await expect(shell).toHaveCSS('height', '720px');
  await expect(canvasWorkspace).toHaveCSS('overflow-y', 'auto');
});

test('keeps resize controls working inside the full-screen canvas', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: /mostrar ajustes de altura/i }).click({ force: true });

  const topResizer = studyBlock.getByTestId('section-resizer-top');
  await expect(topResizer).toBeVisible();

  const beforePadding = await studyBlock.getAttribute('data-padding-top');
  const handleBox = await topResizer.boundingBox();
  if (!handleBox) {
    throw new Error('Top resizer handle did not render');
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 48, { steps: 8 });
  await page.mouse.up();

  const afterPadding = await studyBlock.getAttribute('data-padding-top');

  expect(beforePadding).not.toBeNull();
  expect(afterPadding).not.toBeNull();
  expect(afterPadding).not.toBe(beforePadding);
});

test('study content fills the grid width assigned by the layout', async ({ page }) => {
  await page.goto('/criar-conteudo-v2', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: 'Template 3 colunas' }).click();
  const studyBlock = page.getByTestId('builder-block-study-content-3');
  await studyBlock.click();
  await studyBlock.getByRole('button', { name: 'Editar propriedades do bloco' }).click();
  const dialog = page.getByRole('dialog', { name: 'Propriedades do bloco' });
  await dialog.getByRole('button', { name: 'Largura 1/1' }).click();
  await dialog.getByRole('button', { name: 'Fechar propriedades' }).click();
  await page.getByRole('button', { name: 'Preview' }).click();

  const previewBlock = page
    .locator('[data-testid^="preview-block-"]')
    .filter({ has: page.getByText(/Relat.rio Teol.gico Alpha/i) })
    .first();
  const previewContainer = previewBlock.locator('.transition-all.duration-300.w-full .mx-auto').first();
  await expect(previewBlock).toHaveAttribute('data-width', '1/1');
  await expect(previewContainer).toHaveClass(/max-w-full/);
  await expect(previewContainer).not.toHaveClass(/max-w-4xl/);
});
