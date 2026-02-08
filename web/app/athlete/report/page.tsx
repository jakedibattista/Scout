"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import PageShell from "../../_components/PageShell";
import { db } from "@/lib/firebase";
import StateChecklist from "../../_components/StateChecklist";

type ReportStatus = "idle" | "loading" | "ready" | "error";
type DrillStatus = "idle" | "uploading" | "uploaded" | "error";
type ReportPayload = {
  summary?: string;
  strengths?: string;
  recommendedLevel?: string;
  research?: string;
  coaching?: string;
};

type AthleteAboutForm = {
  name: string;
  sport: string;
  position: string;
  gradYear: string;
  state: string;
  height: string;
  weight: string;
  username: string;
  email: string;
  highSchoolTeam: string;
  goal: string;
  gpa: string;
  clubTeam: string;
  highlightTapeUrl: string;
  relocateStates: string[];
  instagram: string;
  x: string;
  tiktok: string;
  youtube: string;
};

type CompetitionEvent = {
  id: string;
  eventName: string;
  url: string;
  summary: string;
};

type VideoItem = {
  id: string;
  drillType: string;
  fileName: string;
  analysisStatus: string;
  analysisNotes: string | null;
  analysisMetrics: Record<string, string | number>;
  analysisError?: string | null;
  uploadDate: string | null;
  createdAt?: string | null;
  viewUrl: string | null;
};

