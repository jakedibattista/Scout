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
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-12">
        <header className="flex flex-col gap-4 border-b border-line pb-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-accent">Scout</p>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-2xl text-muted">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
