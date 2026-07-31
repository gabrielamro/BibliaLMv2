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
    await expect(page.getByTestId("bible-daily-journey")).toBeVisible();
    await expect(page.getByTestId("bible-books-grid")).toBeVisible();
    await expect(page.getByTestId("bible-reading-summary")).toBeVisible();
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    const versionSelector = page.getByRole("button", { name: "Selecionar versão da Bíblia" });
    await expect(versionSelector).toBeVisible();
    await versionSelector.click();
    await expect(page.getByText("Nova Versão Int.", { exact: true })).toBeVisible();
    await versionSelector.click();

    const collectionFilters = page.getByRole("tablist", { name: "Testamentos e cânon bíblico" });
    await expect(collectionFilters.getByRole("tab", { name: "Toda a Bíblia" })).toHaveAttribute("aria-selected", "true");

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

    await collectionFilters.getByRole("tab", { name: "Toda a Bíblia" }).click();

    const categoryFilter = page.getByLabel("Categoria dos livros");
    await expect(categoryFilter).toBeVisible();
    const collectionFilterBox = await collectionFilters.boundingBox();
    const categoryFilterBox = await categoryFilter.boundingBox();
    expect(collectionFilterBox).not.toBeNull();
    expect(categoryFilterBox).not.toBeNull();
    expect(categoryFilterBox!.x).toBeGreaterThan(collectionFilterBox!.x);
    expect(Math.abs(categoryFilterBox!.y - collectionFilterBox!.y)).toBeLessThan(8);
    await categoryFilter.selectOption("pentateuch");
    await expect(page.getByTestId("bible-book-gn")).toBeVisible();
    await expect(page.getByTestId("bible-book-js")).toHaveCount(0);
    await categoryFilter.selectOption("all");

    await page.getByTestId("bible-book-gn").click();

    await expect(page.getByTestId("bible-library")).toHaveCount(0);
    await expect(desktopMenu).toBeVisible();
    await expect(page.getByRole("button", { name: "Voltar" })).toBeVisible();
    await expect(page.getByText("CAP. 1", { exact: true })).toBeVisible();
  });

  test("mantém os livros como prioridade no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/bibliasagrada");

    const mobileHeader = page.getByTestId("cultoplus-mobile-menu-header");
    const mobileBottomNav = page.getByTestId("cultoplus-mobile-bottom-nav");
    await expect(mobileHeader).toBeVisible();
    expect(await mobileHeader.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
    await expect(mobileHeader.getByRole("img", { name: "Culto+" })).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Início" })).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Bíblia" })).toHaveClass(/module-accent-text/);
    await expect(mobileBottomNav.getByRole("button", { name: "Cultos" })).toBeVisible();
    await expect(mobileBottomNav.getByRole("button", { name: "Perfil" })).toBeVisible();
    await mobileHeader.getByRole("button", { name: "Abrir menu" }).click();
    await expect(mobileHeader.getByRole("tab", { name: "Bíblia", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "Meta de leitura" })).toBeVisible();
    await expect(page.getByTestId("bible-daily-journey")).toBeVisible();
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
