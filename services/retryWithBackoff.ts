export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: { attempts?: number; initialDelayMs?: number } = {},
): Promise<T> => {
  const attempts = Math.max(1, options.attempts ?? 3);
  const initialDelayMs = Math.max(100, options.initialDelayMs ?? 500);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, initialDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
};
