import { expect, test } from "@playwright/test";

test.describe("Central de pessoas, equipes e escalas", () => {
  test("mantém a central protegida para visitantes", async ({ page }) => {
    await page.goto("/gestao-igreja/pessoas");
    await expect(page.getByRole("heading", { name: "Entre para acessar a gestao" })).toBeVisible();
  });

  test("mantém a rota antiga protegida durante a compatibilidade", async ({ page }) => {
    await page.goto("/gestao-igreja/equipes");
    await expect(page.getByRole("heading", { name: "Entre para acessar a gestao" })).toBeVisible();
  });
});
