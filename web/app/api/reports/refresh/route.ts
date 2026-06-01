import { loadAthleteContext } from "@/lib/athleteContext";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

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

  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "scout" && session.username !== athleteId) {
    return forbidden();
  }

  try {
    // Load shared context once, then run both report generators in parallel.
    const context = await loadAthleteContext(athleteId);
    await Promise.all([
      buildAndStoreCoachingReport(athleteId, context),
      buildAndStoreScoutReport(athleteId, context),
    ]);

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed.";
    const status = message.includes("not found") ? 404 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}
