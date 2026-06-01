import { adminDb } from "@/lib/firebaseAdmin";

export type AthleteEvent = {
  eventName: string;
  summary: string;
  url: string;
};

export type AthleteDrill = {
  drillType: string;
  analysisNotes: string | null;
  analysisMetrics: Record<string, string | number>;
  uploadDate: string | null;
};

export type AthleteContext = {
  profile: Record<string, unknown>;
  events: AthleteEvent[];
  drills: AthleteDrill[];
};

/**
 * Load an athlete's profile, events, and drills in one place.
 *
 * The events and videos queries run in parallel, and the report builders share
 * this loader so a single refresh does not read the same data twice.
 */
export async function loadAthleteContext(
  athleteId: string
): Promise<AthleteContext> {
  const profileSnap = await adminDb
    .collection("athleteProfiles")
    .doc(athleteId)
    .get();
  if (!profileSnap.exists) {
    throw new Error("Athlete profile not found.");
  }
  const profile = profileSnap.data() ?? {};

  const [eventsSnap, videosSnap] = await Promise.all([
    adminDb
      .collection("events")
      .where("athleteId", "==", athleteId)
      .orderBy("updatedAt", "desc")
      .get()
      .catch(async () =>
        adminDb.collection("events").where("athleteId", "==", athleteId).get()
      ),
    adminDb
      .collection("videos")
      .where("athleteId", "==", athleteId)
      .orderBy("uploadDate", "desc")
      .get()
      .catch(async () =>
        adminDb.collection("videos").where("athleteId", "==", athleteId).get()
      ),
  ]);

  const events: AthleteEvent[] = eventsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      eventName: data.eventName ?? "",
      summary: data.summary ?? data.notes ?? "",
      url: data.url ?? "",
    };
  });

  const drills: AthleteDrill[] = videosSnap.docs.map((doc) => {
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

  return { profile, events, drills };
}
