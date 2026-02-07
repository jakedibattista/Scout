"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageShell from "../../_components/PageShell";

type DrillKey = "speed_ladder" | "shuttle_run" | "position_specific";
type DrillStatus = "idle" | "uploading" | "uploaded" | "error";

const drills: { key: DrillKey; title: string; label: string }[] = [
  {
    key: "speed_ladder",
    title: "Drill 1: Speed ladder",
    label: "speed ladder",
  },
  {
    key: "shuttle_run",
    title: "Drill 2: Shuttle run",
    label: "shuttle run",
  },
  {
    key: "position_specific",
    title: "Drill 3: Position-specific",
    label: "position-specific",
  },
];

export default function AthleteUploadPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Record<DrillKey, DrillStatus>>({
    speed_ladder: "idle",
    shuttle_run: "idle",
    position_specific: "idle",
  });
  const [message, setMessage] = useState<Record<DrillKey, string>>({
    speed_ladder: "",
    shuttle_run: "",
    position_specific: "",
  });
  async function handleUpload(drillKey: DrillKey, file?: File | null) {
    if (!file) {
      setStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setMessage((prev) => ({ ...prev, [drillKey]: "No file selected." }));
      return;
    }

    setStatus((prev) => ({ ...prev, [drillKey]: "uploading" }));
    setMessage((prev) => ({ ...prev, [drillKey]: "Uploading..." }));

    try {
      const uploadResponse = await fetch("/api/athlete/video/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drillType: drillKey, fileName: file.name }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL.");
      }

      const uploadData = await uploadResponse.json();

      const completeResponse = await fetch("/api/athlete/video/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillType: drillKey,
          uploadUrl: uploadData.uploadUrl,
          fileName: file.name,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload.");
      }

      setStatus((prev) => ({ ...prev, [drillKey]: "uploaded" }));
      setMessage((prev) => ({ ...prev, [drillKey]: "Upload complete." }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setMessage((prev) => ({ ...prev, [drillKey]: "Upload failed." }));
    }
  }

  return (
    <PageShell
      title="Lacrosse Defender Combine"
      subtitle="Record a video of yourself doing an example of each of the following drills and upload it to complete your profile."
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
                accept="video/*"
                onChange={(event) =>
                  handleUpload(drill.key, event.target.files?.[0])
                }
              />
              <p className="text-xs text-white/50">
                {status[drill.key] === "uploading" ? "Uploading..." : null}
              </p>
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
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          type="button"
          onClick={() => router.push("/athlete/report")}
        >
          Skip for now
        </button>
      </div>
    </PageShell>
  );
}
