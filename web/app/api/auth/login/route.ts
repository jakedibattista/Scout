import { createHash } from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const { identifier, password } = body;
  if (!identifier || !password) {
    return Response.json(
      { ok: false, error: "Missing credentials." },
      { status: 400 }
    );
  }

  try {
    let data: FirebaseFirestore.DocumentData | undefined;

    if (String(identifier).includes("@")) {
      const snapshot = await adminDb
        .collection("users")
        .where("email", "==", String(identifier))
        .limit(1)
        .get();
      data = snapshot.docs[0]?.data();
    } else {
      const snapshot = await adminDb
        .collection("users")
        .doc(String(identifier))
        .get();
      data = snapshot.exists ? snapshot.data() : undefined;
    }

    if (!data) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const passwordHash = createHash("sha256")
      .update(String(password))
      .digest("hex");

    if (data.passwordHash !== passwordHash) {
      return Response.json(
        { ok: false, error: "Invalid credentials." },
        { status: 401 }
      );
    }

    return Response.json({
      ok: true,
      user: { username: data.username, role: data.role, email: data.email },
    });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return Response.json(
      { ok: false, error: "Unable to process login right now." },
      { status: 500 }
    );
  }
}
