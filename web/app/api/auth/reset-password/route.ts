import { createHash } from "crypto";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";

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

  const { token, password } = body;

  if (!token || !password) {
    return Response.json(
      { ok: false, error: "Missing token or password." },
      { status: 400 }
    );
  }

  if (String(password).length < 8) {
    return Response.json(
      { ok: false, error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const tokenHash = createHash("sha256")
      .update(String(token))
      .digest("hex");
    const userSnapshot = await adminDb
      .collection("users")
      .where("passwordReset.tokenHash", "==", tokenHash)
      .limit(1)
      .get();
    const userDoc = userSnapshot.docs[0];

    if (!userDoc) {
      return Response.json(
        { ok: false, error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const data = userDoc.data();
    const expiresAtMs = Number(data?.passwordReset?.expiresAtMs ?? 0);
    if (!expiresAtMs || Date.now() > expiresAtMs) {
      return Response.json(
        { ok: false, error: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const passwordHash = createHash("sha256")
      .update(String(password))
      .digest("hex");

    await adminDb
      .collection("users")
      .doc(userDoc.id)
      .set(
        {
          passwordHash,
          passwordReset: adminFieldValue.delete(),
        },
        { merge: true }
      );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/reset-password failed", error);
    return Response.json(
      { ok: false, error: "Unable to reset password right now." },
      { status: 500 }
    );
  }
}
