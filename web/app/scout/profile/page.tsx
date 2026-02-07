"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../_components/PageShell";
import StateChecklist from "../../_components/StateChecklist";

type FormStatus = "idle" | "saving" | "saved" | "error";

export default function ScoutProfilePage() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState("lacrosse");
  const [pendingPosition, setPendingPosition] = useState("Attack");

  const positionOptions: Record<string, string[]> = {
    lacrosse: ["Attack", "Midfield", "Defense", "Goalie", "Faceoff"],
    hockey: ["Forward", "Defense", "Goalie"],
    football: ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"],
  };
  const availablePositions = positionOptions[selectedSport] ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/scout/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to save profile.");
      }
      const username = String(payload.username ?? "");
      if (typeof window !== "undefined" && username) {
        localStorage.setItem("scoutUsername", username);
      }
      setStatus("saved");
      setMessage("Profile saved.");
      router.push("/scout/search");
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return (
    <PageShell
      title="Scout Profile"
      subtitle="Create your scouting profile. For best accuracy in athlete searches, fill out every field."
    >
      <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl">Required</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <label className="flex flex-col gap-2">
              Name
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="name"
                placeholder="Scout name"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Username
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="username"
                placeholder="scoutname"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Email
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="email"
                type="email"
                placeholder="name@school.edu"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Password
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="password"
                type="password"
                placeholder="Create a password"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Sport
              <select
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="sport"
                required
                defaultValue="lacrosse"
                onChange={(event) => {
                  setSelectedSport(event.target.value);
                  setSelectedPositions([]);
                  setPendingPosition(
                    positionOptions[event.target.value]?.[0] ?? ""
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
              School / Program
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="program"
                placeholder="University / Club"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Program level
              <select
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="level"
                required
                defaultValue="D1"
              >
                <option value="D1">D1</option>
                <option value="D2">D2</option>
                <option value="D3">D3</option>
                <option value="JUCO">JUCO</option>
                <option value="Club">Club</option>
              </select>
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl">Optional</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <StateChecklist
              name="recruitingStates"
              label="Recruiting states"
            />
            <label className="flex flex-col gap-2">
              Minimum age
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                name="minAge"
                type="number"
                min={10}
                max={25}
                placeholder="16"
              />
            </label>
            <div className="flex flex-col gap-3">
              <div className="text-xs uppercase tracking-wider text-white/50">
                Positions recruiting
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
                  value={pendingPosition}
                  onChange={(event) => setPendingPosition(event.target.value)}
                >
                  {availablePositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                  type="button"
                  onClick={() => {
                    if (!pendingPosition) return;
                    if (selectedPositions.includes(pendingPosition)) return;
                    setSelectedPositions((prev) => [...prev, pendingPosition]);
                  }}
                >
                  Add position
                </button>
                <button
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                  type="button"
                  onClick={() =>
                    setSelectedPositions([...availablePositions])
                  }
                >
                  Select all
                </button>
              </div>
              {selectedPositions.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-white/70">
                  {selectedPositions.map((position) => (
                    <div
                      key={position}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                    >
                      <input
                        type="hidden"
                        name="positionFocus"
                        value={position}
                      />
                      <span>{position}</span>
                      <button
                        className="text-white/50 hover:text-white"
                        type="button"
                        onClick={() =>
                          setSelectedPositions((prev) =>
                            prev.filter((item) => item !== position)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50">
                  No positions selected yet.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-3">
          <button
            className="w-full rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black md:w-fit"
            type="submit"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save profile"}
          </button>
          {message ? (
            <p
              className={`text-sm ${
                status === "error" ? "text-red-300" : "text-white/70"
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
