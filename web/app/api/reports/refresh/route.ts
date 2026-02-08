import { adminDb } from "@/lib/firebaseAdmin";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const athleteId = String(payload?.athleteId ?? "").trim();

  if (!athleteId) {
    return Response.json(
      { ok: false, error: "athleteId is required." },
      { status: 400 }
    );
  }

  const profileSnap = await adminDb
    .collection("athleteProfiles")
    .doc(athleteId)
    .get();
  if (!profileSnap.exists) {
    return Response.json(
      { ok: false, error: "Athlete profile not found." },
      { status: 404 }
    );
  }

  try {
    await Promise.all([
      buildAndStoreCoachingReport(athleteId),
      buildAndStoreScoutReport(athleteId),
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
