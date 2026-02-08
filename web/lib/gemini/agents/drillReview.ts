import {
  createPartFromUri,
  createUserContent,
  FileState,
} from "@google/genai";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { adminStorage } from "@/lib/firebaseAdmin";
import { getGeminiClient } from "@/lib/gemini/client";
import { withRetry } from "@/lib/gemini/retry";

const defaultModel = "gemini-3-flash-preview";
const fallbackModel = "gemini-3-pro-preview";

type DrillType = "wall_ball" | "dash_20" | "shuttle_5_10_5";

type DrillAnalysis = {
  notes: string;
  metrics: Record<string, string | number>;
};

const drillPrompts: Record<DrillType, string> = {
  wall_ball:
    "Count wall-ball reps by observing stick flicks (do not track the ball). A repetition is one clear forward stick flick/throw action. For 60 seconds, count consecutive flicks; if you see an obvious drop or break in control, reset the count to 0. Return the highest consecutive count within the 60-second span. If visibility is poor, estimate and include a confidence note. Return metrics keys: total_reps_60s and max_consecutive_reps.",
  dash_20:
    "Analyze a 20-yard dash. Focus on time, start explosiveness, stride efficiency, and top-speed form.",
  shuttle_5_10_5:
    "Analyze a 5-10-5 shuttle. Timing starts when the athlete first moves from the middle cone and ends when they cross the middle cone after touching both sides. Focus on time, change-of-direction efficiency, footwork, and balance.",
};

function resolveMimeType(fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".mov")) return "video/quicktime";
  if (lowerName.endsWith(".mp4")) return "video/mp4";
  if (lowerName.endsWith(".m4v")) return "video/x-m4v";
  return "video/mp4";
}

function buildPrompt(drillType: DrillType) {
  const base = drillPrompts[drillType];
  return `${base}

Return a JSON object with:
{
  "notes": string,
  "metrics": { string: number|string }
}

Notes should be 2-4 sentences and include a confidence note for the count.
Return ONLY valid JSON.`;
}

function parseAnalysis(raw: string): DrillAnalysis {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate);
    return {
      notes: typeof parsed.notes === "string" ? parsed.notes : raw,
      metrics:
        parsed.metrics && typeof parsed.metrics === "object"
          ? parsed.metrics
          : {},
    };
  } catch (error) {
    return { notes: trimmed, metrics: {} };
  }
}

async function waitForFileActive(
  fileName: string,
  maxWaitMs = 90_000,
  pollIntervalMs = 2_000
) {
  const ai = getGeminiClient();
  const start = Date.now();

  while (true) {
    const file = await withRetry("Gemini file status", () =>
      ai.files.get({ name: fileName })
    );

    if (file.state === FileState.ACTIVE) {
      return file;
    }

    if (file.state === FileState.FAILED) {
      const details = file.error ? JSON.stringify(file.error) : "Unknown error";
      throw new Error(`Gemini file processing failed: ${details}`);
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error(
        `Timeout waiting for Gemini file to be ACTIVE. State: ${file.state}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

export async function analyzeDrillVideo(input: {
  filePath: string;
  fileName: string;
  drillType: DrillType;
}) {
  const ai = getGeminiClient();
  const model =
    input.drillType === "wall_ball" ? fallbackModel : defaultModel;
  const bucket = adminStorage.bucket();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "scout-video-"));
  const tmpPath = path.join(tmpDir, input.fileName);

  try {
    await withRetry("Download from storage", () =>
      bucket.file(input.filePath).download({ destination: tmpPath })
    );
    const file = await withRetry("Gemini file upload", () =>
      ai.files.upload({
        file: tmpPath,
        config: { mimeType: resolveMimeType(input.fileName) },
      })
    );

    if (!file.name) {
      throw new Error("Gemini upload did not return a file name.");
    }
    const activeFile = await waitForFileActive(file.name);
    if (!activeFile.uri) {
      throw new Error("Gemini upload did not return a file URI.");
    }
    const fileUri = activeFile.uri;

    const response = await withRetry("Gemini generateContent", () =>
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? model,
        contents: createUserContent([
          createPartFromUri(
            fileUri,
            activeFile.mimeType ?? resolveMimeType(input.fileName)
          ),
          buildPrompt(input.drillType),
        ]),
      })
    );

    const text = response.text ?? "";
    return parseAnalysis(text);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
