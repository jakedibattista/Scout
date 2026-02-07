import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload?.athleteId || !payload?.url) {
      return Response.json(
        { ok: false, error: "Missing athleteId or url." },
        { status: 400 }
      );
    }

    await addDoc(collection(db, "events"), {
      athleteId: String(payload.athleteId),
      url: String(payload.url),
      notes: String(payload.notes ?? ""),
      createdAt: serverTimestamp(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
