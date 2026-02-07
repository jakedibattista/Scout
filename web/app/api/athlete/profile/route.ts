import { createHash } from "crypto";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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

    const userRef = doc(db, "users", String(username));
    const existingUser = await getDoc(userRef);
    if (existingUser.exists()) {
      const existingData = existingUser.data();
      if (existingData?.passwordHash !== passwordHash) {
        return Response.json(
          { ok: false, error: "Username is already taken." },
          { status: 409 }
        );
      }
    }

    await setDoc(
      userRef,
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
