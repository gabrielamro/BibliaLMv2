import { LEGACY_APP_HOSTS } from '../constants';

const INTERNAL_APP_HOSTS = new Set(['cultomais.vercel.app', ...LEGACY_APP_HOSTS]);

export const normalizeBiblialmInternalUrl = (value?: string | null) => {
  if (!value) return value || '';
  if (value.startsWith('/')) return value;

  try {
    const url = new URL(value);
    if (INTERNAL_APP_HOSTS.has(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};
