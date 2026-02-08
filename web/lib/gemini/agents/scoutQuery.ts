import { createUserContent } from "@google/genai";
import { getGeminiClient } from "@/lib/gemini/client";

const defaultModel = "gemini-3-flash-preview";

type ScoutProfile = {
  sport?: string;
  recruitingStates?: string[];
  positionFocus?: string[];
  gradYearsRecruiting?: number[];
};

type ScoutQueryPlan = {
  intent: "speed" | "wall_ball" | "general";
  filters: {
    positions?: string[];
    recruitingStates?: string[];
    gradYearsRecruiting?: number[];
    gradYearMin?: number;
    gradYearMax?: number;
    gpaMin?: number;
    goal?: string;
    clubTeam?: string;
    currentOffers?: string[];
  };
  sort: {
    by: "speed_score" | "wall_ball_score" | "relevance";
    direction: "desc" | "asc";
  };
  notes?: string;
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
    message.includes("504") ||
    message.includes("timeout")
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

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Scout query timeout.")), ms)
    ),
  ]);
}

function buildPrompt(profile: ScoutProfile, query: string) {
  return `You are a scout search parser. You read a scout's profile and a natural-language query, then return a JSON plan.

Scout profile:
${JSON.stringify(profile)}

Athlete profile schema (fields you may target):
{
  username, name, email, state, sport, position, gradYear, height, weight,
  highSchoolTeam, goal, clubTeam, currentOffers, gpa, relocateStates
}

Combine analysis fields (from videos analysis):
- shuttle_5_10_5: analysisMetrics["Total Time"] or "Finish Time"
- dash_20: analysisMetrics["Total Time"] or "Finish Time"
- wall_ball: analysisMetrics["repetitions"] (60s)

Query:
${query}

Return JSON:
{
  "intent": "speed" | "wall_ball" | "general",
  "filters": {
    "positions": string[]?,
    "recruitingStates": string[]?,
    "gradYearsRecruiting": number[]?,
    "gradYearMin": number?,
    "gradYearMax": number?,
    "gpaMin": number?,
    "goal": string?,
    "clubTeam": string?,
    "currentOffers": string[]?
  },
  "sort": {
    "by": "speed_score" | "wall_ball_score" | "relevance",
    "direction": "desc" | "asc"
  },
  "notes": string?
}

Rules:
- Always return valid JSON only.
- If query mentions fast/speed/quick, set intent to "speed" and sort by speed_score desc.
- If query mentions wall ball/best wall ball, set intent to "wall_ball" and sort by wall_ball_score desc.
- If profile has recruitingStates or positionFocus, include them in filters unless query overrides.
`;
}

function parsePlan(raw: string): ScoutQueryPlan {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as ScoutQueryPlan;
    return parsed;
  } catch (error) {
    return {
      intent: "general",
      filters: {},
      sort: { by: "relevance", direction: "desc" },
      notes: "Fallback to default plan.",
    };
  }
}

export async function buildScoutQueryPlan(input: {
  profile: ScoutProfile;
  query: string;
}) {
  const ai = getGeminiClient();
  const response = await withRetry("Gemini scout query", () =>
    withTimeout(
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? defaultModel,
        contents: createUserContent([buildPrompt(input.profile, input.query)]),
      }),
      25_000
    )
  );
  return parsePlan(response.text ?? "");
}
