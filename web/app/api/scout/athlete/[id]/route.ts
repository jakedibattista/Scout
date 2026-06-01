import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { SIGNED_URL_TTL_MS } from "@/lib/config";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export const runtime = "nodejs";

function toPlainDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(request: Request, context: RouteContext) {
  const resolvedParams =
    typeof (context.params as Promise<{ id: string }>).then === "function"
      ? await (context.params as Promise<{ id: string }>)
      : (context.params as { id: string });
  const athleteId = decodeURIComponent(resolvedParams.id);

  const session = await getSession();
  if (!session) return unauthorized();
  // Scouts may browse any athlete; an athlete may view their own page.
  if (session.role !== "scout" && session.username !== athleteId) {
    return forbidden();
  }

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
    const [videosSnapshot, reportsSnapshot] = await Promise.all([
      adminDb.collection("videos").where("athleteId", "==", athleteId).get(),
      adminDb.collection("reports").where("athleteId", "==", athleteId).get(),
    ]);

    const bucket = adminStorage.bucket();
    const videos = await Promise.all(
      videosSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const filePath = data.filePath as string | undefined;
        let viewUrl: string | null = null;
        if (filePath) {
          const [signedUrl] = await bucket.file(filePath).getSignedUrl({
            action: "read",
            expires: Date.now() + SIGNED_URL_TTL_MS,
          });
          viewUrl = signedUrl;
        }

        const uploadDate =
          typeof data.uploadDate?.toDate === "function"
            ? data.uploadDate.toDate().toISOString()
            : toPlainDate(data.uploadDate);
        const createdAt =
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : toPlainDate(data.createdAt);

        return {
          id: doc.id,
          drillType: data.drillType ?? "",
          fileName: data.fileName ?? "",
          status: data.status ?? "uploaded",
          analysisStatus: data.analysisStatus ?? "pending",
          analysisNotes: data.analysisNotes ?? null,
          analysisMetrics: data.analysisMetrics ?? {},
          uploadDate,
          createdAt,
          viewUrl,
        };
      })
    );
    const reports = reportsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type ?? "",
        summary: data.summary ?? "",
        strengths: data.strengths ?? [],
        weaknesses: data.weaknesses ?? [],
        createdAt:
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : toPlainDate(data.createdAt),
      };
    });

    return Response.json({
      ok: true,
      athlete: {
        id: athleteId,
        name: profile.name ?? athleteId,
        email: profile.email ?? "",
        state: profile.state ?? "",
      },
      profile,
      reports,
      videos,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to load athlete." },
      { status: 500 }
    );
  }
}