export default function AthleteReportPage() {
  const [status, setStatus] = useState<ReportStatus>("idle");
  const [report, setReport] = useState<ReportPayload>({});
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"ai" | "about">("ai");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [drillStatus, setDrillStatus] = useState<Record<string, DrillStatus>>({
    wall_ball: "idle",
    dash_20: "idle",
    shuttle_5_10_5: "idle",
  });
  const [drillMessage, setDrillMessage] = useState<Record<string, string>>({
    wall_ball: "",
    dash_20: "",
    shuttle_5_10_5: "",
  });
  const [aboutForm, setAboutForm] = useState<AthleteAboutForm>({
    name: "Jordan Wells",
    sport: "lacrosse",
    position: "Defender",
    gradYear: "2026",
    state: "MD",
    height: "6'1",
    weight: "185 lb",
    username: "athlete",
    email: "athlete@email.com",
    highSchoolTeam: "High School",
    goal: "Go D1",
    gpa: "3.5",
    clubTeam: "",
    highlightTapeUrl: "",
    relocateStates: [],
    instagram: "",
    x: "",
    tiktok: "",
    youtube: "",
  });
  const [aboutMessage, setAboutMessage] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [researchStatus, setResearchStatus] = useState<ReportStatus>("idle");
  const [researchMessage, setResearchMessage] = useState("");
  const [eventForm, setEventForm] = useState({
    eventName: "",
    url: "",
    summary: "",
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const positionOptions: Record<string, string[]> = {
    lacrosse: ["Attack", "Midfield", "Defense", "Goalie", "Faceoff"],
    hockey: ["Forward", "Defense", "Goalie"],
    football: ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"],
  };
  const availablePositions = positionOptions[aboutForm.sport] ?? [];
  const drillLabels: Record<string, string> = {
    wall_ball: "Wall ball",
    dash_20: "20-yard dash",
    shuttle_5_10_5: "5-10-5 shuttle",
  };
  const shuttleBenchmarks = { elite: 4.0, good: 4.5 };
  const dashBenchmarks = { elite: 2.5, good: 2.7 };
  const wallBallBenchmarks = { elite: 80, good: 60 };
  const drillKeys = useMemo(
    () => ["wall_ball", "dash_20", "shuttle_5_10_5"],
    []
  );

  async function loadReports() {
    if (typeof window === "undefined") return;
    const username = localStorage.getItem("athleteUsername");
    if (!username) return;

    setStatus("loading");
    setMessage("");

    try {
      const snapshot = await getDocs(
        query(collection(db, "reports"), where("athleteId", "==", username))
      );
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Array<Record<string, unknown>>;

      const toMillis = (value: unknown) => {
        if (!value) return 0;
        if (typeof value === "object" && value !== null) {
          const maybe = value as { toDate?: () => Date };
          if (typeof maybe.toDate === "function") {
            return maybe.toDate().getTime();
          }
        }
        return 0;
      };

      const byType = (type: string) =>
        reports
          .filter((item) => item.type === type)
          .sort(
            (a, b) =>
              toMillis(b.createdAt) - toMillis(a.createdAt)
          )[0];

      const scout = byType("scout");
      const coach = byType("coach");

      const strengths =
        Array.isArray(scout?.strengths) ? scout?.strengths.join(", ") : scout?.strengths;
      const recommendedLevel =
        (scout?.recommendedLevel as string | undefined) ??
        (scout?.metrics as { recommendedLevel?: string } | undefined)?.recommendedLevel;

      setReport({
        summary: (scout?.summary as string | undefined) ?? "",
        strengths: strengths ? String(strengths) : undefined,
        recommendedLevel: recommendedLevel ? String(recommendedLevel) : undefined,
        coaching: (coach?.summary as string | undefined) ?? "",
        research: "",
      });

      if (scout || coach) {
        setStatus("ready");
        setMessage("Report updated.");
      } else {
        setStatus("idle");
        setMessage("No AI reports yet. Upload a drill or add an event.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Unable to load reports.");
    }
  }

  useEffect(() => {
    async function loadProfile() {
      if (typeof window === "undefined") return;
      const username = localStorage.getItem("athleteUsername");
      if (!username) return;

      const snapshot = await getDoc(doc(db, "athleteProfiles", username));
      if (!snapshot.exists()) return;
      const profile = snapshot.data();

      setAboutForm({
        name: String(profile.name ?? ""),
        sport: String(profile.sport ?? "lacrosse"),
        position: String(profile.position ?? ""),
        gradYear: String(profile.gradYear ?? ""),
        state: String(profile.state ?? ""),
        height: String(profile.height ?? ""),
        weight: String(profile.weight ?? ""),
        username: String(profile.username ?? ""),
        email: String(profile.email ?? ""),
        highSchoolTeam: String(profile.highSchoolTeam ?? ""),
        goal: String(profile.goal ?? ""),
        gpa: String(profile.gpa ?? ""),
        clubTeam: String(profile.clubTeam ?? ""),
        highlightTapeUrl: String(profile.highlightTapeUrl ?? ""),
        relocateStates: Array.isArray(profile.relocateStates)
          ? profile.relocateStates
          : [],
        instagram: String(profile.socials?.instagram ?? ""),
        x: String(profile.socials?.x ?? ""),
        tiktok: String(profile.socials?.tiktok ?? ""),
        youtube: String(profile.socials?.youtube ?? ""),
      });
    }

    loadProfile();
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadEvents() {
    if (typeof window === "undefined") return;
    const username = localStorage.getItem("athleteUsername");
    if (!username) return;
    try {
      const response = await fetch(
        `/api/athlete/events?athleteId=${encodeURIComponent(username)}`
      );
      const data = await response.json();
      if (response.ok && data.ok) {
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch (error) {
      setEvents([]);
    }
  }

  async function handleRunResearch() {
    if (typeof window === "undefined") return;
    const athleteId = localStorage.getItem("athleteUsername");
    if (!athleteId) {
      setResearchStatus("error");
      setResearchMessage("Missing athlete profile.");
      return;
    }

    setResearchStatus("loading");
    setResearchMessage("");

    try {
      const response = await fetch("/api/athlete/events/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId }),
      });
      const data = await response.json();

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "Research failed.");
      }

      const added = Number(data?.added ?? 0);
      const message =
        added > 0
          ? `Added ${added} event${added === 1 ? "" : "s"}.`
          : data?.reason || "No public events found yet.";
      setResearchStatus("ready");
      setResearchMessage(message);
      await loadEvents();
    } catch (error) {
      setResearchStatus("error");
      setResearchMessage(
        error instanceof Error ? error.message : "Research failed."
      );
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadVideos(includeUrls = true) {
    if (typeof window === "undefined") return;
    const username = localStorage.getItem("athleteUsername");
    if (!username) return;

    try {
      const response = await fetch(
        `/api/athlete/videos?athleteId=${encodeURIComponent(
          username
        )}&includeUrls=${includeUrls ? "true" : "false"}`
      );
      const data = await response.json();
      if (response.ok && data.ok) {
        const list = Array.isArray(data.videos) ? data.videos : [];
        setVideos((prev) =>
          list.map((item: VideoItem) => {
            const existing = prev.find((video) => video.id === item.id);
            return {
              ...item,
              viewUrl: item.viewUrl ?? existing?.viewUrl ?? null,
            };
          })
        );
        return list;
      }
    } catch (error) {
      setVideos([]);
    }
    return [];
  }

  useEffect(() => {
    loadVideos(true);
  }, []);

  function resolveContentType(file: File) {
    if (file.type) return file.type;
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".mov")) return "video/quicktime";
    if (lowerName.endsWith(".mp4")) return "video/mp4";
    if (lowerName.endsWith(".m4v")) return "video/x-m4v";
    return "application/octet-stream";
  }

  async function handleDrillUpload(drillKey: string, file?: File | null) {
    if (!file) {
      setDrillStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setDrillMessage((prev) => ({
        ...prev,
        [drillKey]: "No file selected.",
      }));
      return;
    }

    const contentType = resolveContentType(file);
    if (!contentType.startsWith("video/")) {
      setDrillStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setDrillMessage((prev) => ({
        ...prev,
        [drillKey]: "Unsupported file type.",
      }));
      return;
    }

    setDrillStatus((prev) => ({ ...prev, [drillKey]: "uploading" }));
    setDrillMessage((prev) => ({ ...prev, [drillKey]: "Uploading..." }));

    try {
      const athleteId =
        typeof window !== "undefined"
          ? localStorage.getItem("athleteUsername")
          : null;

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

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || uploadData?.ok === false) {
        throw new Error(uploadData?.error || "Failed to get upload URL.");
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
      setDrillStatus((prev) => ({ ...prev, [drillKey]: "uploaded" }));
      setDrillMessage((prev) => ({
        ...prev,
        [drillKey]: "Upload complete. Running analysis...",
      }));

      if (completeData?.videoId) {
        const analyzeResponse = await fetch("/api/athlete/video/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: completeData.videoId }),
        });
        if (!analyzeResponse.ok) {
          setDrillMessage((prev) => ({
            ...prev,
            [drillKey]: "Analysis failed.",
          }));
        }
      }
      await loadVideos(true);

      let attempts = 0;
      const maxAttempts = 40;
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const latestVideos = await loadVideos(false);
        const latest = latestVideos.find((video) => video.drillType === drillKey);
        if (latest?.analysisStatus === "ready" || latest?.analysisStatus === "failed") {
          break;
        }
        attempts += 1;
      }
      await loadReports();
    } catch (error) {
      setDrillStatus((prev) => ({ ...prev, [drillKey]: "error" }));
      setDrillMessage((prev) => ({
        ...prev,
        [drillKey]:
          error instanceof Error ? error.message : "Upload failed.",
      }));
    }
  }

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

  function handleAboutChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setAboutForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAboutSave() {
    try {
      setAboutSaving(true);
      setAboutMessage("Saving profile and updating reports...");
      const username =
        typeof window !== "undefined"
          ? localStorage.getItem("athleteUsername")
          : null;
      await fetch("/api/athlete/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...aboutForm,
          username,
          socials: {
            instagram: aboutForm.instagram,
            x: aboutForm.x,
            tiktok: aboutForm.tiktok,
            youtube: aboutForm.youtube,
          },
        }),
      });
      if (username) {
        await fetch("/api/reports/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athleteId: username }),
        });
        await loadReports();
      }
      setIsEditingAbout(false);
      setAboutMessage("About Me updated.");
    } catch (error) {
      setAboutMessage("Unable to save updates.");
    } finally {
      setAboutSaving(false);
    }
  }

  async function handleAddEventLink() {
    try {
      if (
        !eventForm.eventName.trim() ||
        !eventForm.url.trim() ||
        !eventForm.summary.trim()
      ) {
        setMessage("Add event name, link, and summary.");
        return;
      }
      const username =
        typeof window !== "undefined"
          ? localStorage.getItem("athleteUsername")
          : null;
      await fetch("/api/athlete/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: username,
          eventName: eventForm.eventName,
          url: eventForm.url,
          summary: eventForm.summary,
        }),
      });
      setEventForm({ eventName: "", url: "", summary: "" });
      setMessage("Event added.");
      await loadEvents();
      await loadReports();
    } catch (error) {
      setMessage("Unable to add event link.");
    }
  }

  async function handleSaveEvent() {
    if (!editingEventId) return;
    try {
      await fetch("/api/athlete/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingEventId,
          eventName: eventForm.eventName,
          url: eventForm.url,
          summary: eventForm.summary,
        }),
      });
      setEditingEventId(null);
      setEventForm({ eventName: "", url: "", summary: "" });
      setMessage("Event updated.");
      await loadEvents();
      await loadReports();
    } catch (error) {
      setMessage("Unable to update event.");
    }
  }

  function handleAboutCancel() {
    setIsEditingAbout(false);
    setAboutMessage("");
  }

  return (
    <PageShell
      title="Athlete Profile"
      subtitle="Your living profile with AI scouting report, research, and coaching."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              activeTab === "ai"
                ? "bg-white text-black"
                : "border border-white/20 text-white"
            }`}
            type="button"
            onClick={() => setActiveTab("ai")}
          >
            Scouting Evaluation
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              activeTab === "about"
                ? "bg-white text-black"
                : "border border-white/20 text-white"
            }`}
            type="button"
            onClick={() => setActiveTab("about")}
          >
            About Me
          </button>
        </div>
        <Link
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white/70 hover:text-white"
          href="/"
        >
          Log out
        </Link>
      </div>
      {activeTab === "ai" && (message || aboutSaving) ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-300" : "text-white/70"
          }`}
        >
          {aboutSaving ? "Updating scouting report and coaching guidance..." : message}
        </p>
      ) : null}
      {activeTab === "ai" ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Scouting report</h2>
            <p className="mt-3 text-sm text-white/70">
              {report.summary ??
                "Enter competitions and combine drills to get your scouting report."}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                Strengths: {report.strengths ?? "Speed, quick decision-making"}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                Recommended level: {report.recommendedLevel ?? "D1-ready"}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Coaching guidance</h2>
            <p className="mt-3 text-sm text-white/70">
              {report.coaching ??
                "Focus drills and next steps from a coach perspective."}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Competitions and Results</h2>
            <p className="mt-3 text-sm text-white/70">
              {report.research ??
                "Auto-generated from athlete profile data and sport-specific sources."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                type="button"
                onClick={handleRunResearch}
                disabled={researchStatus === "loading"}
              >
                {researchStatus === "loading" ? "Running..." : "Run research"}
              </button>
              {researchMessage ? (
                <span
                  className={`text-xs ${
                    researchStatus === "error"
                      ? "text-red-300"
                      : "text-white/60"
                  }`}
                >
                  {researchMessage}
                </span>
              ) : null}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
              <div className="text-xs uppercase tracking-wider text-white/50">
                Add or update a competition entry
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
                  placeholder="Event name"
                  value={eventForm.eventName}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      eventName: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
                  placeholder="Event link"
                  value={eventForm.url}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      url: event.target.value,
                    }))
                  }
                />
                <input
                  className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white md:col-span-3"
                  placeholder="Summary"
                  value={eventForm.summary}
                  onChange={(event) =>
                    setEventForm((prev) => ({
                      ...prev,
                      summary: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                  type="button"
                  onClick={editingEventId ? handleSaveEvent : handleAddEventLink}
                >
                  {editingEventId ? "Save event" : "Add event"}
                </button>
                {editingEventId ? (
                  <button
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
                    type="button"
                    onClick={() => {
                      setEditingEventId(null);
                      setEventForm({ eventName: "", url: "", summary: "" });
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div className="grid grid-cols-4 gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wider text-white/50">
                <span>Event name</span>
                <span>Event link</span>
                <span>Summary</span>
                <span className="text-right">Actions</span>
              </div>
              {events.length ? (
                events.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 gap-4 px-4 py-3 text-xs text-white/70"
                  >
                    <div className="flex items-start">
                      <span className="text-white">{item.eventName}</span>
                    </div>
                    <a
                      className="text-yellow-300 hover:text-yellow-200"
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.url}
                    </a>
                    <span>{item.summary || "Summary pending."}</span>
                    <div className="flex items-start justify-end">
                      <button
                        className="text-xs uppercase tracking-wider text-yellow-300"
                        type="button"
                        onClick={() => {
                          setEditingEventId(item.id);
                          setEventForm({
                            eventName: item.eventName,
                            url: item.url,
                            summary: item.summary,
                          });
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-xs text-white/50">
                  No public events found yet. Add one below or run research.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Combine drills</h2>
            <p className="mt-3 text-sm text-white/70">
              Review or redo your three drills to refresh your report.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {drillKeys.map((key) => {
                const drillVideos = videos.filter(
                  (video) => video.drillType === key
                );
                const latest = drillVideos[0];
                const uploaded = Boolean(latest);
                const dateLabel = latest?.uploadDate
                  ? new Date(latest.uploadDate).toLocaleDateString()
                  : "";
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
                      <span>{drillLabels[key] ?? key}</span>
                      <label className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white cursor-pointer">
                        {uploaded ? "Redo" : "Upload"}
                        <input
                          className="hidden"
                          type="file"
                          accept="video/*,video/quicktime"
                          onChange={(event) =>
                            handleDrillUpload(key, event.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                    {drillStatus[key] === "uploading" ? (
                      <div className="mt-2 text-xs text-white/50">
                        Uploading...
                      </div>
                    ) : uploaded ? (
                      <div className="mt-2 text-xs text-white/50">
                        {latest?.analysisStatus === "failed"
                          ? "Analysis failed."
                          : latest?.analysisStatus === "ready"
                            ? "Analysis complete."
                            : drillMessage[key]
                              ? drillMessage[key]
                              : "Running analysis..."}
                      </div>
                    ) : drillMessage[key] ? (
                      <div className="mt-2 text-xs text-white/50">
                        {drillMessage[key]}
                      </div>
                    ) : null}
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
                      Max streak:{" "}
                      {formatCount(
                        parseSeconds(
                          getMetricValue(latest?.analysisMetrics, [
                            "max_consecutive_reps",
                            "maxConsecutiveReps",
                            "max_streak",
                            "maxStreak",
                          ])
                        )
                      )}
                    </div>
                        <div
                          className={`rounded-full border border-white/10 px-3 py-1 ${wallBallGrade?.color ?? "text-white/50"}`}
                        >
                          {wallBallGrade?.label ?? "Pending"}
                        </div>
                      </div>
                    ) : null}
                    {uploaded ? (
                      <div className="mt-2 text-xs text-white/50">
                        Date: {dateLabel}
                      </div>
                    ) : null}
                    {uploaded && latest?.viewUrl ? (
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
                    ) : null}
                    <div className="mt-3 text-xs text-white/60">
                      {uploaded
                        ? latest?.analysisStatus === "failed"
                          ? latest.analysisError ||
                            "AI analysis failed. Try re-uploading."
                          : latest?.analysisNotes ||
                            "AI analysis will appear here after processing."
                        : "Upload a drill video to generate AI feedback."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl">About me</h2>
              {isEditingAbout ? (
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider">
                  <button
                    className="rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    onClick={handleAboutSave}
                    disabled={aboutSaving}
                  >
                    {aboutSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="rounded-full border border-white/20 px-4 py-2 text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={handleAboutCancel}
                    disabled={aboutSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
                  type="button"
                  onClick={() => {
                    setIsEditingAbout(true);
                    setAboutMessage("");
                  }}
                >
                  Edit profile
                </button>
              )}
            </div>
            {aboutMessage ? (
              <p className="mt-2 text-sm text-white/70">{aboutMessage}</p>
            ) : null}
            <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Name
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="name"
                    value={aboutForm.name}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.name}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Sport / Position
                </div>
                {isEditingAbout ? (
                  <div className="mt-2 flex flex-col gap-3">
                    <select
                      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                      name="sport"
                      value={aboutForm.sport}
                      onChange={(event) =>
                        setAboutForm((prev) => ({
                          ...prev,
                          sport: event.target.value,
                          position:
                            positionOptions[event.target.value]?.[0] ?? "",
                        }))
                      }
                    >
                      <option value="lacrosse">Lacrosse</option>
                      <option value="hockey" disabled>
                        Hockey (coming soon)
                      </option>
                      <option value="football" disabled>
                        Football (coming soon)
                      </option>
                    </select>
                    <select
                      className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                      name="position"
                      value={aboutForm.position || availablePositions[0] || ""}
                      onChange={(event) =>
                        setAboutForm((prev) => ({
                          ...prev,
                          position: event.target.value,
                        }))
                      }
                    >
                      {availablePositions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    {aboutForm.sport
                      ? `${aboutForm.sport.charAt(0).toUpperCase() + aboutForm.sport.slice(1)} · ${aboutForm.position}`
                      : aboutForm.position}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Graduation year
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="gradYear"
                    value={aboutForm.gradYear}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.gradYear}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Location
                </div>
                {isEditingAbout ? (
                  <select
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="state"
                    value={aboutForm.state}
                    onChange={(event) =>
                      setAboutForm((prev) => ({
                        ...prev,
                        state: event.target.value,
                      }))
                    }
                  >
                    {[
                      "AL",
                      "AK",
                      "AZ",
                      "AR",
                      "CA",
                      "CO",
                      "CT",
                      "DE",
                      "FL",
                      "GA",
                      "HI",
                      "ID",
                      "IL",
                      "IN",
                      "IA",
                      "KS",
                      "KY",
                      "LA",
                      "ME",
                      "MD",
                      "MA",
                      "MI",
                      "MN",
                      "MS",
                      "MO",
                      "MT",
                      "NE",
                      "NV",
                      "NH",
                      "NJ",
                      "NM",
                      "NY",
                      "NC",
                      "ND",
                      "OH",
                      "OK",
                      "OR",
                      "PA",
                      "RI",
                      "SC",
                      "SD",
                      "TN",
                      "TX",
                      "UT",
                      "VT",
                      "VA",
                      "WA",
                      "WV",
                      "WI",
                      "WY",
                    ].map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>{aboutForm.state}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Height / Weight
                </div>
                {isEditingAbout ? (
                  <div className="mt-2 flex gap-3">
                    <input
                      className="w-1/2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                      name="height"
                      value={aboutForm.height}
                      onChange={handleAboutChange}
                    />
                    <input
                      className="w-1/2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                      name="weight"
                      value={aboutForm.weight}
                      onChange={handleAboutChange}
                    />
                  </div>
                ) : (
                  <div>{`${aboutForm.height} · ${aboutForm.weight}`}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  High school team
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="highSchoolTeam"
                    value={aboutForm.highSchoolTeam}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.highSchoolTeam}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Goal
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="goal"
                    value={aboutForm.goal}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.goal}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  GPA
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="gpa"
                    value={aboutForm.gpa}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.gpa}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Club team
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="clubTeam"
                    value={aboutForm.clubTeam}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.clubTeam}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Highlight tape
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="highlightTapeUrl"
                    value={aboutForm.highlightTapeUrl}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.highlightTapeUrl}</div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Account</h2>
            <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Username
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="username"
                    value={aboutForm.username}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.username}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Email
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="email"
                    value={aboutForm.email}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.email}</div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Preferences</h2>
            <div className="mt-4 grid gap-4 text-sm text-white/70">
              <div>
                {isEditingAbout ? (
                  <div className="mt-2">
                    <StateChecklist
                      name="relocateStates"
                      label="Willing-to-relocate states"
                      value={aboutForm.relocateStates}
                      onChange={(next) =>
                        setAboutForm((prev) => ({
                          ...prev,
                          relocateStates: next,
                        }))
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/50">
                      Willing-to-relocate states
                    </div>
                    <div className="mt-2">
                      {aboutForm.relocateStates.length
                        ? aboutForm.relocateStates.join(", ")
                        : "Not specified"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-xl">Socials</h2>
            <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  Instagram
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="instagram"
                    value={aboutForm.instagram}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.instagram}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  X
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="x"
                    value={aboutForm.x}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.x}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  TikTok
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="tiktok"
                    value={aboutForm.tiktok}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.tiktok}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">
                  YouTube
                </div>
                {isEditingAbout ? (
                  <input
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                    name="youtube"
                    value={aboutForm.youtube}
                    onChange={handleAboutChange}
                  />
                ) : (
                  <div>{aboutForm.youtube}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-white/50">
        AI reports auto-update when you add new videos or event links.
      </p>
    </PageShell>
  );
}
