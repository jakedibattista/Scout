type PageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  children,
  actions,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-12">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-300">
              Scout MVP
            </p>
            <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
            {subtitle ? (
              <p className="max-w-2xl text-white/70">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
