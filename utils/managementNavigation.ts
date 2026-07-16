/** Monta links de cadastro preservando a tela de origem dentro da Gestão. */
export function buildManagementContextHref(destination: string, returnTo: string): string {
  return `${destination}?returnTo=${encodeURIComponent(returnTo)}`;
}

/** Aceita somente retornos internos do módulo para evitar redirecionamentos indevidos. */
export function getSafeManagementReturnPath(value: string | null | undefined, fallback: string): string {
  if (!value || value.includes("\\") || /[\r\n]/.test(value)) return fallback;
  if (value !== "/gestao-igreja" && !value.startsWith("/gestao-igreja/")) return fallback;
  return value;
}
