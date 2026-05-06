export const normalizeUserSearchQuery = (value: string): string =>
  value.trim().replace(/^@+/, '').trim();

export const shouldSearchUsers = (value: string): boolean =>
  normalizeUserSearchQuery(value).length >= 2;
