import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testUser = {
    email: `teste_${Date.now()}@example.com`,
    password: '123456',
    name: 'Usuário Teste QA',
    username: `teste_${Date.now()}`,
    city: 'São Paulo',
    state: 'SP'
  };

  test.beforeEach(async ({ page }) => {
    // Mock IBGE API
    await page.route('**/api/v1/localidades/estados/*/municipios', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, nome: 'São Paulo' }, { id: 2, nome: 'Osasco' }])
      });
    });

    // Mock Supabase Auth
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mocked_token',
          token_type: 'bearer',
          user: { id: 'test-user-id', email: 'teste@example.com' }
        })
      });
    });

    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-user-id', email: 'teste@example.com' })
      });
    });

    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-user-id', username: 'teste', display_name: 'Teste User' })
      });
    });

    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user-id', email: 'teste@example.com' } })
      });
    });
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('http://localhost:3010/');
    
    // Open Login Modal
    const loginBtn = page.getByTestId('landing-login-btn').first();
    await loginBtn.click();

    // Switch to Register mode
    await page.getByRole('button', { name: /Não tem conta|Cadastre-se/i }).click();

    // Fill registration form
    const uniqueId = Date.now();
    await page.getByPlaceholder('Nome Completo').fill(`Teste QA ${uniqueId}`);
    await page.getByPlaceholder('Username').fill(`tester_${uniqueId}`);
    
    // Select state and city
    await page.getByTestId('uf-select').selectOption('SP');
    
    const citySelect = page.getByTestId('city-select');
    await expect(citySelect).toBeEnabled({ timeout: 10000 });
    
    // Wait for cities to load
    await expect(async () => {
        const options = await citySelect.locator('option').all();
        // Placeholder "Cidade" (or "Carregando...") + at least one city
        expect(options.length).toBeGreaterThan(1);
    }).toPass({ timeout: 20000 });
    
    await citySelect.selectOption('São Paulo');

    await page.getByPlaceholder('Seu melhor e-mail').fill(`teste_${uniqueId}@example.com`);
    await page.getByPlaceholder('Sua senha').fill('123456');

    // Submit - Use data-testid fixed in LoginModal
    const cadastrarBtn = page.getByTestId('auth-submit-btn');
    await page.waitForTimeout(1000); 
    await cadastrarBtn.click();



    // Verification: Wait for navigation or modal to close
    await expect(page).toHaveURL(/.*localhost:3010\//, { timeout: 15000 });
    // Ensure the modal is gone
    await expect(page.getByTestId('auth-modal-heading')).not.toBeVisible({ timeout: 15000 });
  });

  test('should login with the created user', async ({ page }) => {
    await page.goto('http://localhost:3010/');
    
    const loginBtn = page.getByTestId('landing-login-btn').first();
    await loginBtn.click();

    // Mode should be login by default, if not, switch
    const switchBtn = page.getByRole('button', { name: /Já tem conta|Faça Login/i });
    if (await switchBtn.isVisible()) {
        await switchBtn.click();
    }

    await page.getByPlaceholder(/@usuário ou e-mail/i).fill('teste'); 
    await page.getByPlaceholder('Sua senha').fill('123456');

    // Use aria-label fixed in LoginModal to avoid ambiguity with Header's Entrar button
    await page.getByLabel('Entrar', { exact: true }).click();


    // Verification
    await expect(page).toHaveURL(/.*localhost:3010\//, { timeout: 15000 });
  });
});
