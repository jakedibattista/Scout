import { createHash } from "crypto";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { buildAndStoreResearchEvents } from "@/lib/athleteResearch";
import { buildAndStoreCoachingReport } from "@/lib/coachingReport";
import { buildAndStoreScoutReport } from "@/lib/scoutReport";

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
        role: "athlete",
        ...(passwordHash ? { passwordHash } : {}),
        createdAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await adminDb
      .collection("athleteProfiles")
      .doc(String(username))
      .set(
        {
          ...profile,
          username: String(username),
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    if (!existingUser.exists) {
      void buildAndStoreResearchEvents(String(username), {
        name: String(profile.name ?? ""),
        gradYear: String(profile.gradYear ?? ""),
        sport: String(profile.sport ?? ""),
      }).catch((error) => {
        console.error("Research agent failed:", error);
      });
      void buildAndStoreCoachingReport(String(username)).catch((error) => {
        console.error("Coaching report failed:", error);
      });
      void buildAndStoreScoutReport(String(username)).catch((error) => {
        console.error("Scout report failed:", error);
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/athlete/profile failed", error);
    return Response.json(
      { ok: false, error: "Unable to save athlete profile right now." },
      { status: 500 }
    );
  }
}
