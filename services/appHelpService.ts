import { APP_HELP_KNOWLEDGE } from '../data/appHelpKnowledge';
import type { AppHelpArticle, SubscriptionTier } from '../types';

export interface AppHelpIntentResult {
  isAppSupport: boolean;
  confidence: 'none' | 'low' | 'medium' | 'high';
  score: number;
  articles: AppHelpArticle[];
}

export interface HelpQuestionLogInput {
  message: string;
  articleId?: string;
  confidence: AppHelpIntentResult['confidence'];
}

const APP_CONTEXT_TERMS = [
  'app', 'aplicativo', 'biblialm', 'onde', 'como', 'nao encontrei', 'nao acho', 'achar', 'ver',
  'menu', 'tela', 'botao', 'aba', 'rota', 'pagina', 'perfil', 'conta', 'plano', 'reino',
  'historico', 'post', 'culto', 'igreja', 'grupo', 'celula',
];

const BIBLE_CONTEXT_TERMS = [
  'joao', 'genesis', 'exodo', 'salmos', 'proverbios', 'mateus', 'marcos', 'lucas', 'romanos',
  'versiculo sobre', 'explique joao', 'contexto historico', 'teologia', 'doutrina', 'sermao',
  'biblico', 'biblica', 'oracao para', 'devocional',
];

const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizeHelpText = (value: string) =>
  stripAccents(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const containsPhrase = (message: string, phrase: string) => {
  const normalizedPhrase = normalizeHelpText(phrase);
  return normalizedPhrase.length > 1 && message.includes(normalizedPhrase);
};

const articleScore = (message: string, article: AppHelpArticle) => {
  let score = 0;

  for (const keyword of article.intentKeywords) {
    const normalizedKeyword = normalizeHelpText(keyword);
    if (!normalizedKeyword) continue;
    if (message === normalizedKeyword) score += 8;
    else if (message.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 6 : 3;
  }

  for (const question of article.relatedQuestions) {
    if (containsPhrase(message, question)) score += 7;
  }

  if (message.includes(article.module)) score += 2;
  if (article.route && message.includes(article.route.replace('/', ''))) score += 2;

  return score;
};

const roleAllowsArticle = (article: AppHelpArticle, userRole?: SubscriptionTier) => {
  if (!article.audience?.length || !userRole) return true;
  return article.audience.includes(userRole);
};

export const findHelpArticles = (message: string, userRole?: SubscriptionTier): AppHelpArticle[] => {
  const normalized = normalizeHelpText(message);
  if (!normalized) return [];

  return APP_HELP_KNOWLEDGE
    .filter(article => roleAllowsArticle(article, userRole))
    .map(article => ({ article, score: articleScore(normalized, article) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .slice(0, 3)
    .map(item => item.article);
};

export const detectAppHelpIntent = (message: string, userRole?: SubscriptionTier): AppHelpIntentResult => {
  const normalized = normalizeHelpText(message);
  if (!normalized) return { isAppSupport: false, confidence: 'none', score: 0, articles: [] };

  const ranked = APP_HELP_KNOWLEDGE
    .filter(article => roleAllowsArticle(article, userRole))
    .map(article => ({ article, score: articleScore(normalized, article) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const supportContextScore = APP_CONTEXT_TERMS.reduce((total, term) => total + (containsPhrase(normalized, term) ? 1 : 0), 0);
  const bibleContextScore = BIBLE_CONTEXT_TERMS.reduce((total, term) => total + (containsPhrase(normalized, term) ? 1 : 0), 0);
  const score = (best?.score ?? 0) + supportContextScore - Math.min(bibleContextScore, 2);
  const articles = ranked.filter(item => item.score > 0).slice(0, 3).map(item => item.article);

  if (!best || score <= 0) return { isAppSupport: false, confidence: 'none', score: 0, articles: [] };

  const isQuestionAboutApp = supportContextScore > 0 || best.score >= 6;
  if (!isQuestionAboutApp) return { isAppSupport: false, confidence: 'low', score, articles };

  if (score >= 9) return { isAppSupport: true, confidence: 'high', score, articles };
  if (score >= 5) return { isAppSupport: true, confidence: 'medium', score, articles };

  return { isAppSupport: true, confidence: 'low', score, articles };
};

export const shouldAnswerAsAppSupport = (message: string, userRole?: SubscriptionTier) =>
  detectAppHelpIntent(message, userRole).confidence !== 'none';

export const buildAppHelpContext = (articles: AppHelpArticle[]) =>
  articles.map(article => {
    const routeLine = article.route ? `Caminho: ${article.route}` : 'Caminho: depende da sua conta';
    return `${article.title}\n${routeLine}\nPassos:\n${article.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;
  }).join('\n\n');

export const buildAppHelpAnswer = (article: AppHelpArticle) => {
  const routeLine = article.route ? `\n\nCaminho: ${article.route}` : '';
  const steps = article.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  const fallback = article.unavailableFallback ? `\n\n${article.unavailableFallback}` : '';

  return `Posso te guiar nisso.\n${routeLine}\n\n${steps}${fallback}`;
};

const sanitizeForLocalTelemetry = (message: string) =>
  normalizeHelpText(message)
    .replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/g, '[email]')
    .replace(/\b\d{3,}\b/g, '[numero]')
    .slice(0, 160);

export const recordHelpQuestion = (input: HelpQuestionLogInput) => {
  if (typeof window === 'undefined') return;

  try {
    const key = 'biblialm.appHelpQuestions';
    const current = JSON.parse(window.localStorage.getItem(key) || '[]');
    const next = [
      {
        message: sanitizeForLocalTelemetry(input.message),
        articleId: input.articleId ?? null,
        confidence: input.confidence,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 50);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Telemetry local e opcional; falhas nao devem afetar o chat.
  }
};
