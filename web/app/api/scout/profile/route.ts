import { createHash } from "crypto";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { username, password, ...profile } = payload;

    if (!username) {
      return Response.json(
        { ok: false, error: "Missing username." },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(String(username));
    const existingUser = await userRef.get();
    if (!password && !existingUser.exists) {
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
      if (existingUser.exists) {
        const existingData = existingUser.data();
        if (existingData?.passwordHash !== passwordHash) {
          return Response.json(
            { ok: false, error: "Username is already taken." },
            { status: 409 }
          );
        }
      }
    }

    await userRef.set(
      {
        username: String(username),
        email: String(profile.email ?? ""),
        role: "scout",
        ...(passwordHash ? { passwordHash } : {}),
        createdAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await adminDb
      .collection("scoutProfiles")
      .doc(String(username))
      .set(
        {
          ...profile,
          username: String(username),
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/scout/profile failed", error);
    return Response.json(
      { ok: false, error: "Unable to save scout profile right now." },
      { status: 500 }
    );
  }
}
