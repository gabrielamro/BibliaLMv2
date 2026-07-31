import test from 'node:test';
import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const feed = readFileSync(resolve('views/social/SocialFeedPage.tsx'), 'utf8');
const composer = readFileSync(resolve('components/social/KingdomComposer.tsx'), 'utf8');
const postCard = readFileSync(resolve('components/social/FeedPostCard.tsx'), 'utf8');
const church = readFileSync(resolve('views/public/ChurchProfilePage.tsx'), 'utf8');
const group = readFileSync(resolve('views/public/CellForumPage.tsx'), 'utf8');
const churchRoom = readFileSync(resolve('views/PrayerRoomPage.tsx'), 'utf8');

test('feed distingue erro, vazio e filtros sem mock silencioso', () => {
  assert.doesNotMatch(feed, /getMockPosts/);
  assert.match(feed, /type FeedFilter = 'all' \| 'following' \| 'church' \| 'groups'/);
  assert.match(feed, /Nada por aqui neste filtro/);
  assert.match(feed, /Seu conteúdo não foi substituído por dados de demonstração/);
});

test('compositor preserva rascunho e explicita audiência', () => {
  assert.match(composer, /cultoplus:kingdom-draft/);
  assert.match(composer, /role="dialog" aria-modal="true"/);
  assert.match(composer, /role="radiogroup" aria-label="Audiência da publicação"/);
  assert.match(composer, /Usar minha localização/);
  assert.match(composer, /Descrição da imagem/);
  assert.match(composer, /Descartar esta partilha/);
});

test('ações do post são acessíveis e salvar possui persistência', () => {
  assert.match(postCard, /aria-label={isLiked \? 'Descurtir publicação' : 'Curtir publicação'}/);
  assert.match(postCard, /href={`\/u\/\${post\.userUsername}`}/);
  assert.match(postCard, /<Bookmark/);
  assert.match(postCard, /aria-pressed=\{post\.saved\}/);
});

test('Trama Viva está implementada no feed e no caderno de partilha', () => {
  assert.match(feed, /Pulso do Reino/);
  assert.match(feed, /Seu caminho/);
  assert.match(feed, /Agora na sua comunidade/);
  assert.match(feed, /xl:grid-cols-\[minmax\(0,1fr\)_310px\]/);
  assert.match(composer, /Destino e prévia/);
  assert.match(composer, /partilha-preview-title/);
  assert.match(composer, /md:grid-cols-\[1\.08fr_\.92fr\]/);
});

test('igreja e grupo expõem arquitetura de conteúdo consistente', () => {
  assert.match(church, /setActiveTab\('about'\)/);
  assert.match(church, /setActiveTab\('members'\)/);
  assert.match(church, /setActiveTab\('cultos'\)/);
  assert.match(group, /setActiveTab\('about'\)/);
  assert.match(group, />Membros<\/button>/);
  assert.match(church, /initialVisibility="church"/);
  assert.match(group, /initialVisibility="group"/);
  assert.match(group, /getUnifiedGroupMural/);
  assert.doesNotMatch(group, /togglePrayerIntercession\([^\n]+!!isInterceding/);
  assert.doesNotMatch(church, /togglePrayerIntercession\([^\n]+!!isInterceding/);
  assert.doesNotMatch(churchRoom, /togglePrayerIntercession\([^\n]+!!isInterceding/);
});
