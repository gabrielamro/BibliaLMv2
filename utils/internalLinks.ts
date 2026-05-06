const BIBLIALM_HOSTS = new Set(['biblialm.com.br', 'www.biblialm.com.br']);

export const normalizeBiblialmInternalUrl = (value?: string | null) => {
  if (!value) return value || '';
  if (value.startsWith('/')) return value;

  try {
    const url = new URL(value);
    if (BIBLIALM_HOSTS.has(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return value;
  }

  return value;
};
