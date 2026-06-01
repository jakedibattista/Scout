import { adminDb } from "@/lib/firebaseAdmin";
import { buildScoutQueryPlan } from "@/lib/gemini";
import {
  dashBenchmarks,
  formatSeconds,
  getMetricValue,
  parseSeconds,
  shuttleBenchmarks,
} from "@/lib/metrics";
import { getSession, unauthorized, forbidden } from "@/lib/auth/session";

export const runtime = "nodejs";

function scoreShuttle(totalSeconds: number | null) {
  if (totalSeconds === null) return 0;
  if (totalSeconds < shuttleBenchmarks.elite) return 2;
  if (totalSeconds <= shuttleBenchmarks.good) return 1;
  return 0;
}

function scoreDash(totalSeconds: number | null) {
  if (totalSeconds === null) return 0;
  if (totalSeconds < dashBenchmarks.elite) return 2;
  if (totalSeconds <= dashBenchmarks.good) return 1;
  return 0;
}

function applyProfileFilters({
  profile,
  planFilters,
}: {
  profile: {
    recruitingStates?: string[];
    positionFocus?: string[];
    gradYearsRecruiting?: number[];
    sport?: string;
  };
  planFilters: {
    positions?: string[];
    recruitingStates?: string[];
    gradYearsRecruiting?: number[];
  };
}) {
  const merged = {
    positions: planFilters.positions,
    recruitingStates: planFilters.recruitingStates,
    gradYearsRecruiting: planFilters.gradYearsRecruiting,
    sport: profile.sport ?? undefined,
  };

  if (!merged.positions?.length && profile.positionFocus?.length) {
    merged.positions = profile.positionFocus;
  } else if (merged.positions?.length && profile.positionFocus?.length) {
    merged.positions = merged.positions.filter((item) =>
      profile.positionFocus?.includes(item)
    );
  }

  if (merged.positions?.length) {
    merged.positions = merged.positions.map((item) => normalizePosition(item));
  }

  if (!merged.recruitingStates?.length && profile.recruitingStates?.length) {
    merged.recruitingStates = profile.recruitingStates;
  } else if (merged.recruitingStates?.length && profile.recruitingStates?.length) {
    merged.recruitingStates = merged.recruitingStates.filter((item) =>
      profile.recruitingStates?.includes(item)
    );
  }

  if (
    !merged.gradYearsRecruiting?.length &&
    profile.gradYearsRecruiting?.length
  ) {
    merged.gradYearsRecruiting = profile.gradYearsRecruiting;
  } else if (
    merged.gradYearsRecruiting?.length &&
    profile.gradYearsRecruiting?.length
  ) {
    merged.gradYearsRecruiting = merged.gradYearsRecruiting.filter((year) =>
      profile.gradYearsRecruiting?.includes(year)
    );
  }

  return merged;
}

function passesStateFilter(
  athlete: Record<string, unknown>,
  recruitingStates?: string[]
) {
  if (!recruitingStates?.length) return true;
  const athleteState = String(athlete.state ?? "").trim();
  if (recruitingStates.includes(athleteState)) return true;
  const relocate = Array.isArray(athlete.relocateStates)
    ? (athlete.relocateStates as string[])
    : [];
  return recruitingStates.some((state) => relocate.includes(state));
}

function passesPositionFilter(
  athlete: Record<string, unknown>,
  positions?: string[]
) {
  if (!positions?.length) return true;
  const position = normalizePosition(String(athlete.position ?? ""));
  return positions.includes(position);
}

function passesSportFilter(
  athlete: Record<string, unknown>,
  sport?: string
) {
  if (!sport) return true;
  return normalizeText(athlete.sport) === normalizeText(sport);
}

