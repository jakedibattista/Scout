/**
 * Parse a Gemini response into JSON, tolerating ```json fences and surrounding
 * prose. Returns `fallback` if no JSON value can be recovered.
 */
export function parseGeminiJson<T>(raw: string, fallback: T): T {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return fallback;

  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fall back to the first {...} or [...] span in the text.
    const objStart = candidate.indexOf("{");
    const objEnd = candidate.lastIndexOf("}");
    const arrStart = candidate.indexOf("[");
    const arrEnd = candidate.lastIndexOf("]");

    const arrayFirst =
      arrStart !== -1 && (objStart === -1 || arrStart < objStart);

    try {
      if (arrayFirst && arrEnd > arrStart) {
        return JSON.parse(candidate.slice(arrStart, arrEnd + 1)) as T;
      }
      if (objStart !== -1 && objEnd > objStart) {
        return JSON.parse(candidate.slice(objStart, objEnd + 1)) as T;
      }
    } catch {
      // ignore and return fallback
    }
    return fallback;
  }
}
