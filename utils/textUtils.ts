
/**
 * Normaliza um texto para busca, removendo acentos e convertendo para minúsculas.
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

/**
 * Gera um slug amigável para URL a partir de um texto.
 */
export const generateSlug = (text: string): string => {
  return normalizeText(text)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Verifica se um texto de busca combina com um nome de livro ou abreviação.
 * Lógica aprimorada para evitar ambiguidades entre nomes curtos (ex: Jó vs João).
 */
export const searchMatch = (search: string, target: string, id: string): boolean => {
  const s = normalizeText(search);
  const t = normalizeText(target);
  const i = normalizeText(id);
  
  // Match exato tem prioridade máxima (ex: "Jo" para "Jó")
  if (s === t || s === i) return true;
  
  // Se a pesquisa for maior que o alvo, não pode ser match
  // (Impede "João" de dar match em "Jó")
  if (s.length > t.length && s.length > i.length) return false;

  // O alvo deve COMEÇAR com a pesquisa (ex: "Jo" para "João" é ok, mas "João" para "Jó" não é)
  return t.startsWith(s) || i.startsWith(s);
};
