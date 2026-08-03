import { expect, test } from "@playwright/test";

test.describe("Bíblia Sagrada - biblioteca", () => {
  test("prioriza os livros e preserva a abertura do leitor existente", async ({ page }) => {
    await page.goto("/bibliasagrada");

    await expect(page).toHaveTitle("Bíblia Sagrada | Culto+");
    const desktopMenu = page.getByTestId("cultoplus-desktop-menu");
    await expect(page.getByTestId("cultoplus-page-shell")).toBeVisible();
    await expect(desktopMenu).toBeVisible();
    await expect(desktopMenu.locator('[aria-label="Culto+"]')).toBeVisible();
    await expect(desktopMenu.getByRole("button", { name: "Recolher submenu Bíblia" })).toHaveAttribute("aria-expanded", "true");
    await expect(desktopMenu.getByRole("link", { name: "Pão Diário" })).toBeVisible();
    await expect(desktopMenu.getByRole("link", { name: "Meta de leitura" })).toBeVisible();
    await expect(desktopMenu.getByRole("link", { name: "Orações" })).toBeVisible();
    await expect(desktopMenu.getByRole("link", { name: "Quiz Bíblico" })).toBeVisible();
    await expect(page.getByTestId("bible-library")).toBeVisible();
    await expect(page.getByTestId("bible-daily-journey")).toHaveCount(0);
    await expect(page.getByTestId("bible-books-grid")).toBeVisible();
    await expect(page.getByTestId("bible-reading-summary")).toBeVisible();
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    const versionSelector = page.getByRole("button", { name: "Selecionar versão da Bíblia" });
    await expect(versionSelector).toBeVisible();
    await versionSelector.click();
    await expect(page.getByText("Nova Versão Int.", { exact: true })).toBeVisible();
    await versionSelector.click();

    const collectionFilters = page.getByRole("tablist", { name: "Testamentos e cânon bíblico" });
    await expect(collectionFilters.getByRole("tab")).toHaveCount(3);

    await collectionFilters.getByRole("tab", { name: "Antigo Testamento" }).click();
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    await expect(page.getByTestId("bible-book-mt")).toHaveCount(0);
    await expect(page.getByTestId("bible-book-tb")).toHaveCount(0);

    await collectionFilters.getByRole("tab", { name: "Novo Testamento" }).click();
    await expect(page.getByTestId("bible-book-mt")).toBeVisible();
    await expect(page.getByTestId("bible-book-gn")).toHaveCount(0);

    await collectionFilters.getByRole("tab", { name: "Bíblia Católica" }).click();
    await expect(page.getByTestId("bible-book-tb")).toBeVisible();
    await expect(page.getByTestId("bible-book-gn")).toHaveCount(0);

    await page.getByRole("button", { name: "Todos os livros" }).click();
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    await expect(page.getByTestId("bible-book-mt")).toBeVisible();

    const categoryFilter = page.getByLabel("Categoria dos livros");
    await expect(categoryFilter).toBeVisible();
    const collectionFilterBox = await collectionFilters.boundingBox();
    const categoryFilterBox = await categoryFilter.boundingBox();
    expect(collectionFilterBox).not.toBeNull();
    expect(categoryFilterBox).not.toBeNull();
    expect(categoryFilterBox!.x).toBeGreaterThan(collectionFilterBox!.x);
    // Os controles têm alturas diferentes, mas permanecem na mesma linha e alinhados pela base.
    expect(Math.abs(categoryFilterBox!.y - collectionFilterBox!.y)).toBeLessThan(16);
    await categoryFilter.selectOption("pentateuch");
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    await expect(page.getByTestId("bible-book-js")).toHaveCount(0);
    await categoryFilter.selectOption("all");

    await page.getByTestId("bible-book-gn").click();

    await expect(page.getByTestId("bible-library")).toHaveCount(0);
    await expect(desktopMenu).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    await expect(page.getByText("CAP. 1", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/bibliasagrada\?gn&cap=1$/);

    await page.getByRole("button", { name: "Ouvir" }).click();
    const audioPlayer = page.getByTestId("bible-audio-player");
    await expect(audioPlayer).toBeVisible();
    await expect(audioPlayer.getByRole("button", { name: "Continuar leitura" })).toBeVisible();
    await expect(audioPlayer.getByRole("button", { name: "Próximo versículo" })).toBeVisible();
    await expect(audioPlayer.getByRole("button", { name: "Velocidade 1 vezes" })).toBeVisible();
    await expect(audioPlayer.getByRole("progressbar", { name: "Andamento da leitura" })).toBeVisible();
    await expect(audioPlayer.locator('input[type="range"]')).toHaveCount(0);
    await audioPlayer.getByRole("button", { name: "Fechar reprodutor" }).click();

    const firstVerse = page.locator('[id^="verse-"]').first();
    await expect(firstVerse).toBeVisible();
    await firstVerse.click();
    await expect(page).toHaveURL(/\/bibliasagrada\?gn&cap=1&vs=1$/);

    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/bibliasagrada$/);
    await expect(page.getByTestId("bible-library")).toBeVisible();

    await page.getByTestId("bible-book-mt").click();
    await expect(page).toHaveURL(/\/bibliasagrada\?mt&cap=1$/);
    await expect(page.getByText("CAP. 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Mateus 1");
    await expect(page.getByText("No princípio criou Deus o céu e a terra.")).toHaveCount(0);
  });

  test("mantém os livros como prioridade no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/bibliasagrada");

    const mobileHeader = page.getByTestId("cultoplus-mobile-menu-header");
    const mobileBottomNav = page.getByTestId("cultoplus-mobile-bottom-nav");
    await expect(mobileHeader).toBeVisible();
    expect(await mobileHeader.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
    await expect(mobileHeader.getByLabel("Culto+")).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Início" })).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Bíblia" })).toHaveClass(/module-accent-text/);
    await expect(mobileBottomNav.getByRole("button", { name: "Cultos" })).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Perfil" })).toBeVisible();
    await mobileHeader.getByRole("button", { name: "Abrir menu" }).click();
    await expect(mobileHeader.getByRole("tab", { name: "Bíblia", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "Meta de leitura" })).toBeVisible();
    await expect(page.getByTestId("bible-daily-journey")).toHaveCount(0);
    await expect(page.getByTestId("bible-books-grid")).toBeVisible();
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    const mobileCollectionFilters = page.getByRole("tablist", { name: "Testamentos e cânon bíblico" });
    await expect(mobileCollectionFilters).toBeVisible();
    await expect(mobileCollectionFilters.getByRole("tab", { name: "Bíblia Católica" })).toBeVisible();
    await expect(page.getByLabel("Categoria dos livros")).toBeVisible();
  });

  test("mantém o alias /biblia na mesma identidade Culto+", async ({ page }) => {
    await page.goto("/biblia");

    await expect(page).toHaveTitle("Bíblia Sagrada | Culto+");
    await expect(page.getByTestId("cultoplus-page-shell")).toBeVisible();
    await expect(page.getByTestId("bible-library")).toBeVisible();
  });
});
