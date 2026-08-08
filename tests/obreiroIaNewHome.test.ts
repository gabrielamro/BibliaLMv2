import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');
const chatbotSource = readFileSync(new URL('../components/ObreiroIAChatbot.tsx', import.meta.url), 'utf8');

test('shells pessoais e ministeriais elegíveis exibem o acesso flutuante ao Obreiro IA', () => {
  for (const shell of [
    'isStandaloneBibleModuleShell',
    'isStandaloneNewHome',
    'isStandaloneCultosPersonalShell',
    'isStandalonePersonalShell',
    'isStandaloneChurchManagementShell',
    'isStandalonePastoralWorkspaceShell',
    'isSacredArtRoute',
  ]) {
    assert.match(layoutSource, new RegExp(`\\|\\| ${shell}`));
  }
  assert.match(layoutSource, /supportsObreiroIA && <ObreiroIAChatbot \/>/);
  assert.match(layoutSource, /<ObreiroIAChatbot \/>/);
  assert.match(chatbotSource, /hasNoMobileBottomNavigation = isOperationalShell \|\| location\.pathname === '\/criar-arte-sacra'/);
  assert.doesNotMatch(chatbotSource, /isSacredArtStudio/);
});