function normalizePosition(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "defender") return "defense";
  if (normalized === "defence") return "defense";
  if (normalized === "d pole") return "defense";
  if (normalized === "face-off") return "faceoff";
  if (normalized === "fogo") return "faceoff";
  return normalized;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function passesGradYears(
  athlete: Record<string, unknown>,
  gradYearsRecruiting?: number[]
) {
  if (!gradYearsRecruiting?.length) return true;
  const gradYear = parseNumber(athlete.gradYear);
  if (!gradYear) return false;
  return gradYearsRecruiting.includes(gradYear);
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.role !== "scout") return forbidden();

    const payload = await request.json();
    const query = String(payload?.query ?? "").trim();
    const scoutUsername = session.username;

    const scoutSnap = await adminDb
      .collection("scoutProfiles")
      .doc(scoutUsername)
      .get();
    if (!scoutSnap.exists) {
      return Response.json(
        { ok: false, error: "Scout profile not found." },
        { status: 404 }
      );
    }

    const profile = scoutSnap.data() ?? {};
    let plan = await buildScoutQueryPlan({
      profile: {
        sport: profile.sport,
        recruitingStates: profile.recruitingStates,
        positionFocus: profile.positionFocus,
        gradYearsRecruiting: profile.gradYearsRecruiting,
      },
      query,
    });
    const loweredQuery = query.toLowerCase();
    if (loweredQuery.includes("fast") && plan.sort?.by !== "speed_score") {
      plan = {
        ...plan,
        intent: "speed",
        sort: { by: "speed_score", direction: "desc" },
      };
    }
    if (
      (loweredQuery.includes("wall ball") || loweredQuery.includes("wallball")) &&
      plan.sort?.by !== "wall_ball_score"
    ) {
      plan = {
        ...plan,
        intent: "wall_ball",
        sort: { by: "wall_ball_score", direction: "desc" },
      };
    }

    const filters = applyProfileFilters({
      profile: {
        sport: profile.sport,
        recruitingStates: profile.recruitingStates,
        positionFocus: profile.positionFocus,
        gradYearsRecruiting: profile.gradYearsRecruiting,
      },
      planFilters: plan.filters ?? {},
    });

    const athleteSnapshot = await adminDb
      .collection("athleteProfiles")
      .limit(50)
      .get();
    const athletes = athleteSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>))
      .filter((athlete) => passesSportFilter(athlete, filters.sport))
      .filter((athlete) =>
        passesStateFilter(athlete, filters.recruitingStates)
      )
      .filter((athlete) => passesPositionFilter(athlete, filters.positions))
      .filter((athlete) =>
        passesGradYears(athlete, filters.gradYearsRecruiting)
      )
      .filter((athlete) => {
        if (!plan.filters?.gradYearMin && !plan.filters?.gradYearMax) {
          return true;
        }
        const gradYear = parseNumber(athlete.gradYear);
        if (!gradYear) return false;
        if (plan.filters?.gradYearMin && gradYear < plan.filters.gradYearMin) {
          return false;
        }
        if (plan.filters?.gradYearMax && gradYear > plan.filters.gradYearMax) {
          return false;
        }
        return true;
      })
      .filter((athlete) => {
        if (!plan.filters?.gpaMin) return true;
        const gpa = parseNumber(athlete.gpa);
        if (!gpa) return false;
        return gpa >= plan.filters.gpaMin;
      })
      .filter((athlete) => {
        if (!plan.filters?.goal) return true;
        const goal = String(athlete.goal ?? "").toLowerCase();
        return goal.includes(String(plan.filters.goal).toLowerCase());
      })
      .filter((athlete) => {
        if (!plan.filters?.clubTeam) return true;
        const clubTeam = String(athlete.clubTeam ?? "").toLowerCase();
        return clubTeam.includes(String(plan.filters.clubTeam).toLowerCase());
      });

    const athleteIds = athletes.map((athlete) =>
      String(athlete.username ?? athlete.id ?? "")
    );
    const videosByAthlete: Record<
      string,
      Record<
        string,
        { analysisMetrics?: Record<string, string | number>; uploadMs: number }
      >
    > = {};

    // Firestore "in" queries are capped at 10 values; fan them out in parallel.
    const chunks: string[][] = [];
    for (let i = 0; i < athleteIds.length; i += 10) {
      const chunk = athleteIds.slice(i, i + 10).filter(Boolean);
      if (chunk.length) chunks.push(chunk);
    }
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        adminDb.collection("videos").where("athleteId", "in", chunk).get()
      )
    );

    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const athleteId = String(data.athleteId ?? "");
        const drillType = String(data.drillType ?? "");
        if (!athleteId || !drillType) continue;

        const uploadMs =
          typeof data.uploadDate?.toDate === "function"
            ? data.uploadDate.toDate().getTime()
            : typeof data.uploadDate?.seconds === "number"
            ? data.uploadDate.seconds * 1000
            : 0;

        if (!videosByAthlete[athleteId]) {
          videosByAthlete[athleteId] = {};
        }
        // Keep only the most recent video per drill type.
        const existing = videosByAthlete[athleteId][drillType];
        if (!existing || uploadMs >= existing.uploadMs) {
          videosByAthlete[athleteId][drillType] = {
            analysisMetrics: data.analysisMetrics,
            uploadMs,
          };
        }
      }
    }

    const results = athletes
      .map((athlete) => {
        const athleteId = String(athlete.username ?? athlete.id ?? "");
        const metrics = videosByAthlete[athleteId] ?? {};
        const shuttleTime = parseSeconds(
          getMetricValue(metrics.shuttle_5_10_5?.analysisMetrics, [
            "Total Time",
            "totalTime",
            "timeSeconds",
            "Finish Time",
          ])
        );
        const dashTime = parseSeconds(
          getMetricValue(metrics.dash_20?.analysisMetrics, [
            "Total Time",
            "Finish Time",
            "totalTime",
            "timeSeconds",
          ])
        );
        const shuttleScore = scoreShuttle(shuttleTime);
        const dashScore = scoreDash(dashTime);
        const speedScore = shuttleScore * 2 + dashScore;
        const wallBallReps = parseSeconds(
          getMetricValue(metrics.wall_ball?.analysisMetrics, [
            "repetitions",
            "Repetitions",
            "reps",
            "total_reps_60s",
            "total_reps",
            "rep_count",
            "count",
          ])
        );
        const wallBallScore = wallBallReps ?? 0;
        const name = String(athlete.name ?? athleteId);
        const dashLabel =
          plan.sort?.by === "speed_score" && dashTime !== null
            ? `20-yard: ${formatSeconds(dashTime)}`
            : null;
        const shuttleLabel =
          plan.sort?.by === "speed_score" && shuttleTime !== null
            ? `Shuttle: ${formatSeconds(shuttleTime)}`
            : null;
        const wallBallLabel =
          plan.sort?.by === "wall_ball_score" && wallBallReps !== null
            ? `Wall ball: ${wallBallReps} reps (60s)`
            : null;
        const summaryParts = [wallBallLabel, dashLabel, shuttleLabel].filter(
          Boolean
        );
        const summary = summaryParts.length
          ? summaryParts.join(" · ")
          : "Profile match.";

        return {
          id: athleteId,
          name,
          speedScore,
          wallBallScore,
          summary,
        };
      })
      .sort((a, b) => {
        if (plan.sort?.by === "speed_score") {
          return b.speedScore - a.speedScore;
        }
        if (plan.sort?.by === "wall_ball_score") {
          return b.wallBallScore - a.wallBallScore;
        }
        return a.name.localeCompare(b.name);
      });

    return Response.json({
      ok: true,
      plan,
      parsedFilters: filters,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
