import test from 'node:test';
import * as assert from 'node:assert/strict';

import { buildAppHelpAnswer, detectAppHelpIntent, findHelpArticles, normalizeHelpText } from '../services/appHelpService.ts';

test('normalizes accents and spacing for app help matching', () => {
  assert.equal(normalizeHelpText('  HistÓrico!!!  '), 'historico');
});

test('matches history questions to the Historico article', () => {
  const result = detectAppHelpIntent('Onde posso ver meu historico?');

  assert.equal(result.isAppSupport, true);
  assert.equal(result.articles[0]?.id, 'app.history.find');
});

test('matches post creation questions to the Reino article', () => {
  const articles = findHelpArticles('Como faco pra fazer um post?');

  assert.equal(articles[0]?.id, 'app.kingdom.create_post');
});

test('matches plan questions to the plans article', () => {
  const result = detectAppHelpIntent('Nao encontrei informacoes sobre o plano onde acho');

  assert.equal(result.isAppSupport, true);
  assert.equal(result.articles[0]?.id, 'app.plan.view');
});

test('does not classify a biblical explanation as app support', () => {
  const result = detectAppHelpIntent('Explique Joao 3:16 com contexto historico');

  assert.equal(result.isAppSupport, false);
});

test('builds a concise answer with the route and fallback', () => {
  const article = findHelpArticles('onde vejo meus cultos')[0];
  const answer = buildAppHelpAnswer(article);

  assert.match(answer, /Caminho: \/meus-cultos/);
  assert.match(answer, /1\./);
});
