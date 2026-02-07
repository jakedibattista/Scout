import Link from "next/link";
import PageShell from "../../../_components/PageShell";

type AthleteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AthleteDetailPage({
  params,
}: AthleteDetailPageProps) {
  const { id } = await params;
  const athleteName = decodeURIComponent(id);

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
            {athleteName} · athlete@email.com · MD
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
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
              Top traits: Speed, field vision, endurance
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
              Recommended level: D1-ready
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-display text-xl">Videos</h2>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            {[
              {
                title: "Drill 1: Speed ladder",
                grade: "A-",
                date: "Jan 12, 2026",
                notes: "Explosive first step, clean footwork.",
              },
              {
                title: "Drill 2: Shuttle run",
                grade: "B+",
                date: "Jan 12, 2026",
                notes: "Good change of direction, slight balance loss.",
              },
              {
                title: "Drill 3: Position-specific",
                grade: "A",
                date: "Jan 12, 2026",
                notes: "Strong positioning and reaction time.",
              },
            ].map((drill) => (
              <div
                key={drill.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div className="flex items-center justify-between text-sm text-white">
                  <span>{drill.title}</span>
                  <span className="text-xs text-yellow-300">
                    Grade: {drill.grade}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <button
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                    type="button"
                  >
                    View video
                  </button>
                  <span>Grade: {drill.grade}</span>
                  <span>Date: {drill.date}</span>
                  <span>Notes: {drill.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
