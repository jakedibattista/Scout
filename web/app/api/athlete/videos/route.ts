import { adminDb, adminStorage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = String(searchParams.get("athleteId") ?? "");

  if (!athleteId) {
    return Response.json(
      { ok: false, error: "athleteId is required." },
      { status: 400 }
    );
  }

  try {
    const snapshot = await adminDb
      .collection("videos")
      .where("athleteId", "==", athleteId)
      .get();

    const bucket = adminStorage.bucket();
    const videos = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const filePath = data.filePath as string | undefined;
        let viewUrl: string | null = null;
        if (filePath) {
          try {
            const [signedUrl] = await bucket.file(filePath).getSignedUrl({
              action: "read",
              expires: Date.now() + 15 * 60 * 1000,
            });
            viewUrl = signedUrl;
          } catch (error) {
            viewUrl = null;
          }
        }

        const uploadDate =
          typeof data.uploadDate?.toDate === "function"
            ? data.uploadDate.toDate().toISOString()
            : null;
        const createdAt =
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : null;

        return {
          id: doc.id,
          drillType: data.drillType ?? "",
          fileName: data.fileName ?? "",
          analysisStatus: data.analysisStatus ?? "pending",
          analysisNotes: data.analysisNotes ?? null,
          analysisMetrics: data.analysisMetrics ?? {},
          uploadDate,
          createdAt,
          viewUrl,
        };
      })
    );

    const sorted = videos.sort((a, b) => {
      const aDate = a.uploadDate || a.createdAt || "";
      const bDate = b.uploadDate || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });

    return Response.json({ ok: true, videos: sorted });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to load videos." },
      { status: 500 }
    );
  }
}
