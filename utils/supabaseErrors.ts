export const formatSupabaseError = (error: any) => {
  const rawError = [error?.message, error?.details, error?.hint, error?.code, error?.name]
    .filter(Boolean)
    .join(' | ');
  const normalizedError = rawError.toLowerCase();

  if (normalizedError.includes('supabasetimeouterror') || normalizedError.includes('timeouterror')) {
    return 'A conexão com o Supabase demorou mais que o esperado. Tente novamente.';
  }
  if (normalizedError.includes('aborterror') || normalizedError.includes('signal is aborted') || normalizedError.includes('request was aborted')) {
    return 'A requisição foi interrompida antes de concluir. Tente novamente.';
  }

  const message = error?.message || error?.details || error?.hint || error?.code || 'Erro desconhecido do Supabase';
  return [message, error?.code && `code=${error.code}`, error?.details, error?.hint]
    .filter(Boolean)
    .join(' | ');
};

export const getMissingColumnNameFromError = (error: any): string | null => {
  const text = formatSupabaseError(error);
  return (
    text.match(/'([^']+)' column/)?.[1] ||
    text.match(/Could not find the '([^']+)' column/i)?.[1] ||
    text.match(/column\s+(?:\w+\.)?(\w+)\s+does not exist/i)?.[1] ||
    null
  );
};

export const isMissingColumnError = (error: any, column?: string) => {
  const missingColumn = getMissingColumnNameFromError(error);
  const isMissing = error?.code === 'PGRST204' || error?.code === '42703' || Boolean(missingColumn);
  if (!isMissing) return false;
  return column ? missingColumn === column : true;
};
