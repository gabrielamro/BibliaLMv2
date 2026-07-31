import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../app/social/page.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');
const feedSource = readFileSync(new URL('../views/social/SocialFeedPage.tsx', import.meta.url), 'utf8');

test('integra o Feed ao shell e ao menu oficial do Culto+', () => {
  assert.match(pageSource, /import CultoPlusPageShell/);
  assert.match(pageSource, /<CultoPlusPageShell>/);
  assert.match(pageSource, /title: 'Reino \| Culto\+'/);
  assert.match(layoutSource, /const isStandaloneSocialShell = \['\/social', '\/social\/igrejas', '\/social\/explore'\]\.includes\(location\.pathname\)/);
  assert.match(layoutSource, /isStandaloneBibleModuleShell \|\| isStandaloneSocialShell/);
});

test('aplica a identidade do Reino sem remover os fluxos existentes', () => {
  assert.match(feedSource, /data-testid="kingdom-hero"/);
  assert.match(feedSource, /data-testid="kingdom-composer-shortcut"/);
  assert.match(feedSource, /data-module="kingdom"/);
  assert.match(feedSource, /className="module-gradient relative overflow-hidden/);
  assert.match(feedSource, /href="\/social\/explore"/);
  assert.match(feedSource, /<KingdomComposer/);
  assert.match(feedSource, /<PostCommentsSheet/);
  assert.match(feedSource, /<PromptModal/);
  assert.match(feedSource, /<ConfirmationModal/);
});

test('mantém controles acessíveis e o scroll no contêiner correto', () => {
  assert.match(feedSource, /ref={containerRef}\s+data-testid="feed-container"/);
  assert.match(feedSource, /data-testid="kingdom-feed-column"/);
  assert.match(feedSource, /max-w-\[980px\]/);
  assert.doesNotMatch(feedSource, /max-w-3xl px-4 pb-28/);
  assert.match(feedSource, /aria-label="Atalhos do Reino"/);
  assert.match(feedSource, /aria-label={isPlusMenuOpen \? 'Fechar ações de publicação' : 'Abrir ações de publicação'}/);
  assert.match(feedSource, /min-h-11/);
});
