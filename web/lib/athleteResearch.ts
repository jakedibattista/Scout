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

function normalizeTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function extractYears(value: string) {
  const matches = value.match(/\b(19|20)\d{2}\b/g);
  return matches ? matches.map((match) => Number(match)) : [];
}

function ensureCitedSummary(summary: string, url: string) {
  if (!summary) return `Source: ${url}`;
  const lower = summary.toLowerCase();
  if (lower.includes(url.toLowerCase())) return summary;
  return `${summary} (Source: ${url})`;
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

  const nameTokens = normalizeTokens(athleteName);
  const lastName = nameTokens.length ? nameTokens[nameTokens.length - 1] : "";
  const gradYear = Number(profile.gradYear ?? 0) || null;

  const events = dedupeEvents(extracted).filter((event) => {
    const nameKey = event.eventName.toLowerCase();
    const urlKey = event.url.toLowerCase();
    if (existingNames.has(nameKey) || existingUrls.has(urlKey)) {
      return false;
    }
    existingNames.add(nameKey);
    existingUrls.add(urlKey);

    const context = `${event.eventName} ${event.summary} ${event.url}`.toLowerCase();
    if (lastName && !context.includes(lastName)) {
      return false;
    }
    if (gradYear) {
      const years = extractYears(context);
      if (years.length && !years.includes(gradYear)) {
        return false;
      }
    }
    return true;
  });

  if (!events.length) {
    return { ok: true, added: 0, reason: "No public events found yet." };
  }

  await Promise.all(
    events.map((event) => {
      const summary = ensureCitedSummary(event.summary, event.url);
      return adminDb.collection("events").add({
        athleteId,
        eventName: event.eventName,
        url: event.url,
        summary,
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      });
    })
  );

  return { ok: true, added: events.length };
}
