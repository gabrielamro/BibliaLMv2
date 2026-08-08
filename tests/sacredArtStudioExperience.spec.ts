import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../app/criar-arte-sacra/page.tsx', import.meta.url), 'utf8');
const drawerSource = readFileSync(new URL('../components/sacred-art-editor/SacredArtDrawer.tsx', import.meta.url), 'utf8');
const canvasSource = readFileSync(new URL('../components/sacred-art-editor/SacredArtCanvas.tsx', import.meta.url), 'utf8');
const compositorSource = readFileSync(new URL('../utils/imageCompositor.ts', import.meta.url), 'utf8');
const feedCardSource = readFileSync(new URL('../components/social/FeedPostCard.tsx', import.meta.url), 'utf8');
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

test('pesquisa aceita intervalos e o editor Pro pode ser fechado', () => {
  const bibleServiceSource = readFileSync(new URL('../services/bibleService.ts', import.meta.url), 'utf8');
  assert.match(pageSource, /getTextByReference\(ref\)/);
  assert.match(pageSource, /aria-label="Pesquisar versículo"/);
  assert.match(pageSource, /await handleGenerateIA\(verse\)/);
  assert.match(bibleServiceSource, /normalizeReferenceSeparators/);
  assert.match(drawerSource, /aria-label="Fechar editor Pro"/);
  assert.match(drawerSource, /setActiveControlTab\(null\)/);
});

test('o botao de arte usa a permissao de imagem prevista nos planos', () => {
  const authSource = readFileSync(new URL('../contexts/AuthContext.tsx', import.meta.url), 'utf8');
  assert.match(drawerSource, /onClick=\{handleCreateClick\}/);
  assert.match(pageSource, /checkFeatureAccess\('aiImageGen'\)/);
  assert.match(authSource, /'aiChatAccess', 'aiImageGen'/);
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

test('referência é medida após o canvas renderizar nos formatos Feed e Story', () => {
  assert.match(canvasSource, /const frame = requestAnimationFrame/);
  assert.match(canvasSource, /return \(\) => cancelAnimationFrame\(frame\)/);
  assert.match(canvasSource, /if \(!foundVerse \|\| !canvasSize\.width \|\| !canvasSize\.height\) return/);
  assert.match(canvasSource, /refTextRef\.current\.y\(verseHeight \+ textLayout\.referenceGapPx\)/);
  assert.match(canvasSource, /editOptions\.aspectRatio/);
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

test('arquivo publicado preserva o layout do editor e informa seu formato ao Reino', () => {
  assert.match(compositorSource, /getResponsiveTextLayout/);
  assert.match(compositorSource, /containerWidth: width/);
  assert.match(compositorSource, /contentWidthPercent/);
  assert.match(pageSource, /aspectRatio: editOptions\.aspectRatio \?\? 'feed'/);
  assert.match(pageSource, /posts\/\$\{currentUser\.uid\}\/\$\{aspectRatio\}/);
  assert.match(pageSource, /sourceId: `sacred_art:\$\{aspectRatio\}`/);
  assert.match(feedCardSource, /post\.sourceType === 'sacred_art'/);
  assert.match(feedCardSource, /post\.sourceId === 'sacred_art:story'/);
  assert.match(feedCardSource, /aspect-\[9\/16\]/);
  assert.match(feedCardSource, /aspect-square/);
  assert.match(feedCardSource, /max-w-\[280px\]/);
  assert.match(feedCardSource, /max-w-\[420px\]/);
});
