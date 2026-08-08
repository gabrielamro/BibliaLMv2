import DOMPurify from 'dompurify';

import { PUBLIC_HTML_SANITIZE_OPTIONS } from './publicHtmlPolicy';

export const sanitizePublicHtml = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  // Conteúdo público destes leitores é carregado após a hidratação. O retorno vazio
  // também impede que uma chamada futura no servidor injete HTML não sanitizado.
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(value, PUBLIC_HTML_SANITIZE_OPTIONS);
};
