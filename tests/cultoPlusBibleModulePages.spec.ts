import { expect, test } from '@playwright/test';

const publicBibleModules = [
  {
    path: '/oracoes',
    title: 'Orações | Culto+',
    menuItem: 'Orações',
  },
  {
    path: '/quiz',
    title: 'Quiz Bíblico - Desafio da Sabedoria | Culto+',
    menuItem: 'Quiz Bíblico',
  },
] as const;

test.describe('Módulos bíblicos na identidade Culto+', () => {
  test('Pão Diário usa a experiência editorial bíblica dentro do shell Culto+', async ({ page }) => {
    await page.goto('/devocional');

    await expect(page).toHaveTitle('Pão Diário | Culto+');
    await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
    const desktopMenu = page.getByTestId('cultoplus-desktop-menu');
    await expect(desktopMenu.getByRole('button', { name: 'Recolher submenu Bíblia' })).toHaveAttribute('aria-expanded', 'true');
    await expect(desktopMenu.getByRole('link', { name: 'Pão Diário' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('devotional-reading-article')).toBeVisible();
  });

  for (const module of publicBibleModules) {
    test(`${module.menuItem} usa o shell e o menu Culto+`, async ({ page }) => {
      await page.goto(module.path);

      await expect(page).toHaveTitle(module.title);
      await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();

      const desktopMenu = page.getByTestId('cultoplus-desktop-menu');
      await expect(desktopMenu).toBeVisible();
      await expect(desktopMenu.locator('[aria-label="Culto+"]')).toBeVisible();
      await expect(
        desktopMenu.getByRole('button', { name: 'Recolher submenu Bíblia' }),
      ).toHaveAttribute('aria-expanded', 'true');
      await expect(desktopMenu.getByRole('link', { name: module.menuItem })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  }

  test('Meta de leitura continua disponível no menu Culto+ e respeita a sessão atual', async ({ page }) => {
    await page.goto('/oracoes');

    const readingGoalLink = page
      .getByTestId('cultoplus-desktop-menu')
      .getByRole('link', { name: 'Meta de leitura' });
    await expect(readingGoalLink).toHaveAttribute('href', '/plano');

    await page.goto('/plano');
    await expect(page).toHaveURL(/\/(plano|intro)$/);
    if (page.url().endsWith('/plano')) {
      await expect(page.getByTestId('cultoplus-page-shell')).toBeVisible();
    }
  });

  test('mantém a navegação Culto+ no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/oracoes');

    const mobileHeader = page.getByTestId('cultoplus-mobile-menu-header');
    const mobileBottomNav = page.getByTestId('cultoplus-mobile-bottom-nav');

    await expect(mobileHeader).toBeVisible();
    expect(
      await mobileHeader.evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    ).toBe(0);
    await expect(mobileHeader.getByRole('img', { name: 'Culto+' })).toBeVisible();
    await expect(mobileBottomNav).toBeVisible();
    const bibleButton = mobileBottomNav.getByRole('button', { name: 'Bíblia' });
    await expect(bibleButton).toHaveAttribute('data-module-theme', 'bible');
    await expect(bibleButton).toHaveClass(/module-accent-text/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);

    await mobileHeader.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.getByRole('tab', { name: 'Bíblia' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('link', { name: 'Orações' })).toBeVisible();
  });
});
