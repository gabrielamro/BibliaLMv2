import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const resolverSource = readFileSync(new URL('../services/bibleQuoteResolver.ts', import.meta.url), 'utf8');
const chatRouteSource = readFileSync(new URL('../app/api/ai/chat/route.ts', import.meta.url), 'utf8');
const chatbotSource = readFileSync(new URL('../components/ObreiroIAChatbot.tsx', import.meta.url), 'utf8');
const bible = JSON.parse(readFileSync(new URL('../biblia_completa.json', import.meta.url), 'utf8')) as Array<{
  id: string;
  name: string;
  chapters: string[][];
}>;

test('Salmos 23:1 está presente na base bíblica completa', () => {
  const psalms = bible.find((book) => book.id === 'sl');
  assert.match(psalms?.chapters[22]?.[0] ?? '', /senhor.*meu pastor.*nada me faltar/i);
});

test('a frase sem acentos possui uma correspondência determinística em Salmos 23:1', () => {
  const psalms = bible.find((book) => book.id === 'sl');
  const normalize = (value: string) => value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  assert.match(normalize(psalms?.chapters[22]?.[0] ?? ''), /senhor e o meu pastor nada me faltara/);
  assert.match(resolverSource, /compactBibleQuote\(candidate\.text\)\.includes\(compactQuery\)/);
});

test('Obreiro consulta a base antes de recorrer ao provedor de IA', () => {
  assert.match(resolverSource, /normalizeBibleQuote/);
  assert.match(resolverSource, /findBibleQuote/);
  assert.match(chatRouteSource, /findBibleQuoteInDatabase\(admin, latestQuestion\)/);
  assert.match(chatRouteSource, /bibleMatch \?\?= findBibleQuote\(latestQuestion, bundledBibleVerses\)/);
  assert.match(chatRouteSource, /if \(bibleMatch\) return json\(\{ text: formatBibleQuoteAnswer\(bibleMatch\)/);
  assert.ok(chatRouteSource.indexOf('findBibleQuoteInDatabase(admin, latestQuestion)') < chatRouteSource.indexOf('generateWithCloudflareWorkersAi(messages)'));
  assert.match(chatbotSource, /const isVerifiedBibleResponse/);
  assert.match(chatbotSource, /!isVerifiedBibleResponse/);
});
