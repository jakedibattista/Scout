import { createHash } from "crypto";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { username, password, ...profile } = payload;

    if (!username || !password) {
      return Response.json(
        { ok: false, error: "Missing username or password." },
        { status: 400 }
      );
    }

    const passwordHash = createHash("sha256")
      .update(String(password))
      .digest("hex");

    await setDoc(
      doc(db, "users", String(username)),
      {
        username: String(username),
        email: String(profile.email ?? ""),
        role: "athlete",
        passwordHash,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "athleteProfiles", String(username)),
      {
        ...profile,
        username: String(username),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
