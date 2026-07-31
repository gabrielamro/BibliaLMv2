import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('../app/social/igrejas/page.tsx', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../views/public/ChurchesListPage.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');

test('pagina de igrejas usa o shell atual do Culto+', () => {
  assert.match(routeSource, /import CultoPlusPageShell/);
  assert.match(routeSource, /<CultoPlusPageShell>/);
  assert.match(routeSource, /<ChurchesListPage \/>/);
  assert.match(layoutSource, /\['\/social', '\/social\/igrejas', '\/social\/explore'\]\.includes\(location\.pathname\)/);
});

test('pagina de igrejas segue a identidade visual do Reino', () => {
  assert.match(viewSource, /data-module="kingdom"/);
  assert.match(viewSource, /module-gradient/);
  assert.match(viewSource, />Igrejas<\/h1>/);
  assert.match(viewSource, /rounded-\[1\.5rem\].*px-5 py-4/);
  assert.match(viewSource, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(viewSource, /aria-label="Atalhos do Reino"/);
});

test('busca e acoes de vinculo permanecem disponiveis', () => {
  assert.match(viewSource, /onClick=\{handleSearch\}/);
  assert.match(viewSource, /onClick=\{\(event\) => joinChurch\(event, church\)\}/);
  assert.match(viewSource, /onClick=\{loadMore\}/);
  assert.match(viewSource, /onClick=\{createChurchFromSearch\}/);
});
