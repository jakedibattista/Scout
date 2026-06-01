import { adminDb } from "@/lib/firebaseAdmin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, type Role } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let identifier = "";
  let password = "";
  try {
    const body = await request.json();
    identifier = body?.identifier;
    password = body?.password;
  } catch {
    return Response.json(
      { ok: false, error: "Unable to process login right now." },
      { status: 500 }
    );
  }

  if (!identifier || !password) {
    return Response.json(
      { ok: false, error: "Missing credentials." },
      { status: 400 }
    );
  }

  try {
    let userRef = adminDb.collection("users").doc(String(identifier));
    let userSnap = await userRef.get();

    if (!userSnap.exists && String(identifier).includes("@")) {
      const byEmail = await adminDb
        .collection("users")
        .where("email", "==", identifier)
        .limit(1)
        .get();
      if (!byEmail.empty) {
        userSnap = byEmail.docs[0];
        userRef = userSnap.ref;
      }
    }

    if (!userSnap.exists) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const data = userSnap.data() ?? {};
    const { valid, needsRehash } = verifyPassword(
      String(password),
      data.passwordHash
    );

    if (!valid) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Transparently upgrade legacy SHA-256 hashes to scrypt on successful login.
    if (needsRehash) {
      await userRef.set(
        { passwordHash: hashPassword(String(password)) },
        { merge: true }
      );
    }

    const role: Role = data.role === "scout" ? "scout" : "athlete";
    await createSession(String(data.username ?? userSnap.id), role);

    return Response.json({
      ok: true,
      user: { username: data.username, role: data.role, email: data.email },
    });
  } catch {
    return Response.json(
      { ok: false, error: "Login failed." },
      { status: 500 }
    );
  }
}
