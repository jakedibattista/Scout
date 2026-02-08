"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageShell from "../../../_components/PageShell";

type VideoItem = {
  id: string;
  drillType: string;
  fileName: string;
  status: string;
  analysisStatus: string;
  analysisNotes: string | null;
  analysisMetrics: Record<string, string | number>;
  uploadDate: string | null;
  createdAt?: string | null;
  viewUrl: string | null;
};

type AthleteResponse = {
  ok: boolean;
  athlete?: {
    id: string;
    name: string;
    email: string;
    state: string;
  };
  reports?: Array<{
    id: string;
    type: string;
    summary: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendedLevel?: string;
    createdAt?: string | null;
  }>;
  videos?: VideoItem[];
  error?: string;
};

const drillLabels: Record<string, string> = {
  wall_ball: "Wall ball",
  dash_20: "20-yard dash",
  shuttle_5_10_5: "5-10-5 shuttle",
};

const shuttleBenchmarks = { elite: 4.0, good: 4.5 };
const dashBenchmarks = { elite: 2.5, good: 2.7 };
const wallBallBenchmarks = { elite: 80, good: 60 };

export default function AthleteDetailPage() {
  const params = useParams();
  const athleteId = useMemo(() => {
    const raw = params?.id;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteResponse["athlete"] | null>(
    null
  );
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [scoutReport, setScoutReport] = useState<
    AthleteResponse["reports"][number] | null
  >(null);

  useEffect(() => {
    if (!athleteId) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/scout/athlete/${athleteId}`)
      .then(async (res) => {
        const data = (await res.json()) as AthleteResponse;
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to load athlete.");
        }
        if (!active) return;
        setAthlete(data.athlete ?? null);
        setVideos(data.videos ?? []);
        const reports = Array.isArray(data.reports) ? data.reports : [];
        const scout = reports
          .filter((item) => item.type === "scout")
          .sort((a, b) =>
            String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
          )[0];
        setScoutReport(scout ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message ?? "Unable to load athlete.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [athleteId]);

  const athleteName = athlete?.name ?? decodeURIComponent(athleteId);
  const drillKeys = ["wall_ball", "dash_20", "shuttle_5_10_5"] as const;

  function parseSeconds(value?: string | number | null) {
    if (typeof value === "number") return value;
    if (!value) return null;
    const normalized = String(value).replace(/[^0-9.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatSeconds(value: number | null) {
    if (value === null) return "—";
    return `${value.toFixed(2)}s`;
  }

  function formatCount(value: number | null) {
    if (value === null) return "—";
    return `${Math.round(value)}`;
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

  function getShuttleGrade(totalSeconds: number | null) {
    if (totalSeconds === null) return { label: "Pending", color: "text-white/50" };
    if (totalSeconds < shuttleBenchmarks.elite) {
      return { label: "Elite", color: "text-emerald-300" };
    }
    if (totalSeconds <= shuttleBenchmarks.good) {
      return { label: "Good", color: "text-yellow-300" };
    }
    return { label: "Needs work", color: "text-red-300" };
  }

  function getDashGrade(totalSeconds: number | null) {
    if (totalSeconds === null) return { label: "Pending", color: "text-white/50" };
    if (totalSeconds < dashBenchmarks.elite) {
      return { label: "Elite", color: "text-emerald-300" };
    }
    if (totalSeconds <= dashBenchmarks.good) {
      return { label: "Good", color: "text-yellow-300" };
    }
    return { label: "Needs work", color: "text-red-300" };
  }

  function getWallBallGrade(reps: number | null) {
    if (reps === null) return { label: "Pending", color: "text-white/50" };
    if (reps >= wallBallBenchmarks.elite) {
      return { label: "Elite", color: "text-emerald-300" };
    }
    if (reps >= wallBallBenchmarks.good) {
      return { label: "Good", color: "text-yellow-300" };
    }
    return { label: "Needs work", color: "text-red-300" };
  }

  function getLatestByDrill(drillType: string) {
    const list = videos.filter((video) => video.drillType === drillType);
    return list.sort((a, b) => {
      const aDate = a.uploadDate || a.createdAt || "";
      const bDate = b.uploadDate || b.createdAt || "";
      return bDate.localeCompare(aDate);
    })[0];
  }

  return (
    <PageShell
      title={athleteName}
      subtitle="Scout view of the athlete profile, videos, and AI report."
      actions={
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider">
          <Link
            className="rounded-full border border-white/20 px-4 py-2 text-white"
            href="/scout/search"
          >
            Back to search
          </Link>
          <div className="rounded-full border border-white/20 px-4 py-2 text-white/70">
            {(athlete?.name ?? athleteName) || "Athlete"} ·{" "}
            {athlete?.email || "athlete@email.com"} ·{" "}
            {athlete?.state || "--"}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl">Scouting report</h2>
          <p className="mt-3 text-sm text-white/70">
            {scoutReport?.summary ??
              "Enter competitions and combine drills to get your scouting report."}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
              Strengths:{" "}
              {Array.isArray(scoutReport?.strengths)
                ? scoutReport?.strengths.join(", ")
                : "Speed, quick decision-making"}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
              Recommended level: {scoutReport?.recommendedLevel ?? "D1-ready"}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl">Videos</h2>
          {loading ? (
            <p className="mt-4 text-sm text-white/60">Loading videos...</p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : videos.length === 0 ? (
            <p className="mt-4 text-sm text-white/60">
              No videos uploaded yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {drillKeys.map((key) => {
                const latest = getLatestByDrill(key);
                const label = drillLabels[key] ?? key;
                const totalTimeValue =
                  key === "shuttle_5_10_5"
                    ? parseSeconds(
                        getMetricValue(latest?.analysisMetrics, [
                          "Total Time",
                          "Finish Time",
                          "total_time",
                          "total_time_seconds",
                          "totalTime",
                          "timeSeconds",
                          "time",
                        ])
                      )
                    : key === "dash_20"
                      ? parseSeconds(
                          getMetricValue(latest?.analysisMetrics, [
                            "Total Time",
                            "Finish Time",
                            "20_yard_total_time",
                            "total_time",
                            "total_time_seconds",
                            "totalTime",
                            "timeSeconds",
                            "time",
                          ])
                        )
                      : null;
                const repsValue =
                  key === "wall_ball"
                    ? parseSeconds(
                        getMetricValue(latest?.analysisMetrics, [
                          "repetitions",
                          "Repetitions",
                          "reps",
                          "total_reps_60s",
                          "total_reps",
                          "rep_count",
                          "count",
                        ])
                      )
                    : null;
                const maxStreak =
                  key === "wall_ball"
                    ? parseSeconds(
                        getMetricValue(latest?.analysisMetrics, [
                          "max_consecutive_reps",
                          "maxConsecutiveReps",
                          "max_streak",
                          "maxStreak",
                        ])
                      )
                    : null;
                const shuttleGrade =
                  key === "shuttle_5_10_5"
                    ? latest?.analysisStatus === "ready" && totalTimeValue === null
                      ? { label: "Unavailable", color: "text-white/40" }
                      : getShuttleGrade(totalTimeValue)
                    : null;
                const dashGrade =
                  key === "dash_20"
                    ? latest?.analysisStatus === "ready" && totalTimeValue === null
                      ? { label: "Unavailable", color: "text-white/40" }
                      : getDashGrade(totalTimeValue)
                    : null;
                const wallBallGrade =
                  key === "wall_ball"
                    ? latest?.analysisStatus === "ready" && repsValue === null
                      ? { label: "Unavailable", color: "text-white/40" }
                      : getWallBallGrade(repsValue)
                    : null;

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70"
                  >
                    <div className="flex items-center justify-between text-sm text-white">
                      <span>{label}</span>
                    </div>
                    {key === "shuttle_5_10_5" ? (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                          Speed: {formatSeconds(totalTimeValue)}
                        </div>
                        <div
                          className={`rounded-full border border-white/10 px-3 py-1 ${shuttleGrade?.color ?? "text-white/50"}`}
                        >
                          {shuttleGrade?.label ?? "Pending"}
                        </div>
                      </div>
                    ) : null}
                    {key === "dash_20" ? (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                          Speed: {formatSeconds(totalTimeValue)}
                        </div>
                        <div
                          className={`rounded-full border border-white/10 px-3 py-1 ${dashGrade?.color ?? "text-white/50"}`}
                        >
                          {dashGrade?.label ?? "Pending"}
                        </div>
                      </div>
                    ) : null}
                    {key === "wall_ball" ? (
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                          Reps (60s): {formatCount(repsValue)}
                        </div>
                        <div className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                          Max streak: {formatCount(maxStreak)}
                        </div>
                        <div
                          className={`rounded-full border border-white/10 px-3 py-1 ${wallBallGrade?.color ?? "text-white/50"}`}
                        >
                          {wallBallGrade?.label ?? "Pending"}
                        </div>
                      </div>
                    ) : null}
                    {latest?.uploadDate ? (
                      <div className="mt-2 text-xs text-white/50">
                        Date: {new Date(latest.uploadDate).toLocaleDateString()}
                      </div>
                    ) : null}
                    {latest?.viewUrl ? (
                      <div className="mt-3">
                        <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <video
                            className="h-full w-full object-cover"
                            controls
                            preload="metadata"
                            src={latest.viewUrl}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-white/50">
                        No video uploaded yet.
                      </div>
                    )}
                    <div className="mt-3 text-xs text-white/60">
                      {latest?.analysisNotes
                        ? latest.analysisNotes
                        : "AI analysis will appear here after processing."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
