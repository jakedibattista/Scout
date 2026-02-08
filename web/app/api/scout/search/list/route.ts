import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scoutUsername = String(searchParams.get("scoutUsername") ?? "");

  if (!scoutUsername) {
    return Response.json(
      { ok: false, error: "Missing scout username." },
      { status: 400 }
    );
  }

  try {
    let snapshot;
    try {
      snapshot = await adminDb
        .collection("savedSearches")
        .where("scoutId", "==", scoutUsername)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
    } catch (error) {
      snapshot = await adminDb
        .collection("savedSearches")
        .where("scoutId", "==", scoutUsername)
        .limit(20)
        .get();
    }

    const searches = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        query: doc.data().query,
        filters: doc.data().filters ?? null,
      }))
      .filter((item) => Boolean(item.query));

    return Response.json({ ok: true, searches });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to load searches." },
      { status: 500 }
    );
  }
}
