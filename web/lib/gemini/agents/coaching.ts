import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import { withRetry } from "@/lib/gemini/retry";
import { GEMINI_MODEL } from "@/lib/gemini/config";
import { parseGeminiJson } from "@/lib/gemini/parseJson";

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

function buildPrompt(input: CoachingInput) {
  return `You are a high school coach preparing an athlete for college recruiting. Use the athlete profile, combine drill results, and competition summaries to write coaching guidance. Write in an active coaching tone addressed directly to the athlete (second person). Make it feel like the athlete is reading it ("you", "your", "we will"). Reference the athlete's stated goal and make concrete recommendations to improve. Align your tone with the drill grades: if the metrics are "Needs work" or below the good benchmark, do not describe them as elite or dominant. Use ONLY the athlete's provided name (do not guess, expand, or "lookup" names). Only use facts and numbers present in the input data. If a metric or event is missing, do not guess or invent it.

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
- The summary must explicitly mention the athlete's stated goal if present.
- Focus areas should be 2-4 concise bullets.
- Next steps should be actionable training items (2-4 items).
- Consider changes in recent drills/events to assess trend.`;
}

function parseOutput(raw: string): CoachingOutput {
  const parsed = parseGeminiJson<Partial<CoachingOutput>>(raw, {});
  return {
    summary: parsed.summary ?? raw.trim(),
    focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    trend: parsed.trend ?? "unknown",
  };
}

export async function generateCoachingGuidance(input: CoachingInput) {
  const ai = getGeminiClient();
  const response = await withRetry("Gemini coaching", () =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: createUserContent([buildPrompt(input)]),
    })
  );
  return parseOutput(response.text ?? "");
}
