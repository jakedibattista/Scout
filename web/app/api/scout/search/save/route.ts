import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const query = String(payload?.query ?? "").trim();
    const scoutUsername = String(payload?.scoutUsername ?? "");

    if (!query || !scoutUsername) {
      return Response.json(
        { ok: false, error: "Missing query or scout username." },
        { status: 400 }
      );
    }

    await adminDb.collection("savedSearches").add({
      scoutId: scoutUsername,
      query,
      notifyEmail: Boolean(payload?.notifyEmail),
      createdAt: adminFieldValue.serverTimestamp(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to save search." },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return Response.json({
      ok: true,
      savedSearchId: "search_placeholder",
      payload,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
