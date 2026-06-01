import { adminDb, adminFieldValue, adminStorage } from "@/lib/firebaseAdmin";
import { isDrillType } from "@/lib/drills";
import { SIGNED_URL_TTL_MS } from "@/lib/config";
import { getSession, unauthorized } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const payload = await request.json();
    const drillType = String(payload?.drillType ?? "");
    const filePath = String(payload?.filePath ?? "");
    const fileName = String(payload?.fileName ?? "");
    // Identity comes from the session, never from the client body.
    const athleteId = session.username;

    if (!isDrillType(drillType)) {
      return Response.json(
        { ok: false, error: "Invalid drill type." },
        { status: 400 }
      );
    }

    if (!filePath) {
      return Response.json(
        { ok: false, error: "File path is required." },
        { status: 400 }
      );
    }

    const bucket = adminStorage.bucket();
    const fileUrl = `gs://${bucket.name}/${filePath}`;
    let viewUrl: string | null = null;

    const docRef = await adminDb.collection("videos").add({
      athleteId,
      drillType,
      fileName,
      filePath,
      fileUrl,
      status: "uploaded",
      analysisStatus: "pending",
      analysisNotes: null,
      analysisMetrics: {},
      createdAt: adminFieldValue.serverTimestamp(),
      uploadDate: adminFieldValue.serverTimestamp(),
    });

    try {
      const [signedUrl] = await bucket.file(filePath).getSignedUrl({
        action: "read",
        expires: Date.now() + SIGNED_URL_TTL_MS,
      });
      viewUrl = signedUrl;
    } catch (error) {
      viewUrl = null;
    }

    return Response.json({
      ok: true,
      status: "uploaded",
      videoId: docRef.id,
      fileUrl,
      viewUrl,
      analysisStatus: "pending",
      analysisNotes: null,
      analysisMetrics: {},
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Unable to complete upload." },
      { status: 500 }
    );
  }
}
