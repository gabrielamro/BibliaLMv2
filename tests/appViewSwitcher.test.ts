import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/AppViewSwitcher.tsx', import.meta.url), 'utf8');

test('renderiza visões permitidas como ícones lado a lado, sem cards textuais', () => {
  assert.match(source, /aria-label={`Alternar para \${view\.label}`}/);
  assert.match(source, /aria-current={active \? "page" : undefined}/);
  assert.match(source, /className="flex shrink-0 items-center gap-1/);
  assert.match(source, /data-module-theme={view\.module}/);
  assert.match(source, /module-focus relative flex h-9 w-9 items-center justify-center/);
  assert.doesNotMatch(source, /Papéis acumulativos/);
  assert.doesNotMatch(source, /Ocultar alternância de visão/);
  assert.doesNotMatch(source, /Mostrar alternância de visão/);
  assert.doesNotMatch(source, /view\.description/);
});

test('inclui o ícone pastoral somente quando a permissão está disponível', () => {
  assert.match(source, /view\.id === "pastoral" && canOpenPastoral/);
  assert.match(source, /view\.id === "management" && canOpenManagement/);
  assert.match(source, /href: "\/workspace-pastoral"/);
  assert.match(source, /href: "\/gestao-igreja\/cultos"/);
  assert.match(source, /module: "pastoral"/);
  assert.match(source, /module: "management"/);
});
