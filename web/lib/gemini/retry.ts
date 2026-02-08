export function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up") ||
    message.includes("fetch failed") ||
    message.includes("EAI_AGAIN") ||
    message.includes("ECONNREFUSED") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("timeout")
  );
}

export async function withRetry<T>(label: string, fn: () => Promise<T>) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (!isRetryable(error) || attempt >= 3) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${label} failed: ${message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }

  throw lastError;
}

export function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timeout.")), ms)
    ),
  ]);
}
