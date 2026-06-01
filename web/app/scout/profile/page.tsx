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
  const [selectedGradYears, setSelectedGradYears] = useState<number[]>([]);
  const [pendingGradYear, setPendingGradYear] = useState(2026);

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
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error ? String(data.error) : "Failed to save profile."
        );
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
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again."
      );
    }
  }

  return (
    <PageShell
      title="Scout Profile"
      subtitle="Create your scouting profile. For best accuracy in athlete searches, fill out every field."
    >
      <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Required</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <label className="flex flex-col gap-2">
              Name
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="name"
                placeholder="Scout name"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Username
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="username"
                placeholder="scoutname"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Email
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="email"
                type="email"
                placeholder="name@school.edu"
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
              Sport
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
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
              Recruiting gender
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="genderFocus"
                required
                defaultValue="male"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="both">Both</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              School / Program
              <input
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
                name="program"
                placeholder="University / Club"
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              Program level
              <select
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
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
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Optional</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <StateChecklist
              name="recruitingStates"
              label="Recruiting states"
            />
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-faint">
                Graduation years recruiting
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink"
                  value={pendingGradYear}
                  onChange={(event) =>
                    setPendingGradYear(Number(event.target.value))
                  }
                >
                  {Array.from({ length: 10 }, (_, idx) => 2026 + idx).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
                <button
                  className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
                  type="button"
                  onClick={() => {
                    if (selectedGradYears.includes(pendingGradYear)) return;
                    setSelectedGradYears((prev) => [
                      ...prev,
                      pendingGradYear,
                    ]);
                  }}
                >
                  Add year
                </button>
              </div>
              {selectedGradYears.length ? (
                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  {selectedGradYears.map((year) => (
                    <div
                      key={year}
                      className="flex items-center gap-2 rounded-lg border border-line px-3 py-1"
                    >
                      <input
                        type="hidden"
                        name="gradYearsRecruiting"
                        value={year}
                      />
                      <span>{year}</span>
                      <button
                        className="text-faint transition hover:text-ink"
                        type="button"
                        onClick={() =>
                          setSelectedGradYears((prev) =>
                            prev.filter((item) => item !== year)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint">
                  No years selected yet.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-faint">
                Positions recruiting
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink"
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
                  className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
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
                  className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
                  type="button"
                  onClick={() =>
                    setSelectedPositions([...availablePositions])
                  }
                >
                  Select all
                </button>
              </div>
              {selectedPositions.length ? (
                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  {selectedPositions.map((position) => (
                    <div
                      key={position}
                      className="flex items-center gap-2 rounded-lg border border-line px-3 py-1"
                    >
                      <input
                        type="hidden"
                        name="positionFocus"
                        value={position}
                      />
                      <span>{position}</span>
                      <button
                        className="text-faint transition hover:text-ink"
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
                <p className="text-sm text-faint">
                  No positions selected yet.
                </p>
              )}
            </div>
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
