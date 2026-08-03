import test from 'node:test';
import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(path), 'utf8');

test('home e perfil legado convergem para experiências canônicas', () => {
  assert.match(read('app/page.tsx'), /redirect\('\/newhome'\)/);
  assert.match(read('app/inicio03/page.tsx'), /redirect\('\/newhome'\)/);
  assert.match(read('app/[username]/page.tsx'), /redirect\(`\/u\//);
});

test('superfícies do Reino compartilham o shell Culto+', () => {
  const routes = [
    'app/igreja/[churchSlug]/page.tsx',
    'app/grupo/[cellSlug]/page.tsx',
    'app/p/[postId]/page.tsx',
    'app/social/oracao/page.tsx',
    'app/social/artigos/page.tsx',
    'app/perfil/page.tsx',
    'app/minha-conta/page.tsx',
  ];

  routes.forEach((route) => assert.match(read(route), /CultoPlusPageShell/, route));
  assert.equal(existsSync(resolve('components/SocialNavigation.tsx')), false);
});

test('registro de culto e experiências bíblicas restantes usam o shell oficial', () => {
  const routes = [
    'app/meus-cultos/novo/page.tsx',
    'app/meus-cultos/[journalId]/page.tsx',
    'app/biblia-dashboard/page.tsx',
    'app/estudos/page.tsx',
    'app/estudos/livro/[bookId]/page.tsx',
    'app/plano/leitura/page.tsx',
    'app/jornada/[planId]/page.tsx',
    'app/v/[studyId]/page.tsx',
  ];

  routes.forEach((route) => assert.match(read(route), /CultoPlusPageShell/, route));
});

test('criação antiga converge para o Estúdio da Palavra', () => {
  assert.match(read('app/criar-estudo/page.tsx'), /redirect\(`\/criar-conteudo/);
  assert.match(read('app/criar-podcast/page.tsx'), /CultoPlusPageShell/);
  assert.match(read('app/criar-sala/page.tsx'), /CultoPlusPageShell/);
});

test('rotas de protótipo removidas não permanecem no app', () => {
  assert.equal(existsSync(resolve('app/mockinicio1/page.tsx')), false);
  assert.equal(existsSync(resolve('app/mocsantuario/page.tsx')), false);
});

test('navegação mobile usa menu superior consistente na Home e no Reino', () => {
  const home = read('views/NewHomePage.tsx');
  const shell = read('components/CultoPlusPageShell.tsx');

  assert.match(home, /includeNavigation/);
  assert.match(home, /open \? <X size=\{20\} \/> : <Menu size=\{20\} \/>/);
  assert.doesNotMatch(home, /function MobileModuleSubmenus/);
  assert.match(shell, /mobileOpen \? <X size=\{20\} \/> : <Menu size=\{20\} \/>/);
});
