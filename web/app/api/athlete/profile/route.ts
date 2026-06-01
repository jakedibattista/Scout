import { upsertProfile } from "@/lib/auth/profileUpsert";
import { buildAndStoreResearchEvents } from "@/lib/athleteResearch";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Unable to save athlete profile right now." },
      { status: 500 }
    );
  }

  const { username, password, ...profile } = payload as {
    username?: string;
    password?: string;
    [key: string]: unknown;
  };

  const result = await upsertProfile({
    role: "athlete",
    username: String(username ?? ""),
    password: password ? String(password) : undefined,
    email: profile.email ? String(profile.email) : "",
    profile,
    profileCollection: "athleteProfiles",
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  if (result.created) {
    const athleteId = String(username);
    void buildAndStoreResearchEvents(athleteId, {
      name: String(profile.name ?? ""),
      gradYear: String(profile.gradYear ?? ""),
      sport: String(profile.sport ?? ""),
    }).catch((error) => console.error("Research agent failed:", error));
    void buildAndStoreCoachingReport(athleteId).catch((error) =>
      console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(athleteId).catch((error) =>
      console.error("Scout report failed:", error)
    );
  }

  return Response.json({ ok: true });
}
