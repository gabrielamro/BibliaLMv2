import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../views/NewHomePage.tsx', import.meta.url), 'utf8');

test('home mostra configurações ao lado do perfil em desktop e mobile', () => {
  assert.equal((source.match(/<HomeSettingsMenu/g) || []).length, 2);
  assert.match(source, /"Abrir configurações"/);
  assert.match(source, /includeViewSwitcher/);
});

test('alternância de visão saiu da faixa mobile e permanece no menu lateral desktop', () => {
  assert.doesNotMatch(source, /<MobileUserViewSwitcher/);
  assert.match(source, /<UserViewSwitcher isPastor=\{isPastor\} canManage=\{canManage\}/);
  assert.match(source, /<AppViewSwitcher activeView="personal" canOpenPastoral=\{isPastor\} canOpenManagement=\{canManage\} compact \/>/);
});

test('menu novo preserva ações da configuração legada', () => {
  for (const href of ['/perfil', '/intro', '/regras', '/suporte', '/termos', '/privacidade', '/admin', '/system-integrity']) {
    assert.match(source, new RegExp(`href="${href.replace('/', '\\/')}"`));
  }
  assert.match(source, /onToggleTheme/);
  assert.match(source, /onSignOut/);
  assert.match(source, /onLogin/);
});

test('menu pessoal reúne culto e escala em uma única área', () => {
  assert.equal((source.match(/label: "Cultos", path: "\/meus-cultos"/g) || []).length, 1);
  assert.doesNotMatch(source, /label: "Cultos e escala"/);

  for (const label of ['Agenda de cultos', 'Meu painel', 'Minha escala', 'Minhas equipes', 'Solicitações']) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
});

test('newhome consome o contrato cromático dos módulos sem paletas paralelas no menu', () => {
  assert.match(source, /id="newhome-root" data-module=\{getNewHomeTabModule\(activeTab\)\}/);
  assert.match(source, /className="newhome-hero/);
  assert.match(source, /data-module-theme="bible"/);
  assert.match(source, /data-module-theme="cultos"/);
  assert.match(source, /data-module-theme="kingdom"/);
  assert.doesNotMatch(source, /iconTone:|openTone:|submenuTone:|borderTone:|hoverTone:/);
});
