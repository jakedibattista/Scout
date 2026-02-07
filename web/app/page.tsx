import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f1f1f,transparent_55%)]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />

        <main className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-12">
          <nav className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/70">
            <span className="font-display text-base tracking-[0.4em]">Scout</span>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-white/50 md:inline">
                Modern scouting, built for 2026
              </span>
              <Link
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
                href="/login"
              >
                Log in
              </Link>
            </div>
          </nav>

          <section className="flex flex-col gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
              The future of recruiting
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-6xl">
              Scout the next generation in minutes, not months.
            </h1>
            <p className="max-w-2xl text-lg text-white/70">
              Two workflows. One platform. Athletes build a living profile with
              AI scouting reports. Scouts run natural language searches to find
              hidden talent fast.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-yellow-300"
                href="/scout/profile"
              >
                I’m a scout
              </Link>
              <Link
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white/60"
                href="/athlete/profile"
              >
                I’m an athlete
              </Link>
            </div>
          </section>

          
        </main>
      </div>
    </div>
  );
}
