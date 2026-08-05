import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAppModuleForRoute, getNewHomeTabModule } from '../moduleThemes.ts';

test('resolve cada família de rotas para um único módulo visual', () => {
  const cases = [
    ['/newhome', '', 'home'],
    ['/newhome', '?tab=criar', 'create'],
    ['/newhome', '?tab=reino', 'kingdom'],
    ['/newhome', '?tab=gestao', 'management'],
    ['/newhome', '?tab=calendario', 'cultos'],
    ['/bibliasagrada', '', 'bible'],
    ['/devocional', '', 'bible'],
    ['/trilhas', '', 'bible'],
    ['/social/oracao', '', 'kingdom'],
    ['/culto/celebracao', '', 'cultos'],
    ['/meus-cultos/registro', '', 'cultos'],
    ['/gestao-igreja/cultos', '', 'management'],
    ['/workspace-pastoral/cultos', '', 'pastoral'],
    ['/oracoes/gerenciar', '', 'pastoral'],
    ['/criar-sala', '', 'pastoral'],
    ['/criar-arte-sacra', '', 'create'],
    ['/minha-conta', '', 'neutral'],
  ] as const;

  for (const [pathname, search, expected] of cases) {
    assert.equal(getAppModuleForRoute(pathname, search), expected, pathname);
  }
});

test('normaliza barras finais e usa fallback neutro', () => {
  assert.equal(getAppModuleForRoute('/social/'), 'kingdom');
  assert.equal(getAppModuleForRoute('/rota-desconhecida'), 'neutral');
  assert.equal(getNewHomeTabModule('inexistente'), 'home');
});

test('tokens contemplam todos os módulos em claro e escuro', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

  for (const module of ['home', 'bible', 'kingdom', 'cultos', 'create', 'management', 'pastoral', 'neutral']) {
    assert.match(css, new RegExp(`data-module="${module}"`));
    assert.match(css, new RegExp(`dark \\[data-module="${module}"\\]`));
  }

  for (const token of ['primary', 'secondary', 'surface', 'border', 'text', 'on-primary', 'focus', 'gradient']) {
    assert.match(css, new RegExp(`--module-${token}:`));
  }
});
