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
        <button className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-on-accent transition hover:bg-accent-soft">
          Save this search
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-4 gap-4 border-b border-line px-6 py-4 text-sm font-medium text-faint">
          <span>Athlete</span>
          <span>Position</span>
          <span>AI grade</span>
          <span>Top trait</span>
        </div>
        <div className="divide-y divide-line">
          {sampleAthletes.map((athlete) => (
            <div
              key={athlete.name}
              className="grid grid-cols-4 gap-4 px-6 py-4 text-sm"
            >
              <Link
                className="text-ink transition hover:text-accent"
                href={`/scout/athlete/${encodeURIComponent(athlete.name)}`}
              >
                {athlete.name}
              </Link>
              <span className="text-muted">{athlete.position}</span>
              <span className="text-muted">{athlete.grade}</span>
              <span className="text-muted">{athlete.trait}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
