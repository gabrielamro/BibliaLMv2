import { expect, test } from '@playwright/test';

test.describe('Trilhas de Estudo', () => {
  test('salva o progresso e retoma a trilha de onde o usuário parou', async ({ page }) => {
    await page.goto('/trilhas');

    await expect(page.getByRole('heading', { name: 'Séries de Estudo da Palavra' })).toBeVisible();
    const cards = page.getByTestId('track-card');
    await expect(cards).toHaveCount(3);
    await expect(page.getByTestId('track-dialog')).toHaveCount(0);

    const firstCard = cards.first();
    await firstCard.click();

    const dialog = page.getByTestId('track-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Vencendo a Ansiedade' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Entregando o Fardo em Oração' })).toBeVisible();
    await expect(page.getByTestId('track-previous-step')).toBeDisabled();
    await expect(page.getByTestId('track-dialog-progress')).toHaveText('0% concluído');

    await dialog.getByRole('button', { name: 'Marcar como concluído' }).click();
    await expect(page.getByTestId('track-dialog-progress')).toHaveText('33% concluído');

    await page.getByTestId('track-next-step').click();
    await expect(dialog.getByRole('heading', { name: 'Fortalecidos no Medo' })).toBeVisible();
    await expect(page.getByTestId('track-previous-step')).toBeEnabled();

    await page.getByTestId('track-continue-later').click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('track-progress-vencendo-ansiedade')).toContainText('33%');
    await expect(firstCard).toContainText('Continuar');

    await firstCard.click();
    await expect(dialog.getByRole('heading', { name: 'Fortalecidos no Medo' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(firstCard).toBeFocused();

    await cards.nth(1).click();
    await expect(page.getByTestId('track-dialog').getByRole('heading', { name: 'A Aliança no Lar' })).toBeVisible();
  });

  test('Registrar no Diário abre uma anotação contextual sem sair da trilha', async ({ page }) => {
    await page.goto('/trilhas');
    await page.getByTestId('track-card').first().click();

    await page.getByTestId('track-open-journal').click();
    await expect(page).toHaveURL(/\/trilhas$/);
    await expect(page.getByTestId('track-journal-composer')).toBeVisible();

    await page.getByTestId('track-journal-note').fill('Hoje decidi entregar minha ansiedade em oração.');
    await page.getByTestId('track-save-journal').click();
    await expect(page.getByTestId('track-save-journal')).toContainText('Anotação salva');
    await expect(page.getByRole('button', { name: 'Entrar e sincronizar' })).toBeVisible();
  });

  test('mantém cards e modal utilizáveis no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/trilhas');

    const cards = page.getByTestId('track-card');
    await expect(cards.first()).toBeVisible();
    await cards.first().click();

    await expect(page.getByTestId('track-dialog')).toBeVisible();
    await expect(page.getByTestId('track-close')).toBeFocused();
    await expect(page.getByTestId('track-continue-later')).toBeVisible();
    await expect(page.getByTestId('track-next-step')).toBeVisible();
    await page.getByTestId('track-close').click();
    await expect(page.getByTestId('track-dialog')).toHaveCount(0);
  });
});
