import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readActiveCultoSession, storeActiveCultoSession } from '../utils/activeCultoSession.ts';

const read = (path: string) => readFileSync(resolve(path), 'utf8');

test('culto mobile mantém o relógio original e concentra ações em três botões flutuantes', () => {
  const page = read('components/culto-plus/CultoPlusOnePage.tsx');
  const topActions = read('components/culto-plus/CultoPlusTopActions.tsx');

  assert.doesNotMatch(page, /data-testid="culto-mobile-countdown"/);
  assert.match(page, /data-testid="culto-mobile-floating-menus"/);
  assert.match(page, /aria-label="Abrir funcionalidades do culto"/);
  assert.match(page, /aria-label="Abrir interações do culto"/);
  assert.match(page, /aria-label="Postar no Reino"/);
  assert.match(page, /> Partilhar</);
  assert.match(page, /reaction\.type === 'amen'/);
  assert.match(read('components/culto-plus/CultoLiveTimeline.tsx'), /<Clock3 size=\{15\}/);
  assert.match(topActions, /fixed left-4/);
  assert.match(topActions, /fixed right-4/);
  assert.match(page, /backHref="\/meus-cultos"/);
});

test('área inferior não repete informações já disponíveis no culto ao vivo', () => {
  const page = read('components/culto-plus/CultoPlusOnePage.tsx');

  assert.doesNotMatch(page, />Momento atual</);
  assert.doesNotMatch(page, />Modo Culto Ao Vivo</);
  assert.doesNotMatch(page, />Reacoes do culto</);
  assert.doesNotMatch(page, />Versículo-chave</);
  assert.match(page, /id="culto-post-composer-title"/);
  assert.match(page, /Publicar no Reino/);
});

test('partilha mobile possui um único eixo vertical rolável', () => {
  const composer = read('components/social/KingdomComposer.tsx');
  assert.match(composer, /data-testid="kingdom-composer-scroll"/);
  assert.match(composer, /h-\[100dvh\] max-h-\[100dvh\]/);
  assert.match(composer, /touch-pan-y overflow-y-auto overscroll-contain/);
});

test('sessão do culto ativo preserva retorno temporário à transmissão', () => {
  const values = new Map<string, string>();
  const fakeWindow = {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    dispatchEvent: () => true,
  };
  Object.defineProperty(globalThis, 'window', { value: fakeWindow, configurable: true });

  storeActiveCultoSession({ href: '/culto/culto-de-teste', title: 'Culto de teste' });
  const session = readActiveCultoSession();

  assert.equal(session?.href, '/culto/culto-de-teste');
  assert.equal(session?.title, 'Culto de teste');
  assert.ok((session?.expiresAt ?? 0) > Date.now());
});
