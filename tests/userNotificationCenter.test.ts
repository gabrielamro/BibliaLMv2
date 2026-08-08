import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const center = readFileSync("components/UserNotificationCenter.tsx", "utf8");
const shell = readFileSync("components/CultoPlusPageShell.tsx", "utf8");

test("menu pessoal oferece central de notificações no desktop e no mobile", () => {
  assert.match(shell, /import UserNotificationCenter/);
  assert.equal((shell.match(/<UserNotificationCenter(?: [^>]*)? \/>/g) ?? []).length, 2);
});

test("central pessoal usa notificações reais do AuthContext", () => {
  assert.match(center, /notifications, unreadNotificationsCount, markNotificationsAsRead/);
  assert.match(center, /data-testid="user-notification-center"/);
  assert.match(center, /Marcar todas como lidas/);
  assert.match(center, /notification\.link/);
});

test("central pessoal fecha ao clicar fora ou pressionar Escape", () => {
  assert.match(center, /document\.addEventListener\("pointerdown"/);
  assert.match(center, /event\.key !== "Escape"/);
  assert.match(center, /querySelector<HTMLElement>\("summary"\)\?\.focus\(\)/);
});

test("painel abre depois da largura do menu e acima do conteúdo", () => {
  assert.match(center, /desktopMenuCompact \? "lg:left-\[84px\]" : "lg:left-\[256px\]"/);
  assert.match(center, /z-\[230\]/);
  assert.match(shell, /z-\[220\]/);
  assert.match(shell, /desktopMenuCompact=\{isDesktopMenuCompact\}/);
  assert.match(shell, /isDesktopMenuCompact \? "\|›" : "‹\|"/);
  assert.doesNotMatch(shell, /PanelLeftClose|PanelLeftOpen/);
});
