import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { analyzeDrillVideo } from "@/lib/gemini";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const videoId = String(payload?.videoId ?? "");

  if (!videoId) {
    return Response.json(
      { ok: false, error: "videoId is required." },
      { status: 400 }
    );
  }

  const videoRef = adminDb.collection("videos").doc(videoId);

  try {
    const videoSnap = await videoRef.get();
    if (!videoSnap.exists) {
      return Response.json(
        { ok: false, error: "Video not found." },
        { status: 404 }
      );
    }

    const data = videoSnap.data() ?? {};
    const drillType = data.drillType as
      | "wall_ball"
      | "dash_20"
      | "shuttle_5_10_5";
    const filePath = String(data.filePath ?? "");
    const fileName = String(data.fileName ?? "video.mp4");

    if (!filePath || !drillType) {
      return Response.json(
        { ok: false, error: "Missing video data." },
        { status: 400 }
      );
    }

    await videoRef.set(
      {
        analysisStatus: "running",
        analysisNotes: null,
        analysisMetrics: {},
        analysisUpdatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const analysis = await analyzeDrillVideo({
      filePath,
      fileName,
      drillType,
    });

    await videoRef.set(
      {
        analysisStatus: "ready",
        analysisNotes: analysis.notes,
        analysisMetrics: analysis.metrics,
        analysisUpdatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    void buildAndStoreCoachingReport(String(data.athleteId ?? "")).catch(
      (error) => console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(String(data.athleteId ?? "")).catch((error) =>
      console.error("Scout report failed:", error)
    );

    return Response.json({ ok: true, analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to analyze video.";

    await videoRef.set(
      {
        analysisStatus: "failed",
        analysisError: message,
        analysisUpdatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
