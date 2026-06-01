import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";
import { withRetry, withTimeout } from "@/lib/gemini/retry";
import { GEMINI_MODEL } from "@/lib/gemini/config";
import { parseGeminiJson } from "@/lib/gemini/parseJson";

type AthleteResearchInput = {
  athleteName: string;
  gradYear?: string;
  sport?: string;
};

export type AthleteResearchEvent = {
  eventName: string;
  url: string;
  summary: string;
};

function buildPrompt(input: AthleteResearchInput) {
  return `You are a research assistant. Use Google Search to identify competitions, tournaments, showcases, or clinics associated with the athlete.

Athlete name: ${input.athleteName}
Graduation year: ${input.gradYear ?? "Unknown"}
Sport: ${input.sport ?? "lacrosse"}

Return ONLY valid JSON as an array:
[
  {
    "eventName": string,
    "url": string,
    "summary": string
  }
]

Rules:
- Only use events supported by the provided search results.
- Do not invent events or stats.
- Summaries should be 1-2 concise sentences and include a source link in the summary text.
- The athlete's name (or last name) must appear in the source context before using an event.
- If a different graduation year is mentioned, skip that event.
- If results are not clearly about the athlete, return an empty array.`;
}

function parseOutput(raw: string): AthleteResearchEvent[] {
  const parsed = parseGeminiJson<AthleteResearchEvent[]>(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => ({
      eventName: String(item.eventName ?? "").trim(),
      url: String(item.url ?? "").trim(),
      summary: String(item.summary ?? "").trim(),
    }))
    .filter((item) => item.eventName && item.url);
}

export async function generateAthleteResearch(input: AthleteResearchInput) {
  const ai = getGeminiClient();
  const response = await withRetry("Gemini athlete research", () =>
    withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: createUserContent([buildPrompt(input)]),
        config: {
          tools: [{ googleSearch: {} }],
        },
      }),
      30_000
    )
  );
  return parseOutput(response.text ?? "");
}
