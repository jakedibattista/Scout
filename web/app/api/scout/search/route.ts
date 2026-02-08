import { adminDb } from "@/lib/firebaseAdmin";
import { buildScoutQueryPlan } from "@/lib/gemini";

const shuttleBenchmarks = { elite: 4.0, good: 4.5 };
const dashBenchmarks = { elite: 2.5, good: 2.7 };

function parseSeconds(value?: string | number | null) {
  if (typeof value === "number") return value;
  if (!value) return null;
  const normalized = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMetricValue(
  metrics: Record<string, string | number> | undefined,
  keys: string[]
) {
  if (!metrics) return null;
  for (const key of keys) {
    if (metrics[key] !== undefined) return metrics[key];
  }
  return null;
}

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

function gradeFromScore(score: number) {
  if (score >= 5) return "A";
  if (score >= 3) return "B";
  if (score >= 1) return "C";
  return "D";
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
  athlete: { state?: string; relocateStates?: string[] },
  recruitingStates?: string[]
) {
  if (!recruitingStates?.length) return true;
  const athleteState = athlete.state ?? "";
  if (recruitingStates.includes(athleteState)) return true;
  const relocate = athlete.relocateStates ?? [];
  return recruitingStates.some((state) => relocate.includes(state));
}

function passesPositionFilter(
  athlete: { position?: string },
  positions?: string[]
) {
  if (!positions?.length) return true;
  const position = athlete.position ?? "";
  return positions.includes(position);
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function passesGradYears(
  athlete: { gradYear?: number | string },
  gradYearsRecruiting?: number[]
) {
  if (!gradYearsRecruiting?.length) return true;
  const gradYear = parseNumber(athlete.gradYear);
  if (!gradYear) return false;
  return gradYearsRecruiting.includes(gradYear);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const query = String(payload?.query ?? "").trim();
    const scoutUsername = String(payload?.scoutUsername ?? "");

    if (!scoutUsername) {
      return Response.json(
        { ok: false, error: "Missing scout username." },
        { status: 400 }
      );
    }

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

    let athleteQuery = adminDb.collection("athleteProfiles");
    if (filters.sport) {
      athleteQuery = athleteQuery.where("sport", "==", filters.sport);
    }
    if (filters.positions?.length === 1) {
      athleteQuery = athleteQuery.where("position", "==", filters.positions[0]);
    }
    if (filters.positions && filters.positions.length > 1) {
      athleteQuery = athleteQuery.where(
        "position",
        "in",
        filters.positions.slice(0, 10)
      );
    }

    const athleteSnapshot = await athleteQuery.limit(50).get();
    const athletes = athleteSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
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

    const athleteIds = athletes.map((athlete) => athlete.username ?? athlete.id);
    const videosByAthlete: Record<
      string,
      Record<string, { analysisMetrics?: Record<string, string | number> }>
    > = {};

    for (let i = 0; i < athleteIds.length; i += 10) {
      const chunk = athleteIds.slice(i, i + 10);
      if (!chunk.length) continue;
      const videoSnapshot = await adminDb
        .collection("videos")
        .where("athleteId", "in", chunk)
        .get();
      for (const doc of videoSnapshot.docs) {
        const data = doc.data();
        const athleteId = data.athleteId as string;
        if (!videosByAthlete[athleteId]) {
          videosByAthlete[athleteId] = {};
        }
        if (!videosByAthlete[athleteId][data.drillType]) {
          videosByAthlete[athleteId][data.drillType] = {
            analysisMetrics: data.analysisMetrics,
          };
        }
      }
    }

    const results = athletes
      .map((athlete) => {
        const athleteId = athlete.username ?? athlete.id;
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
          ])
        );
        const wallBallScore = wallBallReps ?? 0;
        const gpa = parseNumber(athlete.gpa);
        const gradYear = parseNumber(athlete.gradYear);
        const position = athlete.position ?? "";
        const state = athlete.state ?? "";
        const parts = [
          athlete.name ?? athleteId,
          state ? `${state} ${position}`.trim() : position,
          gpa ? `GPA ${gpa.toFixed(1)}` : null,
          gradYear ? `Class of ${gradYear}` : null,
        ].filter(Boolean);
        const reason = parts.length ? parts.join(" · ") : athleteId;

        return {
          id: athleteId,
          name: athlete.name ?? athleteId,
          speedScore,
          wallBallScore,
          grade: gradeFromScore(speedScore),
          reason,
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
