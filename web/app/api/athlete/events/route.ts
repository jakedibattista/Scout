import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = String(searchParams.get("athleteId") ?? "");

  if (!athleteId) {
    return Response.json(
      { ok: false, error: "Missing athleteId." },
      { status: 400 }
    );
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
  try {
    const payload = await request.json();
    if (!payload?.athleteId || !payload?.url || !payload?.eventName) {
      return Response.json(
        { ok: false, error: "Missing athleteId, eventName, or url." },
        { status: 400 }
      );
    }

    await adminDb.collection("events").add({
      athleteId: String(payload.athleteId),
      eventName: String(payload.eventName),
      url: String(payload.url),
      summary: String(payload.summary ?? ""),
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    });
    void buildAndStoreCoachingReport(String(payload.athleteId)).catch((error) =>
      console.error("Coaching report failed:", error)
    );
    void buildAndStoreScoutReport(String(payload.athleteId)).catch((error) =>
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
  try {
    const payload = await request.json();
    const id = String(payload?.id ?? "");
    if (!id) {
      return Response.json({ ok: false, error: "Missing event id." }, { status: 400 });
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
    if (payload?.athleteId) {
      void buildAndStoreCoachingReport(String(payload.athleteId)).catch(
        (error) => console.error("Coaching report failed:", error)
      );
      void buildAndStoreScoutReport(String(payload.athleteId)).catch((error) =>
        console.error("Scout report failed:", error)
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to update event." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    const id = String(payload?.id ?? "");
    if (!id) {
      return Response.json(
        { ok: false, error: "Missing event id." },
        { status: 400 }
      );
    }

    await adminDb.collection("events").doc(id).delete();
    if (payload?.athleteId) {
      void buildAndStoreCoachingReport(String(payload.athleteId)).catch(
        (error) => console.error("Coaching report failed:", error)
      );
      void buildAndStoreScoutReport(String(payload.athleteId)).catch((error) =>
        console.error("Scout report failed:", error)
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to delete event." },
      { status: 500 }
    );
  }
}
