import { adminDb } from "@/lib/firebaseAdmin";
import { buildAndStoreResearchEvents } from "@/lib/athleteResearch";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const athleteId = String(payload?.athleteId ?? "").trim();
    if (!athleteId) {
      return Response.json(
        { ok: false, error: "Missing athleteId." },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== "scout" && session.username !== athleteId) {
      return forbidden();
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

    const profile = profileSnap.data() ?? {};
    const result = await buildAndStoreResearchEvents(
      athleteId,
      {
        name: String(profile.name ?? ""),
        gradYear: String(profile.gradYear ?? ""),
        sport: String(profile.sport ?? ""),
      },
      { force: true }
    );

    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.reason ?? "Research failed." },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      added: result.added ?? 0,
      reason: result.reason ?? "",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Research request failed.",
      },
      { status: 400 }
    );
  }
}
