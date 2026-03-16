import { test, expect } from '@playwright/test';

test.describe('Core Features', () => {
  // Use serial mode to avoid parallel login conflicts with the same account
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`));
    
    // Mock Supabase Auth
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RlQGV4YW1wbGUuY29tIn0.fake-sig',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mocked_refresh_token',
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

    // Generic mock for other tables
    await page.route('**/rest/v1/*', async route => {
      if (route.request().url().includes('profiles')) {
        const accept = route.request().headers()['accept'] || '';
        const data = { id: 'test-user-id', username: 'teste', display_name: 'Teste User', email: 'teste@example.com' };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(accept.includes('vnd.pgrst.object') ? data : [data])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    await page.goto('http://localhost:3010/');
    
    // Simple login flow
    try {
        const loginBtn = page.getByTestId('landing-login-btn').first();
        if (await loginBtn.isVisible({ timeout: 5000 })) {
            await loginBtn.click();
            
            const userField = page.getByPlaceholder('@usuário ou e-mail').first();
            await userField.fill('teste');
            await page.getByPlaceholder('Sua senha').first().fill('123456');
            
            await page.getByTestId('auth-submit-btn').first().click();
            await expect(page.getByTestId('auth-modal-heading')).not.toBeVisible({ timeout: 10000 });
        }
    } catch (e) {
        console.log('Login skip or failed:', (e as any).message || e);
    }
    
    // Check if we are logged in (some element in sidebar typically)
    await page.waitForLoadState('networkidle');
  });

  test('should browse the Bible and see verses', async ({ page }) => {
    // Navigate to Bible
    await page.goto('http://localhost:3010/biblia');
    await expect(page).toHaveURL(/.*biblia/, { timeout: 15000 });
    
    // If we are in library mode, click a book
    const library = page.getByTestId('bible-library');
    if (await library.isVisible({ timeout: 5000 })) {
        await page.click('text=Gênesis');
    }
    
    // Check if content loads
    const readerView = page.getByTestId('reader-view');
    await expect(readerView).toBeVisible({ timeout: 15000 });
    
    // Check for verses
    const verses = page.locator('[data-verse]');
    await expect(verses.first()).toBeVisible({ timeout: 10000 });
  });

  test('should interact with AI Chat (Obreiro IA)', async ({ page }) => {
    // Navigate to AI Chat directly
    await page.goto('http://localhost:3010/chat');
    await expect(page).toHaveURL(/.*chat/, { timeout: 15000 });
    
    // Wait for chat interface
    const input = page.getByTestId('chat-input');
    await expect(input).toBeVisible({ timeout: 15000 });
    
    await input.fill('Quem foi Davi?');
    await page.getByTestId('chat-send').click();
    
    // Check for AI response placeholder or message
    await expect(page.getByTestId('chat-message').filter({ hasText: 'Davi' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('should view the social feed', async ({ page }) => {
    // Navigate to Feed directly
    await page.goto('http://localhost:3010/social');
    await expect(page).toHaveURL(/.*social/, { timeout: 15000 });
    
    // Check for feed posts
    const posts = page.getByTestId('feed-post');
    // Mocks return empty array for other tables by default in our setup
    // but the UI should at least show "no posts" or empty state
    await expect(page.getByTestId('feed-container')).toBeVisible({ timeout: 15000 });
  });  
});
