import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { loadAthleteContext, type AthleteContext } from "@/lib/athleteContext";
import { generateScoutReport } from "@/lib/gemini/agents/scoutReport";

export async function buildAndStoreScoutReport(
  athleteId: string,
  context?: AthleteContext
) {
  const { profile, events, drills } =
    context ?? (await loadAthleteContext(athleteId));

  const report = await generateScoutReport({
    athleteProfile: profile,
    events,
    drills,
  });

  // Upsert a single "scout" report per athlete instead of appending duplicates.
  await adminDb
    .collection("reports")
    .doc(`${athleteId}_scout`)
    .set(
      {
        athleteId,
        type: "scout",
        summary: report.summary,
        strengths: report.keyTraits,
        weaknesses: report.weaknesses,
        metrics: {},
        createdAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return report;
}
