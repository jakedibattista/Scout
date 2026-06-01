import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pb-24 pt-10">
        <nav className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight">
            Scout
          </span>
          <Link
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
            href="/login"
          >
            Log in
          </Link>
        </nav>

        <section className="flex max-w-3xl flex-col gap-6">
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Recruiting, backed by the tape.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            Athletes build a profile with film and AI-generated scouting
            reports. Scouts search in plain language to find players who fit
            what they need.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-accent-soft"
              href="/scout/profile"
            >
              I am a scout
            </Link>
            <Link
              className="rounded-xl border border-line-strong px-6 py-3 text-sm font-medium text-ink transition hover:border-ink"
              href="/athlete/profile"
            >
              I am an athlete
            </Link>
          </div>
        </section>

        <section className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          <div className="flex flex-col gap-3 bg-surface p-8">
            <h2 className="text-lg font-semibold">For athletes</h2>
            <p className="text-muted">
              Upload drills and game film. Scout turns each clip into measurable
              metrics and a report you can share with college programs.
            </p>
          </div>
          <div className="flex flex-col gap-3 bg-surface p-8">
            <h2 className="text-lg font-semibold">For scouts</h2>
            <p className="text-muted">
              Describe the player you are looking for and review ranked matches
              with the film and numbers behind every result.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
