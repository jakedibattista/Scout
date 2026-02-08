import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { generateScoutReport } from "@/lib/gemini/agents/scoutReport";

export async function buildAndStoreScoutReport(athleteId: string) {
  const profileSnap = await adminDb
    .collection("athleteProfiles")
    .doc(athleteId)
    .get();
  if (!profileSnap.exists) {
    throw new Error("Athlete profile not found.");
  }

  const profile = profileSnap.data() ?? {};
  const eventsSnap = await adminDb
    .collection("events")
    .where("athleteId", "==", athleteId)
    .orderBy("updatedAt", "desc")
    .get()
    .catch(async () =>
      adminDb.collection("events").where("athleteId", "==", athleteId).get()
    );

  const events = eventsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      eventName: data.eventName ?? "",
      summary: data.summary ?? data.notes ?? "",
      url: data.url ?? "",
    };
  });

  const videosSnap = await adminDb
    .collection("videos")
    .where("athleteId", "==", athleteId)
    .orderBy("uploadDate", "desc")
    .get()
    .catch(async () =>
      adminDb.collection("videos").where("athleteId", "==", athleteId).get()
    );

  const drills = videosSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      drillType: data.drillType ?? "",
      analysisNotes: data.analysisNotes ?? null,
      analysisMetrics: data.analysisMetrics ?? {},
      uploadDate:
        typeof data.uploadDate?.toDate === "function"
          ? data.uploadDate.toDate().toISOString()
          : null,
    };
  });

  const report = await generateScoutReport({
    athleteProfile: profile,
    events,
    drills,
  });

  await adminDb.collection("reports").add({
    athleteId,
    type: "scout",
    summary: report.summary,
    strengths: report.keyTraits,
    weaknesses: report.weaknesses,
    metrics: {},
    createdAt: adminFieldValue.serverTimestamp(),
  });

  return report;
}
