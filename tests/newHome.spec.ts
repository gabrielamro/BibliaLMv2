import { expect, test } from "@playwright/test";

test.describe("New Home isolada", () => {
  test("abre a rota sem substituir a Home atual e alterna abas", async ({ page }) => {
    await page.goto("/newhome");
    await expect(page).toHaveURL(/\/newhome/);
    await expect(page.getByRole("tab", { name: "Início" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bom dia/i })).toBeVisible();
    await expect(page.getByText("Meta de Leitura", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Minha semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No Reino" })).toBeVisible();

    const navigation = page.getByRole("navigation", { name: /Navega/ });
    await navigation.getByRole("button", { name: /submenu B/ }).click();
    await expect(navigation.locator('a[href="/devocional"]')).toBeVisible();
    await expect(navigation.locator('a[href="/minha-conta"]')).toBeVisible();
    await expect(navigation.getByRole("button", { name: /submenu Config/ })).toBeVisible();
    await expect(navigation.locator('a[href="/workspace-pastoral"]')).toHaveCount(0);

    await page.getByRole("tab", { name: "Criar" }).click();
    await expect(page).toHaveURL(/\/newhome\?tab=criar/);
    await expect(page.getByRole("heading", { name: "Seu estúdio criativo" })).toBeVisible();

    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("oferece submenus coloridos e acessiveis no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/newhome");

    await page.getByRole("button", { name: /Submenus dos m/ }).click();
    const moduleMenu = page.locator("#mobile-module-submenus");
    await expect(moduleMenu).toBeVisible();
    await moduleMenu.getByRole("tab").nth(1).click();
    await expect(moduleMenu.locator('a[href="/notes"]')).toBeVisible();
  });
});
