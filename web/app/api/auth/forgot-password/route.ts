import { createHash, randomBytes } from "crypto";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";

function buildResetUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000";
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

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

  const { identifier } = body;

  if (!identifier) {
    return Response.json(
      { ok: false, error: "Missing identifier." },
      { status: 400 }
    );
  }

  try {
    let userDocId: string | null = null;

    if (String(identifier).includes("@")) {
      const snapshot = await adminDb
        .collection("users")
        .where("email", "==", String(identifier))
        .limit(1)
        .get();
      userDocId = snapshot.docs[0]?.id ?? null;
    } else {
      const snapshot = await adminDb
        .collection("users")
        .doc(String(identifier))
        .get();
      userDocId = snapshot.exists ? snapshot.id : null;
    }

    if (!userDocId) {
      return Response.json({
        ok: true,
        message:
          "If an account exists for that identifier, a reset link has been generated.",
      });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAtMs = Date.now() + 30 * 60 * 1000;

    await adminDb
      .collection("users")
      .doc(userDocId)
      .set(
        {
          passwordReset: {
            tokenHash,
            expiresAtMs,
            requestedAt: adminFieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

    const resetUrl = buildResetUrl(rawToken);

    return Response.json({
      ok: true,
      message:
        "If an account exists for that identifier, a reset link has been generated.",
      ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password failed", error);
    return Response.json(
      { ok: false, error: "Unable to process request right now." },
      { status: 500 }
    );
  }
}
