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
  videos?: VideoItem[];
  error?: string;
};

const drillLabels: Record<string, string> = {
  wall_ball: "Wall ball",
  dash_20: "20-yard dash",
  shuttle_5_10_5: "5-10-5 shuttle",
};

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
            AI summary, top traits, and recommended level will appear here.
          </p>
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
            <div className="mt-4 space-y-4 text-sm text-white/70">
              {videos.map((video) => {
                const label =
                  drillLabels[video.drillType] ?? video.drillType;
                return (
                  <div
                    key={video.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white">
                      <span>{label}</span>
                      <span className="text-xs text-yellow-300">
                        Status: {video.analysisStatus}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
                      {video.viewUrl ? (
                        <a
                          className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                          href={video.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View video
                        </a>
                      ) : (
                        <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          View video (pending)
                        </span>
                      )}
                      <span>File: {video.fileName || "video.mp4"}</span>
                      {video.uploadDate ? (
                        <span>
                          Uploaded:{" "}
                          {new Date(video.uploadDate).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-xs text-white/60">
                      {video.analysisNotes
                        ? `Notes: ${video.analysisNotes}`
                        : "Notes: pending Gemini analysis."}
                    </div>
                    {video.analysisMetrics &&
                    Object.keys(video.analysisMetrics).length ? (
                      <div className="mt-2 text-xs text-white/50">
                        Metrics:{" "}
                        {Object.entries(video.analysisMetrics)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </div>
                    ) : null}
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
