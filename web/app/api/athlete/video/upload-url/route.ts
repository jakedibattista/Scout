import { adminStorage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const allowedDrills = new Set(["wall_ball", "dash_20", "shuttle_5_10_5"]);

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatUploadError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Could not load the default credentials")) {
      return "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.";
    }
    if (message.includes("does not exist") || message.includes("Not Found")) {
      return "Storage bucket not found. Verify FIREBASE_STORAGE_BUCKET.";
    }
    return message;
  }
  return "Unable to create upload URL.";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const drillType = String(payload?.drillType ?? "");
    const fileName = String(payload?.fileName ?? "");
    const contentType = String(payload?.contentType ?? "");
    const athleteId = String(payload?.athleteId ?? "unknown");

    if (!allowedDrills.has(drillType)) {
      return Response.json(
        { ok: false, error: "Invalid drill type." },
        { status: 400 }
      );
    }

    if (!fileName) {
      return Response.json(
        { ok: false, error: "File name is required." },
        { status: 400 }
      );
    }

    const safeFileName = sanitizeSegment(fileName);
    const safeAthleteId = sanitizeSegment(athleteId || "unknown");
    const filePath = `athletes/${safeAthleteId}/videos/${drillType}/${Date.now()}-${safeFileName}`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filePath);
    const resolvedContentType =
      contentType && contentType !== "application/octet-stream"
        ? contentType
        : "application/octet-stream";
    const [uploadUrl] = await fileRef.getSignedUrl({
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: resolvedContentType,
    });

    return Response.json({
      ok: true,
      uploadUrl,
      filePath,
      bucket: bucket.name,
      contentType: resolvedContentType,
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: formatUploadError(error) },
      { status: 500 }
    );
  }
}
