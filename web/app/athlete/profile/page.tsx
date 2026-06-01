"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageShell from "../../_components/PageShell";
import StateChecklist from "../../_components/StateChecklist";

type FormStatus = "idle" | "saving" | "saved" | "error";

export default function AthleteProfilePage() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState("lacrosse");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [pendingOffer, setPendingOffer] = useState("");
  const [offers, setOffers] = useState<string[]>([]);

  const positionOptions: Record<string, string[]> = {
    lacrosse: ["Attack", "Midfield", "Defense", "Goalie", "Faceoff"],
    hockey: ["Forward", "Defense", "Goalie"],
    football: ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"],
  };
  const availablePositions = positionOptions[selectedSport] ?? [];
  const resolvedPosition =
    selectedPosition || availablePositions[0] || "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/athlete/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to save profile.");
      }
      setStatus("saved");
      setMessage("Profile saved.");
      if (typeof window !== "undefined" && payload.username) {
        localStorage.setItem("athleteUsername", String(payload.username));
      }
      router.push("/athlete/upload");
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return (
    <PageShell
      title="Athlete Profile"
      subtitle="Create your profile to start getting scouted."
    >
      <form
        className="grid gap-6 md:grid-cols-2"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const target = event.target as HTMLElement | null;
          if (!target) return;
          const tagName = target.tagName.toLowerCase();
          if (tagName === "textarea") return;
          event.preventDefault();
        }}
      >
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Required</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <label className="flex flex-col gap-2">
              Name
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="name"
                placeholder="Athlete name"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Username
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="username"
                placeholder="athletename"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Email
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="email"
                type="email"
                placeholder="name@email.com"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Password
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="password"
                type="password"
                placeholder="Create a password"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              State
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="state"
                required
                defaultValue="MD"
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
            </label>
            <label className="flex flex-col gap-2">
              Sport
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="sport"
                required
                defaultValue="lacrosse"
                onChange={(event) => {
                  const nextSport = event.target.value;
                  setSelectedSport(nextSport);
                  setSelectedPosition(
                    positionOptions[nextSport]?.[0] ?? ""
                  );
                }}
              >
                <option value="lacrosse">Lacrosse</option>
                <option value="hockey" disabled>
                  Hockey (coming soon)
                </option>
                <option value="football" disabled>
                  Football (coming soon)
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              Gender
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="gender"
                required
                defaultValue="male"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              Position
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="position"
                required={availablePositions.length > 0}
                value={resolvedPosition}
                onChange={(event) => setSelectedPosition(event.target.value)}
              >
                {availablePositions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              Height
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="height"
                placeholder="6'1"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Weight
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="weight"
                placeholder="185 lb"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Graduation year
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="gradYear"
                type="number"
                min={2026}
                max={2035}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              High school team
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="highSchoolTeam"
                placeholder="High school team name"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Goal
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="goal"
                placeholder="Go D1"
                required
              />
            </label>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Optional</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <label className="flex flex-col gap-2">
              Instagram
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="instagram"
                placeholder="@username"
              />
            </label>
            <label className="flex flex-col gap-2">
              X
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="x"
                placeholder="@username"
              />
            </label>
            <label className="flex flex-col gap-2">
              TikTok
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="tiktok"
                placeholder="@username"
              />
            </label>
            <label className="flex flex-col gap-2">
              YouTube
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="youtube"
                placeholder="@username"
              />
            </label>
            <label className="flex flex-col gap-2">
              Highlight tape
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="highlightTapeUrl"
                placeholder="https://youtube.com/..."
              />
            </label>
            <label className="flex flex-col gap-2">
              Club team
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="clubTeam"
                placeholder="Club team name"
              />
            </label>
            <label className="flex flex-col gap-2">
              GPA
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="gpa"
                type="number"
                step="0.1"
                min={0}
                max={4}
                placeholder="3.5"
              />
            </label>
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-faint">
                Current offers
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="flex-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink"
                  value={pendingOffer}
                  onChange={(event) => setPendingOffer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                  placeholder="Add offer"
                />
                <button
                  className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
                  type="button"
                  onClick={() => {
                    if (!pendingOffer.trim()) return;
                    const next = pendingOffer.trim();
                    if (offers.includes(next)) return;
                    setOffers((prev) => [...prev, next]);
                    setPendingOffer("");
                  }}
                >
                  Add offer
                </button>
              </div>
              {offers.length ? (
                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  {offers.map((offer) => (
                    <div
                      key={offer}
                      className="flex items-center gap-2 rounded-lg border border-line px-3 py-1"
                    >
                      <input type="hidden" name="currentOffers" value={offer} />
                      <span>{offer}</span>
                      <button
                        className="text-faint transition hover:text-ink"
                        type="button"
                        onClick={() =>
                          setOffers((prev) =>
                            prev.filter((item) => item !== offer)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint">No offers added yet.</p>
              )}
            </div>
            <StateChecklist
              name="relocateStates"
              label="Willing-to-relocate state"
            />
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-3">
          <button
            className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-soft md:w-fit"
            type="submit"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save profile"}
          </button>
          {message ? (
            <p
              className={`text-sm ${
                status === "error" ? "text-danger" : "text-muted"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </PageShell>
  );
}
