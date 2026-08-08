import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('devocionais gerados só são persistidos após aprovação pastoral', () => {
  const route = readFileSync('app/api/devotional/daily/route.ts', 'utf8');

  assert.match(route, /generateDevotionalWithAudit\(true, true, \{/);
  assert.match(route, /excludedVerseReferences: Array\.from\(excludedReferences\)/);
  assert.match(route, /if \(!result\.audit\?\.approved\)/);
  assert.match(route, /continue;/);
});

test('falha de auditoria não é tratada como aprovação', () => {
  const auditor = readFileSync('services/pastorAuditor.ts', 'utf8');

  assert.match(auditor, /approved: result\.approved === true/);
  assert.match(auditor, /approved: false/);
  assert.match(auditor, /Auditoria indisponível/);
});

test('a tela identifica a origem da reflexão sem confundi-la com a Bíblia', () => {
  const page = readFileSync('views/DevotionalPage.tsx', 'utf8');

  assert.match(page, /Reflexão gerada com apoio de IA/);
  assert.match(page, /não substitui o texto bíblico em seu contexto/);
});
