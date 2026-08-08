/** Turn API/unknown error payloads into a safe human-readable string (never "[object Object]"). */
export const toDevotionalErrorMessage = (
  value: unknown,
  fallback = 'Não foi possível carregar o Pão Diário.',
): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (value instanceof Error) {
    const trimmed = value.message.trim();
    return trimmed || fallback;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail', 'details', 'hint'] as const) {
      const nested = record[key];
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
      if (nested && typeof nested === 'object') {
        const nestedMessage = (nested as Record<string, unknown>).message;
        if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage.trim();
      }
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}' && serialized !== 'null') return serialized;
    } catch {
      // ignore serialization failures
    }
  }
  if (value == null) return fallback;
  const coerced = String(value);
  return !coerced || coerced === '[object Object]' ? fallback : coerced;
};

export const toErrorCode = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const code = (value as Record<string, unknown>).code;
    if (typeof code === 'string' && code.trim()) return code.trim();
  }
  return undefined;
};
