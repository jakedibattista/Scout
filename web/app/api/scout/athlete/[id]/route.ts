import { adminDb, adminStorage } from "@/lib/firebaseAdmin";

type RouteContext = {
  params: { id: string };
};

export const runtime = "nodejs";

function toPlainDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(request: Request, context: RouteContext) {
  const athleteId = context.params.id;

  try {
    const profileRef = adminDb.collection("athleteProfiles").doc(athleteId);
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      return Response.json(
        { ok: false, error: "Athlete not found." },
        { status: 404 }
      );
    }

    const profile = profileSnap.data() ?? {};
    const videosSnapshot = await adminDb
      .collection("videos")
      .where("athleteId", "==", athleteId)
      .get();

    const bucket = adminStorage.bucket();
    const videos = await Promise.all(
      videosSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const filePath = data.filePath as string | undefined;
        let viewUrl: string | null = null;
        if (filePath) {
          const [signedUrl] = await bucket.file(filePath).getSignedUrl({
            action: "read",
            expires: Date.now() + 15 * 60 * 1000,
          });
          viewUrl = signedUrl;
        }

        const uploadDate =
          typeof data.uploadDate?.toDate === "function"
            ? data.uploadDate.toDate().toISOString()
            : toPlainDate(data.uploadDate);

        return {
          id: doc.id,
          drillType: data.drillType ?? "",
          fileName: data.fileName ?? "",
          status: data.status ?? "uploaded",
          analysisStatus: data.analysisStatus ?? "pending",
          analysisNotes: data.analysisNotes ?? null,
          analysisMetrics: data.analysisMetrics ?? {},
          uploadDate,
          viewUrl,
        };
      })
    );

    return Response.json({
      ok: true,
      athlete: {
        id: athleteId,
        name: profile.name ?? athleteId,
        email: profile.email ?? "",
        state: profile.state ?? "",
      },
      profile,
      videos,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to load athlete." },
      { status: 500 }
    );
  }
}
