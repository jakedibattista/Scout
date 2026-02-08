import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import { withRetry } from "@/lib/gemini/retry";

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
  summary: string;
  keyTraits: string[];
  weaknesses: string[];
};

 
function buildPrompt(input: ScoutReportInput) {
  return `You are a college scout. Summarize an athlete's current readiness and potential based on profile, drills, and competitions. Be conservative with recommendations; only assign higher levels when evidence is strong and consistent. If data is limited or mixed, lean toward a lower level. Use ONLY the athlete's provided name (do not guess, expand, or "lookup" names). Only use facts and numbers present in the provided data. If a metric or event is missing, do not guess or invent it.

Athlete profile:
${JSON.stringify(input.athleteProfile)}

Combine drills (latest):
${JSON.stringify(input.drills)}

Competition results:
${JSON.stringify(input.events)}

Return JSON:
{
  "summary": string,
  "keyTraits": string[],
  "weaknesses": string[]
}

Rules:
- Summary should be 2-4 sentences, scout-facing and quick to scan.
- keyTraits: 3-5 bullets of what a scout cares about most.
- weaknesses: 1-4 items if concerns exist (otherwise empty array).
- Do not introduce numbers or claims not in the input data.
- Avoid inflated praise; reserve "elite" for clearly top-tier results.
- Do not mention teams, rankings, showcases, or awards unless they exist in the events input.
- Return ONLY valid JSON.`;
}

function parseOutput(raw: string): ScoutReportOutput {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as ScoutReportOutput;
    return {
      summary: parsed.summary ?? trimmed,
      keyTraits: Array.isArray(parsed.keyTraits) ? parsed.keyTraits : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    };
  } catch {
    return {
      summary: trimmed,
      keyTraits: [],
      weaknesses: [],
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
