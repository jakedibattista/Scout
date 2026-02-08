import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";

const defaultModel = "gemini-3-flash-preview";

type CoachingInput = {
  athleteProfile: Record<string, unknown>;
  events: Array<{ eventName: string; summary: string; url?: string }>;
  drills: Array<{
    drillType: string;
    analysisNotes?: string | null;
    analysisMetrics?: Record<string, string | number>;
    uploadDate?: string | null;
  }>;
};

type CoachingOutput = {
  summary: string;
  focusAreas: string[];
  nextSteps: string[];
  trend: "improving" | "declining" | "steady" | "unknown";
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

function buildPrompt(input: CoachingInput) {
  return `You are a high school coach preparing an athlete for college recruiting. Use the athlete profile, combine drill results, and competition summaries to write coaching guidance. Write in an active coaching tone addressed directly to the athlete (second person). Make it feel like the athlete is reading it ("you", "your", "we will"). Reference the athlete's stated goal and make concrete recommendations to improve. Align your tone with the drill grades: if the metrics are "Needs work" or below the good benchmark, do not describe them as elite or dominant. Only use facts and numbers present in the input data. If a metric is missing, do not guess or invent it.

Athlete profile:
${JSON.stringify(input.athleteProfile)}

Combine drills (latest):
${JSON.stringify(input.drills)}

Competition results:
${JSON.stringify(input.events)}

Return JSON:
{
  "summary": string,
  "focusAreas": string[],
  "nextSteps": string[],
  "trend": "improving" | "declining" | "steady" | "unknown"
}

Rules:
- Summary should be 3-5 sentences, second person, action-oriented.
- Focus areas should be 2-4 concise bullets.
- Next steps should be actionable training items (2-4 items).
- Consider changes in recent drills/events to assess trend.`;
}

function parseOutput(raw: string): CoachingOutput {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as CoachingOutput;
    return {
      summary: parsed.summary ?? trimmed,
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      trend: parsed.trend ?? "unknown",
    };
  } catch {
    return {
      summary: trimmed,
      focusAreas: [],
      nextSteps: [],
      trend: "unknown",
    };
  }
}

export async function generateCoachingGuidance(input: CoachingInput) {
  const ai = getGeminiClient();
  const response = await withRetry("Gemini coaching", () =>
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? defaultModel,
      contents: createUserContent([buildPrompt(input)]),
    })
  );
  return parseOutput(response.text ?? "");
}
