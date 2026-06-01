import { adminDb } from "@/lib/firebaseAdmin";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "scout") return forbidden();

  const scoutUsername = session.username;

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
