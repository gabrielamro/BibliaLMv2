import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sources = [
  '../views/NewHomePage.tsx',
  '../components/CultoPlusPageShell.tsx',
  '../components/Sidebar/Sidebar.tsx',
  '../components/church-management/ChurchManagementShell.tsx',
  '../components/workspace/PastoralWorkspaceShell.tsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

test('todos os shells desktop oferecem controle discreto para recolher o menu', () => {
  for (const source of sources) {
    assert.match(source, /PanelLeftClose/);
    assert.match(source, /PanelLeftOpen/);
    assert.match(source, /Expandir menu/);
  }
});

test('os shells atuais compartilham a preferência persistida', () => {
  for (const source of [sources[0], sources[1], sources[3], sources[4]]) {
    assert.match(source, /cultoplus_sidebar_compact/);
  }
});
