import { createHash } from "crypto";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildAndStoreResearchEvents } from "@/lib/athleteResearch";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { username, password, ...profile } = payload;

    if (!username) {
      return Response.json(
        { ok: false, error: "Missing username." },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", String(username));
    const existingUser = await getDoc(userRef);
    if (!password && !existingUser.exists()) {
      return Response.json(
        { ok: false, error: "Password required to create account." },
        { status: 400 }
      );
    }

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = createHash("sha256")
        .update(String(password))
        .digest("hex");
      if (existingUser.exists()) {
        const existingData = existingUser.data();
        if (existingData?.passwordHash !== passwordHash) {
          return Response.json(
            { ok: false, error: "Username is already taken." },
            { status: 409 }
          );
        }
      }
    }

    await setDoc(
      userRef,
      {
        username: String(username),
        email: String(profile.email ?? ""),
        role: "athlete",
        ...(passwordHash ? { passwordHash } : {}),
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

    if (!existingUser.exists()) {
      void buildAndStoreResearchEvents(String(username), {
        name: String(profile.name ?? ""),
        gradYear: String(profile.gradYear ?? ""),
        sport: String(profile.sport ?? ""),
      }).catch((error) => {
        console.error("Research agent failed:", error);
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
