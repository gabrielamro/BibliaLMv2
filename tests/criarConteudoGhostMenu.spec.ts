import { expect, test } from '@playwright/test';

test('slot vazio opens block choices and spacer asks for size', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const firstBlock = page.locator('[data-type="custom-block"]').first();
  await expect(firstBlock).toBeVisible({ timeout: 20000 });
  await firstBlock.click();

  const halfWidthButton = page.getByRole('button', { name: '1/2' }).first();
  await halfWidthButton.click();

  const emptySlot = page.getByText('Slot Vazio').first();
  await expect(emptySlot).toBeVisible();
  await emptySlot.click();

  const ghostPicker = page.getByTestId('ghost-picker-0');
  const spacerOption = page.getByRole('button', { name: /Espaçador \/ Layout/i }).last();
  await expect(spacerOption).toBeVisible();
  await expect(ghostPicker.getByText('Escolha um bloco')).toHaveCount(0);
  await expect(ghostPicker.getByText('Selecione o elemento para preencher este slot.')).toHaveCount(0);
  await expect(ghostPicker.getByText('Espaço vazio configurável')).toHaveCount(0);

  await spacerOption.click();

  await expect(page.getByText('Escolha o tamanho do espaçador')).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/3' })).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/2' })).toBeVisible();
  await expect(ghostPicker.getByRole('button', { name: '1/1' })).toBeVisible();
});

test('add section opens the same block picker at the end of the editor', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const addSectionButton = page.getByTestId('editor-add-section-button');
  await expect(addSectionButton).toBeVisible({ timeout: 20000 });
  await addSectionButton.click();

  const picker = page.getByTestId('editor-add-section-picker');
  await expect(picker).toBeVisible();
  await expect(picker.getByText('Escolha um bloco')).toBeVisible();
  await expect(picker.getByRole('button', { name: /Hero Editorial/i })).toBeVisible();
  await expect(picker.getByRole('button', { name: /Espaçador \/ Layout/i })).toBeVisible();
});

test('ghost slot shows an insertion line while dragging over it', async ({ page }) => {
  await page.goto('/criar-conteudo', { waitUntil: 'domcontentloaded' });

  const firstBlock = page.locator('[data-type="custom-block"]').first();
  await expect(firstBlock).toBeVisible({ timeout: 20000 });
  await firstBlock.click();
  await page.getByRole('button', { name: '1/2' }).first().click();

  const ghostSlot = page.getByTestId('node-ghost-slot-0');
  await expect(ghostSlot).toBeVisible();
  await ghostSlot.dispatchEvent('dragenter');

  await expect(page.getByTestId('ghost-insertion-line-0')).toBeVisible();
});
