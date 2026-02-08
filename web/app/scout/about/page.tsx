"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import PageShell from "../../_components/PageShell";
import StateChecklist from "../../_components/StateChecklist";
import { db } from "@/lib/firebase";

type ScoutProfileForm = {
  name: string;
  email: string;
  program: string;
  sport: string;
  genderFocus: string;
  level: string;
  recruitingStates: string[];
  gradYearsRecruiting: number[];
  positionFocus: string[];
};

export default function ScoutAboutPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ScoutProfileForm>({
    name: "Scout Name",
    email: "scout@email.com",
    program: "Program Name",
    sport: "Lacrosse",
    genderFocus: "male",
    level: "D1",
    recruitingStates: ["MD", "VA", "PA"],
    gradYearsRecruiting: [2026, 2027],
    positionFocus: ["Defender", "Midfield"],
  });
  const [message, setMessage] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const sportOptions = [
    { value: "lacrosse", label: "Lacrosse" },
    { value: "hockey", label: "Hockey (coming soon)" },
    { value: "football", label: "Football (coming soon)" },
  ];

  const positionOptions: Record<string, string[]> = {
    lacrosse: ["Attack", "Midfield", "Defense", "Goalie", "Faceoff"],
    hockey: ["Forward", "Defense", "Goalie"],
    football: ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"],
  };

  const availablePositions = positionOptions[form.sport] ?? [];
  const [pendingPosition, setPendingPosition] = useState(
    availablePositions[0] ?? ""
  );
  const [pendingGradYear, setPendingGradYear] = useState(2026);

  useEffect(() => {
    async function loadProfile() {
      if (typeof window === "undefined") return;
      const username = localStorage.getItem("scoutUsername");
      if (!username) return;

      const snapshot = await getDoc(doc(db, "scoutProfiles", username));
      if (!snapshot.exists()) return;
      const profile = snapshot.data();
      const nextSport = String(profile.sport ?? "lacrosse");

      setForm({
        name: String(profile.name ?? ""),
        email: String(profile.email ?? ""),
        program: String(profile.program ?? ""),
        sport: nextSport,
        genderFocus: String(profile.genderFocus ?? "male"),
        level: String(profile.level ?? ""),
        recruitingStates: Array.isArray(profile.recruitingStates)
          ? profile.recruitingStates
          : [],
        gradYearsRecruiting: Array.isArray(profile.gradYearsRecruiting)
          ? profile.gradYearsRecruiting
          : [],
        positionFocus: Array.isArray(profile.positionFocus)
          ? profile.positionFocus
          : [],
      });
      setPendingPosition(positionOptions[nextSport]?.[0] ?? "");
    }

    loadProfile();
  }, []);

  async function handleSave() {
    try {
      const username =
        typeof window !== "undefined"
          ? localStorage.getItem("scoutUsername")
          : null;
      const response = await fetch("/api/scout/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username }),
      });
      if (!response.ok) {
        throw new Error("Failed to save profile.");
      }
      setIsEditing(false);
      setMessage("Demographics updated.");
    } catch (error) {
      setMessage("Unable to save updates.");
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setMessage("");
  }

  return (
    <PageShell
      title="Scout About Me"
      subtitle="Update your scouting demographics to improve matches."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
            href="/scout/search"
          >
            Find Athletes
          </Link>
          <button
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black"
            type="button"
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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Profile</h2>
          {isEditing ? (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider">
              <button
                className="rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black"
                type="button"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="rounded-full border border-white/20 px-4 py-2 text-white/70 hover:text-white"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
              type="button"
              onClick={() => {
                setIsEditing(true);
                setMessage("");
              }}
            >
              Edit profile
            </button>
          )}
        </div>
        {message ? (
          <p className="mt-2 text-sm text-white/70">{message}</p>
        ) : null}
        <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Name
            </div>
            {isEditing ? (
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            ) : (
              <div>{form.name}</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Email
            </div>
            {isEditing ? (
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            ) : (
              <div>{form.email}</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              School / Program
            </div>
            {isEditing ? (
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="program"
                value={form.program}
                onChange={handleChange}
              />
            ) : (
              <div>{form.program}</div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Sport
            </div>
            {isEditing ? (
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="sport"
                value={form.sport}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sport: event.target.value,
                    positionFocus: [],
                  }))
                }
              >
                {sportOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                {form.sport
                  ? form.sport.charAt(0).toUpperCase() + form.sport.slice(1)
                  : ""}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Recruiting Gender
            </div>
            {isEditing ? (
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="genderFocus"
                value={form.genderFocus}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="both">Both</option>
              </select>
            ) : (
              <div>
                {form.genderFocus
                  ? form.genderFocus.charAt(0).toUpperCase() +
                    form.genderFocus.slice(1)
                  : "--"}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Program Level
            </div>
            {isEditing ? (
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-white"
                name="level"
                value={form.level}
                onChange={handleChange}
              />
            ) : (
              <div>{form.level}</div>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Recruiting Preferences</h2>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Recruiting States
            </div>
            {isEditing ? (
              <div className="mt-2">
                <StateChecklist
                  name="recruitingStates"
                  label=""
                  value={form.recruitingStates}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, recruitingStates: next }))
                  }
                />
              </div>
            ) : (
              <div>
                {form.recruitingStates.length
                  ? form.recruitingStates.join(", ")
                  : "None selected"}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Graduation Years Recruiting
            </div>
            {isEditing ? (
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
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
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                    type="button"
                    onClick={() => {
                      if (form.gradYearsRecruiting.includes(pendingGradYear))
                        return;
                      setForm((prev) => ({
                        ...prev,
                        gradYearsRecruiting: [
                          ...prev.gradYearsRecruiting,
                          pendingGradYear,
                        ],
                      }));
                    }}
                  >
                    Add year
                  </button>
                </div>
                {form.gradYearsRecruiting.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-white/70">
                    {form.gradYearsRecruiting.map((year) => (
                      <div
                        key={year}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                      >
                        <span>{year}</span>
                        <button
                          className="text-white/50 hover:text-white"
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              gradYearsRecruiting: prev.gradYearsRecruiting.filter(
                                (item) => item !== year
                              ),
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/50">
                    No years selected yet.
                  </p>
                )}
              </div>
            ) : (
              <div>
                {form.gradYearsRecruiting.length
                  ? form.gradYearsRecruiting.join(", ")
                  : "None selected"}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Position Focus
            </div>
            {isEditing ? (
              <div className="mt-2 flex flex-col gap-3">
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
                      if (form.positionFocus.includes(pendingPosition)) return;
                      setForm((prev) => ({
                        ...prev,
                        positionFocus: [...prev.positionFocus, pendingPosition],
                      }));
                    }}
                  >
                    Add position
                  </button>
                </div>
                {form.positionFocus.length ? (
                  <div className="flex flex-wrap gap-2 text-xs text-white/70">
                    {form.positionFocus.map((position) => (
                      <div
                        key={position}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
                      >
                        <span>{position}</span>
                        <button
                          className="text-white/50 hover:text-white"
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              positionFocus: prev.positionFocus.filter(
                                (item) => item !== position
                              ),
                            }))
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
            ) : (
              <div>
                {form.positionFocus.length
                  ? form.positionFocus.join(", ")
                  : "None selected"}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
