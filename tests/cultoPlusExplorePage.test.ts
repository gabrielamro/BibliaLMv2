import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const routeSource = readFileSync(new URL('../app/social/explore/page.tsx', import.meta.url), 'utf8');
const viewSource = readFileSync(new URL('../views/ExplorePage.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');

test('Explorar usa o shell Culto+ sem duplicar o menu legado', () => {
  assert.match(routeSource, /<CultoPlusPageShell>/);
  assert.match(layoutSource, /\['\/social', '\/social\/igrejas', '\/social\/explore'\]\.includes\(location\.pathname\)/);
});

test('Explorar segue a identidade visual do Reino', () => {
  assert.match(viewSource, /data-module="kingdom"/);
  assert.match(viewSource, />Explorar<\/h1>/);
  assert.match(viewSource, /rounded-\[1\.5rem\].*px-5 py-4/);
  assert.match(viewSource, /aria-label="Atalhos do Reino"/);
  assert.match(viewSource, /Busca global/);
});

test('busca e atalhos existentes permanecem acessiveis', () => {
  assert.match(viewSource, /onChange=\{\(e\) => handleSearch\(e\.target\.value\)\}/);
  assert.match(viewSource, /navigate\('\/social\/igrejas'\)/);
  assert.match(viewSource, /navigate\('\/social\/oracao'\)/);
  assert.match(viewSource, /navigate\('\/criar-sala'\)/);
});
