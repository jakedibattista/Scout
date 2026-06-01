import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { loadAthleteContext, type AthleteContext } from "@/lib/athleteContext";
import { generateCoachingGuidance } from "@/lib/gemini/agents/coaching";

export async function buildAndStoreCoachingReport(
  athleteId: string,
  context?: AthleteContext
) {
  const { profile, events, drills } =
    context ?? (await loadAthleteContext(athleteId));

  const coaching = await generateCoachingGuidance({
    athleteProfile: profile,
    events,
    drills,
  });

  // Upsert a single "coach" report per athlete instead of appending duplicates.
  await adminDb
    .collection("reports")
    .doc(`${athleteId}_coach`)
    .set(
      {
        athleteId,
        type: "coach",
        summary: coaching.summary,
        strengths: coaching.focusAreas,
        weaknesses: [],
        metrics: { trend: coaching.trend },
        nextSteps: coaching.nextSteps,
        createdAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return coaching;
}
