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

    const existing = await adminDb
      .collection("savedSearches")
      .where("scoutId", "==", scoutUsername)
      .where("query", "==", query)
      .limit(1)
      .get();

    if (existing.empty) {
      await adminDb.collection("savedSearches").add({
        scoutId: scoutUsername,
        query,
        notifyEmail: Boolean(payload?.notifyEmail),
        filters: payload?.filters ?? null,
        createdAt: adminFieldValue.serverTimestamp(),
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to save search." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    const id = String(payload?.id ?? "").trim();
    const scoutUsername = String(payload?.scoutUsername ?? "");

    if (!id || !scoutUsername) {
      return Response.json(
        { ok: false, error: "Missing search id or scout username." },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("savedSearches").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists || docSnap.data()?.scoutId !== scoutUsername) {
      return Response.json(
        { ok: false, error: "Search not found." },
        { status: 404 }
      );
    }

    await docRef.delete();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to remove search." },
      { status: 500 }
    );
  }
}
