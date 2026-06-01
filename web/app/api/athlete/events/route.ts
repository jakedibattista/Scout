import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

export const runtime = "nodejs";

async function loadEventOwner(id: string): Promise<string | null> {
  const snap = await adminDb.collection("events").doc(id).get();
  if (!snap.exists) return null;
  return String(snap.data()?.athleteId ?? "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = String(searchParams.get("athleteId") ?? "");

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

  try {
    let snapshot;
    try {
      snapshot = await adminDb
        .collection("events")
        .where("athleteId", "==", athleteId)
        .orderBy("createdAt", "desc")
        .get();
    } catch (error) {
      snapshot = await adminDb
        .collection("events")
        .where("athleteId", "==", athleteId)
        .get();
    }

    const events = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eventName: data.eventName ?? "",
        url: data.url ?? "",
        summary: data.summary ?? data.notes ?? "",
        createdAt:
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate().toISOString()
            : null,
      };
    });

    return Response.json({ ok: true, events });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to load events." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const payload = await request.json();
    if (!payload?.url || !payload?.eventName) {
      return Response.json(
        { ok: false, error: "Missing eventName or url." },
        { status: 400 }
      );
    }

    // Events are always created for the authenticated athlete.
    const athleteId = session.username;

    await adminDb.collection("events").add({
      athleteId,
      eventName: String(payload.eventName),
      url: String(payload.url),
      summary: String(payload.summary ?? ""),
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    });
    void buildAndStoreCoachingReport(athleteId).catch((error) =>
      console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(athleteId).catch((error) =>
      console.error("Scout report failed:", error)
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const payload = await request.json();
    const id = String(payload?.id ?? "");
    if (!id) {
      return Response.json({ ok: false, error: "Missing event id." }, { status: 400 });
    }

    const owner = await loadEventOwner(id);
    if (owner === null) {
      return Response.json({ ok: false, error: "Event not found." }, { status: 404 });
    }
    if (owner !== session.username) {
      return forbidden();
    }

    await adminDb.collection("events").doc(id).set(
      {
        eventName: String(payload?.eventName ?? ""),
        url: String(payload?.url ?? ""),
        summary: String(payload?.summary ?? ""),
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    void buildAndStoreCoachingReport(session.username).catch((error) =>
      console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(session.username).catch((error) =>
      console.error("Scout report failed:", error)
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to update event." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const payload = await request.json();
    const id = String(payload?.id ?? "");
    if (!id) {
      return Response.json(
        { ok: false, error: "Missing event id." },
        { status: 400 }
      );
    }

    const owner = await loadEventOwner(id);
    if (owner === null) {
      return Response.json({ ok: false, error: "Event not found." }, { status: 404 });
    }
    if (owner !== session.username) {
      return forbidden();
    }

    await adminDb.collection("events").doc(id).delete();
    void buildAndStoreCoachingReport(session.username).catch((error) =>
      console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(session.username).catch((error) =>
      console.error("Scout report failed:", error)
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to delete event." },
      { status: 500 }
    );
  }
}
