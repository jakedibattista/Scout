import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import {
  AthleteResearchEvent,
  generateAthleteResearch,
} from "@/lib/gemini/agents/athleteResearch";

type ResearchProfile = {
  name?: string;
  gradYear?: string;
  sport?: string;
};

function buildQuery(profile: ResearchProfile) {
  const name = String(profile.name ?? "").trim();
  const gradYear = String(profile.gradYear ?? "").trim();
  const sport = String(profile.sport ?? "lacrosse").trim();
  const terms = [name, gradYear, sport].filter(Boolean);
  if (!sport.toLowerCase().includes("lacrosse")) {
    terms.push("lacrosse");
  }
  return terms.join(" ");
}


function dedupeEvents(events: AthleteResearchEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.eventName.toLowerCase()}|${event.url.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildAndStoreResearchEvents(
  athleteId: string,
  profile: ResearchProfile,
  options?: { force?: boolean }
) {
  const athleteName = String(profile.name ?? "").trim();
  if (!athleteId || !athleteName) {
    return { ok: false, added: 0, reason: "Missing athlete name." };
  }

  const existing = await adminDb
    .collection("events")
    .where("athleteId", "==", athleteId)
    .get()
    .catch(() => null);

  const existingEvents = existing?.docs.map((doc) => doc.data()) ?? [];
  if (!options?.force && existingEvents.length) {
    return { ok: true, added: 0, reason: "Events already exist." };
  }

  const query = buildQuery(profile);
  if (!query) {
    return { ok: false, reason: "Missing search terms." };
  }

  const existingNames = new Set(
    existingEvents
      .map((event) => String(event.eventName ?? "").toLowerCase().trim())
      .filter(Boolean)
  );
  const existingUrls = new Set(
    existingEvents
      .map((event) => String(event.url ?? "").toLowerCase().trim())
      .filter(Boolean)
  );

  let extracted: AthleteResearchEvent[] = [];
  try {
    extracted = await generateAthleteResearch({
      athleteName,
      gradYear: profile.gradYear,
      sport: profile.sport ?? "lacrosse",
    });
  } catch (error) {
    console.error("Research agent failed:", error);
    return { ok: false, added: 0, reason: "Research failed. Try again." };
  }

  const events = dedupeEvents(extracted).filter((event) => {
    const nameKey = event.eventName.toLowerCase();
    const urlKey = event.url.toLowerCase();
    if (existingNames.has(nameKey) || existingUrls.has(urlKey)) {
      return false;
    }
    existingNames.add(nameKey);
    existingUrls.add(urlKey);
    return true;
  });

  if (!events.length) {
    return { ok: true, added: 0, reason: "No public events found yet." };
  }

  await Promise.all(
    events.map((event) =>
      adminDb.collection("events").add({
        athleteId,
        eventName: event.eventName,
        url: event.url,
        summary: event.summary,
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      })
    )
  );

  return { ok: true, added: events.length };
}
