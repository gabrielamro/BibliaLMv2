/**
 * Compatibilidade dos links antigos da operação de escalas.
 *
 * Notificações, e-mails, QR forms e favoritos ainda apontam para
 * `/meus-cultos#escala`, `#equipes` e `#solicitacoes`. A resolução acontece no
 * cliente para preservar o destino original sem perder o estado do usuário.
 */
export const MY_SCALES_ROUTE = '/minhas-escalas';

export const LEGACY_SCALE_HASH_TARGETS: Readonly<Record<string, string>> = {
  escala: MY_SCALES_ROUTE,
  escalas: MY_SCALES_ROUTE,
  designacoes: MY_SCALES_ROUTE,
  equipes: `${MY_SCALES_ROUTE}#equipes`,
  solicitacoes: `${MY_SCALES_ROUTE}#solicitacoes`,
  acompanhamento: `${MY_SCALES_ROUTE}#solicitacoes`,
};

const normalizeHash = (hash: string) =>
  hash
    .replace(/^#/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const resolveLegacyScaleHashTarget = (hash: string): string | null => {
  const normalized = normalizeHash(hash || '');
  if (!normalized) return null;
  return LEGACY_SCALE_HASH_TARGETS[normalized] ?? null;
};
