import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../app/criar-arte-sacra/page.tsx', import.meta.url), 'utf8');
const drawerSource = readFileSync(new URL('../components/sacred-art-editor/SacredArtDrawer.tsx', import.meta.url), 'utf8');
const canvasSource = readFileSync(new URL('../components/sacred-art-editor/SacredArtCanvas.tsx', import.meta.url), 'utf8');
const dockSource = readFileSync(new URL('../components/sacred-art-editor/SacredArtDock.tsx', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../components/CultoPlusPageShell.tsx', import.meta.url), 'utf8');

test('estúdio organiza criação, canvas e ajustes em um workspace responsivo', () => {
  assert.match(pageSource, /xl:grid-cols-\[310px_minmax\(420px,1fr\)_330px\]/);
  assert.match(pageSource, /mode="creation"/);
  assert.match(pageSource, /mode="inspector"/);
  assert.match(pageSource, /aria-label="Escolher Palavra"/);
});

test('fluxo mantém as quatro etapas e ações reais de saída', () => {
  assert.match(pageSource, /\['Palavra', 'Criar', 'Ajustar', 'Publicar'\]/);
  assert.match(pageSource, /onClick=\{handleDownload\}/);
  assert.match(pageSource, /onClick=\{handlePostToFeed\}/);
  assert.match(pageSource, /Salvo automaticamente/);
});

test('formato fica ao lado do salvamento e motor de IA mantém criar arte fora da rolagem', () => {
  assert.match(pageSource, /data-testid="sacred-art-canvas-toolbar"/);
  assert.match(pageSource, /data-testid="sacred-art-format-feed"/);
  assert.match(pageSource, /data-testid="sacred-art-format-story"/);
  assert.match(pageSource, /data-testid="sacred-art-word-panel"/);
  assert.match(drawerSource, /data-testid="sacred-art-create-button"/);
  assert.match(drawerSource, /shrink-0 border-t/);
});

test('painéis contextuais preservam criação e inspeção sem duplicar regras', () => {
  assert.match(drawerSource, /mode\?: 'all' \| 'creation' \| 'inspector'/);
  assert.match(drawerSource, /Templates/);
  assert.match(drawerSource, /Criar com IA/);
  assert.match(drawerSource, /Imagem e estilo/);
});

test('canvas usa a identidade Culto+ no estado vazio e na assinatura', () => {
  assert.match(canvasSource, /IA do Culto\+/);
  assert.match(canvasSource, /text="Culto\+"/);
  assert.doesNotMatch(canvasSource, /Gerar Arte Inédita/);
  assert.doesNotMatch(canvasSource, /Explorar Acervo/);
  assert.doesNotMatch(canvasSource, /Criar com IA/);
  assert.doesNotMatch(canvasSource, /Ver acervo/);
  assert.match(dockSource, /\{ id: 'templates'/);
  assert.match(dockSource, /\{ id: 'ai'/);
  assert.doesNotMatch(canvasSource, /BibliaLM App/);
});

test('rota usa o menu novo do Culto+ e permite expandir ou recolher', () => {
  assert.match(pageSource, /<CultoPlusPageShell compactDesktop>/);
  assert.match(layoutSource, /isStandaloneCreativeStudioShell/);
  assert.match(shellSource, /data-compact=\{isDesktopMenuCompact \? "true" : "false"\}/);
  assert.match(shellSource, /data-testid="cultoplus-desktop-menu-toggle"/);
  assert.match(shellSource, /cultoplus_sidebar_compact/);
  assert.match(shellSource, /aria-expanded=\{!isDesktopMenuCompact\}/);
  assert.match(shellSource, /href: "\/criar-arte-sacra"/);
});
