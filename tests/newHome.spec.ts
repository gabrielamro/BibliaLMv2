import { expect, test } from "@playwright/test";

test.describe("New Home isolada", () => {
  test("abre a rota sem substituir a Home atual e alterna abas", async ({ page }) => {
    await page.goto("/newhome");
    await expect(page).toHaveURL(/\/newhome/);
    await expect(page.getByRole("tab", { name: "Início" })).toBeVisible();
    const welcome = page.getByTestId("home-welcome");
    await expect(welcome).toBeVisible();
    await expect(welcome).toContainText(/Bem-vindo,/);
    const search = page.getByPlaceholder("Buscar na Bíblia, estudos, pessoas...");
    const [searchBox, welcomeBox] = await Promise.all([search.boundingBox(), welcome.boundingBox()]);
    expect(searchBox).not.toBeNull();
    expect(welcomeBox).not.toBeNull();
    expect(searchBox!.width).toBeLessThan(760);
    expect(welcomeBox!.x).toBeGreaterThanOrEqual(searchBox!.x + searchBox!.width);
    await expect(page.getByRole("heading", { name: /Bom dia/i })).toHaveCount(0);
    await expect(page.getByText("Meta de Leitura", { exact: true })).toBeVisible();
    const primaryDevotional = page.getByTestId("home-primary-devotional");
    await expect(primaryDevotional).toHaveAttribute("href", "/devocional");
    await expect(primaryDevotional.getByRole("heading", { name: "Pão Diário" })).toBeVisible();
    await expect(primaryDevotional.getByText("Reflexão de hoje", { exact: true })).toHaveCount(0);
    await expect(primaryDevotional.getByTestId("home-devotional-verse-panel")).toBeVisible();
    await expect(primaryDevotional.getByTestId("home-devotional-reflection")).toContainText(/\.\.\.$/);
    await expect(primaryDevotional.getByText("5 min de leitura", { exact: true })).toBeVisible();
    const journeyShortcuts = page.getByTestId("journey-shortcuts");
    await expect(journeyShortcuts.getByRole("link")).toHaveCount(3);
    await expect(journeyShortcuts.getByText("Meus Estudos", { exact: true })).toHaveCount(0);
    await expect(journeyShortcuts.getByText("Pão Diário", { exact: true })).toHaveCount(0);
    await expect(journeyShortcuts.getByRole("link", { name: /Continuar leitura/ })).toHaveAttribute("href", "/bibliasagrada");
    const shortcutBoxes = await journeyShortcuts.getByRole("link").evaluateAll((links) =>
      links.map((link) => ({ width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height })),
    );
    expect(Math.max(...shortcutBoxes.map((box) => box.width)) - Math.min(...shortcutBoxes.map((box) => box.width))).toBeLessThan(2);
    expect(Math.max(...shortcutBoxes.map((box) => box.height)) - Math.min(...shortcutBoxes.map((box) => box.height))).toBeLessThan(2);
    const [journeyShortcutsBox, journeyMainColumnBox] = await Promise.all([
      journeyShortcuts.boundingBox(),
      page.getByTestId("home-overview-main-column").boundingBox(),
    ]);
    expect(journeyShortcutsBox).not.toBeNull();
    expect(journeyMainColumnBox).not.toBeNull();
    expect(Math.abs((journeyShortcutsBox!.y + journeyShortcutsBox!.height) - (journeyMainColumnBox!.y + journeyMainColumnBox!.height))).toBeLessThan(2);
    const journeyHeaders = journeyShortcuts.getByTestId("journey-card-header");
    await expect(journeyHeaders).toHaveCount(3);
    const journeyHeaderGeometry = await journeyHeaders.evaluateAll((headers) =>
      headers.map((header) => {
        const icon = header.querySelector('[data-testid="journey-card-icon"]')!.getBoundingClientRect();
        const title = header.querySelector("h3")!.getBoundingClientRect();
        const textGroup = header.lastElementChild!.getBoundingClientRect();
        return {
          titleAfterIcon: title.x >= icon.x + icon.width,
          centerDifference: Math.abs((textGroup.y + textGroup.height / 2) - (icon.y + icon.height / 2)),
        };
      }),
    );
    expect(journeyHeaderGeometry.every((item) => item.titleAfterIcon && item.centerDifference < 8)).toBe(true);
    const weekCard = page.getByTestId("home-week-card");
    await expect(weekCard).toBeVisible();
    await expect(weekCard.getByRole("heading", { name: "Minha semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Minha semana" })).toHaveCount(1);
    await expect(weekCard.getByText("Sua agenda", { exact: true })).toHaveCount(0);
    await expect(weekCard.getByText("Cultos e escalas em um único resumo.", { exact: true })).toHaveCount(0);
    await expect(weekCard.getByText(/Designação/i)).toHaveCount(0);
    const [devotionalTitleSize, weekTitleSize] = await Promise.all([
      primaryDevotional.getByRole("heading", { name: "Pão Diário" }).evaluate((heading) => window.getComputedStyle(heading).fontSize),
      weekCard.getByRole("heading", { name: "Minha semana" }).evaluate((heading) => window.getComputedStyle(heading).fontSize),
    ]);
    expect(devotionalTitleSize).toBe(weekTitleSize);
    await expect(weekCard.getByRole("link", { name: "Ver minha semana" })).toHaveAttribute("href", "/newhome?tab=calendario");
    await expect(weekCard.getByRole("link", { name: "Próximos cultos" })).toHaveCount(0);
    await expect(weekCard.getByRole("link", { name: "Minha escala" })).toHaveCount(0);
    await expect(weekCard.getByRole("list", { name: "Compromissos da semana" })).toHaveCount(0);
    const weekPrograms = weekCard.getByRole("listitem");
    expect(await weekPrograms.count()).toBeLessThanOrEqual(3);
    const weekProgramDestinations = await weekPrograms.evaluateAll((items) =>
      items.map((item) => item.getAttribute("href")),
    );
    expect(weekProgramDestinations.every((href) => href?.startsWith("/culto/"))).toBe(true);
    const confirmedService = weekCard.getByTestId("home-week-confirmed-service");
    if (await confirmedService.count()) {
      await expect(confirmedService.first()).toContainText("Você está escalado");
      await expect(confirmedService.first()).toHaveClass(/border-indigo-200/);
      await expect(weekCard.getByTestId("home-week-volunteer-invite")).toHaveCount(0);
    } else {
      const volunteerInvite = weekCard.getByTestId("home-week-volunteer-invite");
      await expect(volunteerInvite).toContainText(/Candidate-se como voluntário|se candidatar como voluntário/i);
      const firstProgram = weekPrograms.first();
      if (await firstProgram.count()) {
        const [programBox, volunteerBox] = await Promise.all([firstProgram.boundingBox(), volunteerInvite.boundingBox()]);
        expect(programBox).not.toBeNull();
        expect(volunteerBox).not.toBeNull();
        expect(Math.abs(programBox!.height - volunteerBox!.height)).toBeLessThan(2);
      }
    }
    const nextService = weekCard.getByTestId("home-week-next-service");
    if (await nextService.count()) {
      await expect(nextService).toContainText("Próximo culto");
      await expect(nextService).toHaveClass(/newhome-soft/);
    }
    const [primaryDevotionalBox, weekCardBox] = await Promise.all([
      primaryDevotional.boundingBox(),
      weekCard.boundingBox(),
    ]);
    expect(primaryDevotionalBox).not.toBeNull();
    expect(weekCardBox).not.toBeNull();
    expect(Math.abs(primaryDevotionalBox!.height - weekCardBox!.height)).toBeLessThan(2);
    const [devotionalHeaderBox, weekHeaderBox, devotionalCtaBox, weekCtaBox] = await Promise.all([
      primaryDevotional.getByTestId("home-devotional-header").boundingBox(),
      weekCard.getByTestId("home-week-header").boundingBox(),
      primaryDevotional.getByTestId("home-devotional-cta").boundingBox(),
      weekCard.getByTestId("home-week-cta").boundingBox(),
    ]);
    expect(devotionalHeaderBox).not.toBeNull();
    expect(weekHeaderBox).not.toBeNull();
    expect(devotionalCtaBox).not.toBeNull();
    expect(weekCtaBox).not.toBeNull();
    expect(Math.abs(devotionalHeaderBox!.y - weekHeaderBox!.y)).toBeLessThan(2);
    expect(Math.abs((devotionalCtaBox!.y + devotionalCtaBox!.height) - (weekCtaBox!.y + weekCtaBox!.height))).toBeLessThan(2);
    await expect(page.getByText("Ver agenda", { exact: true })).toHaveCount(0);
    const assignmentTeam = page.getByTestId("home-assignment-team");
    if (await assignmentTeam.count()) {
      await expect(assignmentTeam).toContainText("Equipe:");
      await expect(page.getByText("O que você vai fazer", { exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { name: "No Reino" })).toBeVisible();
    const [mainColumnBox, rightRailBox] = await Promise.all([
      page.getByTestId("home-overview-main-column").boundingBox(),
      page.getByTestId("home-right-rail").boundingBox(),
    ]);
    expect(mainColumnBox).not.toBeNull();
    expect(rightRailBox).not.toBeNull();
    expect(Math.abs((mainColumnBox!.y + mainColumnBox!.height) - (rightRailBox!.y + rightRailBox!.height))).toBeLessThan(2);
    await expect(page.getByTestId("home-kingdom-card")).toHaveClass(/xl:flex-1/);
    await expect(page.getByTestId("home-kingdom-post")).toHaveCount(2);
    await expect(page.getByTestId("home-kingdom-card").getByText("Sala de oração", { exact: true })).toBeVisible();
    const studyShelf = page.getByTestId("study-shelf");
    await expect(studyShelf).toHaveClass(/newhome-card/);
    await expect(studyShelf).toHaveClass(/border/);
    const studyShelfCards = page.getByTestId("study-shelf-card");
    const newStudyCta = page.getByTestId("new-study-cta");
    await expect(newStudyCta).toHaveClass(/border-cyan-700/);
    await expect(newStudyCta).not.toHaveClass(/border-dashed/);
    if (await studyShelfCards.count()) {
      const studyCardWidths = await studyShelfCards.evaluateAll((cards) =>
        cards.map((card) => card.getBoundingClientRect().width),
      );
      expect(Math.max(...studyCardWidths)).toBeLessThanOrEqual(240);
    }

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
