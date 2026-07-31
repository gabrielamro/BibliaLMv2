import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('o shell da gestão permanece montado enquanto o gate exibe a mensagem de acesso', async () => {
  const source = await readFile('app/gestao-igreja/layout.tsx', 'utf8');
  expect(source).toContain('<ChurchManagementShell><ChurchManagementAccessGate>');
  expect(source).not.toContain('<ChurchManagementAccessGate><ChurchManagementShell>');
});

test('links operacionais ficam restritos ao gestor ou administrador', async () => {
  const source = await readFile('components/church-management/ChurchManagementShell.tsx', 'utf8');
  expect(source).toContain('getGeneralProfileType(userProfile) === "manager"');
  expect(source).toContain('subscriptionTier === "admin"');
  expect(source).toContain('if (!canShowManagementLinks) return null;');
});
