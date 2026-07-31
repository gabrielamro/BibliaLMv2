import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolve } from "node:path";
import nextConfig from "../next.config.ts";

test("legacy management lists redirect to the matching contextual panel", async () => {
  assert.equal(typeof nextConfig.redirects, "function");
  const redirects = await nextConfig.redirects!();
  const expected = new Map([
    ["/gestao-igreja/equipes", "/gestao-igreja/pessoas?panel=teams"],
    ["/gestao-igreja/designacoes", "/gestao-igreja/pessoas?panel=assignments"],
    ["/gestao-igreja/voluntariado", "/gestao-igreja/pessoas?panel=volunteers"],
    ["/gestao-igreja/qrcodes", "/gestao-igreja/pessoas?panel=invites"],
    ["/gestao-igreja/permissoes", "/gestao-igreja/pessoas?panel=permissions"],
  ]);

  for (const [source, destination] of expected) {
    const redirect = redirects.find((item) => item.source === source);
    assert.equal(redirect?.destination, destination);
    assert.equal(redirect?.permanent, false);
  }
});

test("people operations hub is list-first and has no area tabs", async () => {
  const hub = await readFile(resolve("components/church-management/ChurchPeopleOperationsHub.tsx"), "utf8");
  const people = await readFile(resolve("components/church-management/ChurchPeoplePreview.tsx"), "utf8");

  assert.doesNotMatch(hub, /type OperationsTab|activeTab|Áreas da central operacional/);
  assert.match(hub, /Pessoas e equipes/);
  assert.match(hub, /Gerenciar equipes/);
  assert.match(hub, /Convidar pessoa/);
  assert.match(people, /Buscar por nome, equipe ou função/);
  assert.match(people, /Adicionar à equipe/);
  assert.match(people, /Próximas escalas/);
  assert.match(people, /Agenda e nova escala/);
});

test("accepted team invitation activates membership only after consent", async () => {
  const service = await readFile(resolve("services/churchManagementService.ts"), "utf8");
  assert.match(service, /assignment\.sourceType === 'team_membership_invite'/);
  assert.match(service, /role: 'volunteer',[\s\S]*scopeType: 'team'/);
});

test("management notification layer stays above page content", async () => {
  const shell = await readFile(resolve("components/church-management/ChurchManagementShell.tsx"), "utf8");
  assert.match(shell, /sticky top-0 z-40/);
  assert.match(shell, /relative z-40 border-b/);
});
