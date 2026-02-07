"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageShell from "../../_components/PageShell";

type DrillKey = "wall_ball" | "dash_20" | "shuttle_5_10_5";
type DrillStatus = "idle" | "uploading" | "uploaded" | "error";
type DrillVideoMeta = {
  viewUrl: string | null;
  analysisStatus: string;
  analysisNotes: string | null;
  analysisMetrics: Record<string, string | number>;
};

const drills: { key: DrillKey; title: string; label: string }[] = [
  {
    key: "wall_ball",
    title: "Drill 1: Wall ball",
    label: "wall ball",
  },
  {
    key: "dash_20",
    title: "Drill 2: 20-yard dash",
    label: "20-yard dash",
  },
  {
    key: "shuttle_5_10_5",
    title: "Drill 3: 5-10-5 shuttle",
    label: "5-10-5 shuttle",
  },
];

export default function AthleteUploadPage() {
  const router = useRouter();
  const [athleteId, setAthleteId] = useState("unknown");
  const [status, setStatus] = useState<Record<DrillKey, DrillStatus>>({
    wall_ball: "idle",
    dash_20: "idle",
    shuttle_5_10_5: "idle",
  });
  const [message, setMessage] = useState<Record<DrillKey, string>>({
    wall_ball: "",
    dash_20: "",
    shuttle_5_10_5: "",
  });
  const [videoMeta, setVideoMeta] = useState<Record<DrillKey, DrillVideoMeta>>({
    wall_ball: {
      viewUrl: null,
      analysisStatus: "pending",
      analysisNotes: null,
      analysisMetrics: {},
    },
    dash_20: {
      viewUrl: null,
      analysisStatus: "pending",
      analysisNotes: null,
      analysisMetrics: {},
    },
    shuttle_5_10_5: {
      viewUrl: null,
      analysisStatus: "pending",
      analysisNotes: null,
      analysisMetrics: {},
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("athleteUsername");
    if (stored) {
      setAthleteId(stored);
    }
  }, []);

  function resolveContentType(file: File) {
    if (file.type) return file.type;
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".mov")) return "video/quicktime";
    if (lowerName.endsWith(".mp4")) return "video/mp4";
    if (lowerName.endsWith(".m4v")) return "video/x-m4v";
    return "application/octet-stream";
  }

  async function handleUpload(drillKey: DrillKey, file?: File | null) {
    if (!file) {
      setStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setMessage((prev) => ({ ...prev, [drillKey]: "No file selected." }));
      return;
    }

    const contentType = resolveContentType(file);
    if (!contentType.startsWith("video/")) {
      setStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setMessage((prev) => ({
        ...prev,
        [drillKey]: "Unsupported file type.",
      }));
      return;
    }

    setStatus((prev) => ({ ...prev, [drillKey]: "uploading" }));
    setMessage((prev) => ({ ...prev, [drillKey]: "Uploading..." }));

    try {
      const uploadResponse = await fetch("/api/athlete/video/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: drillKey,
          fileName: file.name,
          contentType,
          athleteId,
        }),
      });

      let uploadData: {
        ok?: boolean;
        uploadUrl?: string;
        filePath?: string;
        contentType?: string;
        error?: string;
      };
      try {
        uploadData = await uploadResponse.json();
      } catch {
        uploadData = {};
      }

      if (!uploadResponse.ok || uploadData?.ok === false) {
        throw new Error(uploadData?.error || "Failed to get upload URL.");
      }

      if (!uploadData?.uploadUrl || !uploadData?.filePath) {
        throw new Error("Upload URL missing.");
      }
      const storageResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": uploadData.contentType || contentType },
        body: file,
      });

      if (!storageResponse.ok) {
        throw new Error("Upload failed.");
      }

      const completeResponse = await fetch("/api/athlete/video/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: drillKey,
          filePath: uploadData.filePath,
          fileName: file.name,
          athleteId,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload.");
      }

      const completeData = await completeResponse.json();
      setStatus((prev) => ({ ...prev, [drillKey]: "uploaded" }));
      setMessage((prev) => ({ ...prev, [drillKey]: "Upload complete." }));
      setVideoMeta((prev) => ({
        ...prev,
        [drillKey]: {
          viewUrl: completeData?.viewUrl ?? null,
          analysisStatus: completeData?.analysisStatus ?? "pending",
          analysisNotes: completeData?.analysisNotes ?? null,
          analysisMetrics: completeData?.analysisMetrics ?? {},
        },
      }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setMessage((prev) => ({
        ...prev,
        [drillKey]:
          error instanceof Error ? error.message : "Upload failed.",
      }));
    }
  }

  return (
    <PageShell
      title="Lacrosse Defender Combine"
      subtitle="Record a video for each drill and upload it to complete your profile."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {drills.map((drill) => (
          <div
            key={drill.key}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="font-display text-lg">{drill.title}</h2>
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-yellow-300/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-yellow-300 hover:border-yellow-300 hover:text-yellow-200"
              type="button"
            >
              How to do the {drill.label} drill
            </button>
            <div className="mt-6 flex flex-col gap-3">
              <input
                className="rounded-2xl border border-dashed border-white/30 px-4 py-3 text-xs text-white/70"
                type="file"
                accept="video/*,video/quicktime"
                onChange={(event) =>
                  handleUpload(drill.key, event.target.files?.[0])
                }
              />
            </div>
            {message[drill.key] ? (
              <p className="mt-4 text-xs text-white/60">
                {message[drill.key]}
              </p>
            ) : (
              <p className="mt-4 text-xs text-white/50">
                Date completed: not submitted
              </p>
            )}
            {status[drill.key] === "uploaded" ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Video preview
                </div>
                {videoMeta[drill.key]?.viewUrl ? (
                  <video
                    className="w-full rounded-xl border border-white/10"
                    controls
                    preload="metadata"
                    src={videoMeta[drill.key].viewUrl ?? undefined}
                  />
                ) : (
                  <p className="text-white/50">Preview pending.</p>
                )}
                <div className="text-xs uppercase tracking-wider text-white/50">
                  AI report
                </div>
                <p className="text-white/60">
                  {videoMeta[drill.key].analysisNotes
                    ? videoMeta[drill.key].analysisNotes
                    : "AI analysis will appear here after processing."}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          type="button"
          onClick={() => router.push("/athlete/report")}
        >
          {Object.values(status).some((value) => value === "uploaded")
            ? "Continue to report"
            : "Skip for now"}
        </button>
      </div>
    </PageShell>
  );
}
