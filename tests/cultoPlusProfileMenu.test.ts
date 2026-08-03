import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const profileRouteSource = readFileSync(resolve('app/u/[username]/page.tsx'), 'utf8');
const layoutSource = readFileSync(resolve('components/Layout.tsx'), 'utf8');
const shellSource = readFileSync(resolve('components/CultoPlusPageShell.tsx'), 'utf8');
const brandSource = readFileSync(resolve('components/CultoPlusBrand.tsx'), 'utf8');

test('perfil canônico usa o menu oficial do Culto+', () => {
  assert.match(profileRouteSource, /import CultoPlusPageShell/);
  assert.match(profileRouteSource, /<CultoPlusPageShell>/);
  assert.match(layoutSource, /location\.pathname\.startsWith\('\/u\/'\)/);
});

test('menu resolve perfis canônicos como parte do Reino', () => {
  assert.match(shellSource, /getAppModuleForRoute\(location\.pathname, location\.search\)/);
  assert.match(shellSource, /const isActive = item\.module === activeModule\.module/);
  assert.match(shellSource, /aria-label="Navegação principal da visão pessoal"/);
  assert.match(shellSource, /min-h-14/);
  assert.match(brandSource, /compact/);
  assert.match(brandSource, /-translate-x-\[24\.5%\]/);
});
