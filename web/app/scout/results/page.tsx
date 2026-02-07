import Link from "next/link";
import PageShell from "../../_components/PageShell";

const sampleAthletes = [
  { name: "Jordan Wells", position: "Defender", grade: "A-", trait: "Speed" },
  { name: "Kai Thompson", position: "Midfield", grade: "B+", trait: "Vision" },
  { name: "Riley Chen", position: "Attack", grade: "A", trait: "Explosive" },
];

export default function ScoutResultsPage() {
  return (
    <PageShell
      title="Scout Results"
      subtitle="AI-ranked athletes that match your query."
      actions={
        <button className="rounded-full bg-yellow-400 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-black">
          Save this search
        </button>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-4 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-wider text-white/60">
          <span>Athlete</span>
          <span>Position</span>
          <span>AI Grade</span>
          <span>Top Trait</span>
        </div>
        <div className="divide-y divide-white/10">
          {sampleAthletes.map((athlete) => (
            <div
              key={athlete.name}
              className="grid grid-cols-4 gap-4 px-6 py-4 text-sm"
            >
              <Link
                className="text-white hover:text-yellow-300"
                href={`/scout/athlete/${encodeURIComponent(athlete.name)}`}
              >
                {athlete.name}
              </Link>
              <span className="text-white/70">{athlete.position}</span>
              <span className="text-white/70">{athlete.grade}</span>
              <span className="text-white/70">{athlete.trait}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
