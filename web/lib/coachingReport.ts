import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { generateCoachingGuidance } from "@/lib/gemini/agents/coaching";

export async function buildAndStoreCoachingReport(athleteId: string) {
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

  const coaching = await generateCoachingGuidance({
    athleteProfile: profile,
    events,
    drills,
  });

  await adminDb.collection("reports").add({
    athleteId,
    type: "coach",
    summary: coaching.summary,
    strengths: coaching.focusAreas,
    weaknesses: [],
    metrics: { trend: coaching.trend },
    nextSteps: coaching.nextSteps,
    createdAt: adminFieldValue.serverTimestamp(),
  });

  return coaching;
}
