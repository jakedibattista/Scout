"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageShell from "../../_components/PageShell";

type SearchResult = {
  id: string;
  name: string;
  summary: string;
};

type SavedSearch = {
  id: string;
  query: string;
  filters?: Record<string, unknown> | null;
};

type SearchStatus = "idle" | "searching" | "done" | "error";

export default function ScoutSearchPage() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [planJson, setPlanJson] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [lastFilters, setLastFilters] = useState<Record<string, unknown> | null>(
    null
  );
  const [lastSortBy, setLastSortBy] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("searching");
    setMessage("");
    setPlanJson("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const query = String(payload.query ?? "").trim();
    setLastQuery(query);
    setNotifyEnabled(false);
    const scoutUsername =
      typeof window !== "undefined"
        ? localStorage.getItem("scoutUsername")
        : null;

    try {
      const response = await fetch("/api/scout/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, scoutUsername }),
      });
      const data = await response.json();
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "Search failed.");
      }
      setResults(data.results ?? []);
      setLastFilters(data.parsedFilters ?? null);
      if (data.plan) {
        const merged = {
          ...data.plan,
          filters: data.parsedFilters ?? data.plan.filters,
        };
        setPlanJson(JSON.stringify(merged, null, 2));
        setLastSortBy(data.plan?.sort?.by ?? null);
      } else {
        setPlanJson("");
        setLastSortBy(null);
      }
      setStatus("done");
      setMessage(
        data.results?.length ? "Matches found." : "No matches yet."
      );
    } catch (error) {
      setStatus("error");
      setMessage("Search failed. Try again.");
    }
  }

  async function handleAddAlert() {
    if (!lastQuery) {
      return;
    }
    if (savedSearches.some((search) => search.query === lastQuery)) {
      setNotifyEnabled(true);
      return;
    }
    try {
      const scoutUsername =
        typeof window !== "undefined"
          ? localStorage.getItem("scoutUsername")
          : null;
      const response = await fetch("/api/scout/search/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: lastQuery,
          notifyEmail: true,
          scoutUsername,
          filters: lastFilters,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to save search.");
      }
    } catch (error) {
      // Non-blocking for MVP
    }
    if (!savedSearches.some((search) => search.query === lastQuery)) {
      setSavedSearches((prev) => [
        { id: `temp-${Date.now()}`, query: lastQuery, filters: lastFilters },
        ...prev,
      ]);
    }
    setNotifyEnabled(true);
  }

  async function handleRemoveSearch(item: SavedSearch) {
    setSavedSearches((prev) => prev.filter((search) => search.id !== item.id));
    if (item.query === lastQuery) {
      setNotifyEnabled(false);
    }

    try {
      const scoutUsername =
        typeof window !== "undefined"
          ? localStorage.getItem("scoutUsername")
          : null;
      await fetch("/api/scout/search/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, scoutUsername }),
      });
    } catch (error) {
      // Non-blocking for MVP
    }
  }

  async function loadSavedSearches() {
    const scoutUsername =
      typeof window !== "undefined"
        ? localStorage.getItem("scoutUsername")
        : null;
    if (!scoutUsername) return;

    try {
      const response = await fetch(
        `/api/scout/search/list?scoutUsername=${encodeURIComponent(
          scoutUsername
        )}`
      );
      const data = await response.json();
      if (response.ok && data.ok) {
        setSavedSearches(Array.isArray(data.searches) ? data.searches : []);
      }
    } catch (error) {
      // Non-blocking for MVP
    }
  }

  useEffect(() => {
    loadSavedSearches();
  }, []);

  useEffect(() => {
    if (!lastQuery) return;
    setNotifyEnabled(savedSearches.some((search) => search.query === lastQuery));
  }, [lastQuery, savedSearches]);

  return (
    <PageShell
      title="Scout Search"
      subtitle="Search with natural language and let the system translate it into filters."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black"
          type="button"
        >
          Find Athletes
        </button>
        <Link
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          href="/scout/about"
        >
          About Me
        </Link>
        </div>
        <Link
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white/70 hover:text-white"
          href="/"
        >
          Log out
        </Link>
      </div>
      <form
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
        onSubmit={handleSearch}
      >
        <h2 className="font-display text-xl">What are you looking for?</h2>
        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <input
            className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="query"
            placeholder="e.g., fastest defender in Maryland, DH with a 3.0 GPA"
            required
          />
          <button
            className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black"
            type="submit"
            disabled={status === "searching"}
          >
            {status === "searching" ? "Searching..." : "Run search"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {status === "error" && message ? (
            <p className="text-sm text-red-300">{message}</p>
          ) : null}
      {status === "done" && planJson ? (
        <details className="mt-4 text-xs text-white/60">
          <summary className="cursor-pointer uppercase tracking-wider text-white/50">
            View query plan
          </summary>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 text-white/70">
            {planJson}
          </pre>
        </details>
      ) : null}
          {status === "done" && lastQuery ? (
            <button
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
              type="button"
              onClick={handleAddAlert}
              disabled={notifyEnabled}
            >
              {notifyEnabled
                ? "Email alert enabled"
                : "Set up email alerts for this search"}
            </button>
          ) : null}
        </div>
      </form>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-3 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-wider text-white/60">
          <span>Athlete</span>
          <span>Scouting Report</span>
          <span>Actions</span>
        </div>
        {lastSortBy ? (
          <div className="border-b border-white/10 px-6 py-2 text-xs text-white/50">
            {lastSortBy === "speed_score"
              ? "Sorted by speed (shuttle + 20-yard dash)."
              : lastSortBy === "wall_ball_score"
                ? "Sorted by wall ball reps (60s)."
                : `Sorted by ${lastSortBy.replace(/_/g, " ")}.`}
          </div>
        ) : null}
        <div className="divide-y divide-white/10">
          {results.length ? (
            results.map((athlete) => (
              <div
                key={athlete.id}
                className="grid grid-cols-3 gap-4 px-6 py-4 text-sm"
              >
                <span className="text-white">{athlete.name}</span>
                <div className="text-xs text-white/60">
                  {athlete.summary}
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
                  <Link
                    className="text-yellow-300 hover:text-yellow-200"
                    href={`/scout/athlete/${encodeURIComponent(athlete.id)}`}
                  >
                    View Profile
                  </Link>
                  <span className="text-white/30">/</span>
                  <button
                    className="text-yellow-300 hover:text-yellow-200"
                    type="button"
                  >
                    CONTACT
                  </button>
                </div>
              </div>
            ))
          ) : status === "done" ? (
            <div className="px-6 py-6 text-sm text-white/60">
              No matches found with the current filters.
            </div>
          ) : (
            <div className="px-6 py-6 text-sm text-white/60">
              Results will appear here after you search.
            </div>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Actively Recruiting</h3>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-white/70">
          {savedSearches.length ? (
            savedSearches.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
              >
                <span>{item.query}</span>
                <button
                  className="text-xs font-semibold uppercase tracking-wider text-yellow-300"
                  type="button"
                  onClick={() => handleRemoveSearch(item)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-white/50">
              No active searches yet.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
