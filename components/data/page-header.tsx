export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="animate-fade-in-up">
        {eyebrow && <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        <span className="gradient-underline mt-2 block h-1 w-14 origin-left animate-grow-x rounded-full" aria-hidden />
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 animate-scale-in [animation-delay:120ms] [animation-fill-mode:both]">{actions}</div>}
    </div>
  );
}
