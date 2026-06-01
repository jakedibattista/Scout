import { upsertProfile } from "@/lib/auth/profileUpsert";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Unable to save scout profile right now." },
      { status: 500 }
    );
  }

  const { username, password, ...profile } = payload as {
    username?: string;
    password?: string;
    [key: string]: unknown;
  };

  const result = await upsertProfile({
    role: "scout",
    username: String(username ?? ""),
    password: password ? String(password) : undefined,
    email: profile.email ? String(profile.email) : "",
    profile,
    profileCollection: "scoutProfiles",
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  return Response.json({ ok: true });
}
