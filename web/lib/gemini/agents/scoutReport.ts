import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";

const defaultModel = "gemini-3-flash-preview";

type ScoutReportInput = {
  athleteProfile: Record<string, unknown>;
  drills: Array<{
    drillType: string;
    analysisNotes?: string | null;
    analysisMetrics?: Record<string, string | number>;
    uploadDate?: string | null;
  }>;
  events: Array<{ eventName: string; summary: string; url?: string }>;
};

type ScoutReportOutput = {
  recommendedLevel: "D1" | "D2" | "D3" | "JUCO" | "Club";
  summary: string;
  keyTraits: string[];
  riskFlags: string[];
};

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up") ||
    message.includes("fetch failed") ||
    message.includes("EAI_AGAIN") ||
    message.includes("ECONNREFUSED") ||
    message.includes("503") ||
    message.includes("504")
  );
}

async function withRetry<T>(label: string, fn: () => Promise<T>) {
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
function buildPrompt(input: ScoutReportInput) {
  return `You are a college scout. Summarize an athlete's current readiness and potential based on profile, drills, and competitions. Be conservative with recommendations; only assign higher levels when evidence is strong and consistent. If data is limited or mixed, lean toward a lower level. Only use facts and numbers that are present in the provided data. If a metric is missing, do not guess or invent it.

Athlete profile:
${JSON.stringify(input.athleteProfile)}

Combine drills (latest):
${JSON.stringify(input.drills)}

Competition results:
${JSON.stringify(input.events)}

Return JSON:
{
  "recommendedLevel": "D1" | "D2" | "D3" | "JUCO" | "Club",
  "summary": string,
  "keyTraits": string[],
  "riskFlags": string[]
}

Rules:
- First determine the recommended college level.
- Summary should be 2-4 sentences, scout-facing and quick to scan.
- keyTraits: 3-5 bullets of what a scout cares about most.
- riskFlags: 0-3 items if concerns exist (injury, inconsistency, gaps, etc).
- Do not introduce numbers or claims not in the input data.
- Avoid inflated praise; reserve "elite" for clearly top-tier results.
- Return ONLY valid JSON.`;
}

function parseOutput(raw: string): ScoutReportOutput {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as ScoutReportOutput;
    return {
      recommendedLevel: parsed.recommendedLevel ?? "Club",
      summary: parsed.summary ?? trimmed,
      keyTraits: Array.isArray(parsed.keyTraits) ? parsed.keyTraits : [],
      riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags : [],
    };
  } catch {
    return {
      recommendedLevel: "Club",
      summary: trimmed,
      keyTraits: [],
      riskFlags: [],
    };
  }
}

export async function generateScoutReport(input: ScoutReportInput) {
  const ai = getGeminiClient();
  const response = await withRetry("Gemini scout report", () =>
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? defaultModel,
      contents: createUserContent([buildPrompt(input)]),
    })
  );
  return parseOutput(response.text ?? "");
}
