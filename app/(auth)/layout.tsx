import { ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { Logo } from "@/components/logo";

const HIGHLIGHTS = [
  { icon: TrendingUp, title: "One view of the platform", text: "Queues, trends and activity across every service." },
  { icon: ShieldCheck, title: "Permission-aware", text: "Everyone sees exactly what their role allows." },
  { icon: Users, title: "Built for the team", text: "Review ideas, register businesses and vet founders together." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-neutral-900 text-white lg:block">
        <div className="absolute inset-0" aria-hidden>
          <div className="animate-drift absolute -left-24 -top-24 size-[28rem] rounded-full bg-primary-500/35 blur-[110px]" />
          <div className="animate-drift absolute -bottom-32 right-0 size-[26rem] rounded-full bg-secondary-500/30 blur-[110px] [animation-delay:-6s]" />
          <div className="tile-pattern absolute inset-0 opacity-40" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="animate-fade-in-up flex items-center gap-3">
            <Logo size="md" href={null} className="text-white" />
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/80">Admin</span>
          </div>
          <div className="max-w-md">
            <p className="animate-fade-in-up flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-secondary-300 [animation-delay:80ms]">
              <Sparkles className="size-3.5" /> Operations console
            </p>
            <h1 className="animate-fade-in-up mt-4 font-display text-4xl font-semibold leading-tight [animation-delay:160ms]">
              Run Sierra Leone&rsquo;s entrepreneurship platform from one place.
            </h1>
            <ul className="mt-10 space-y-5">
              {HIGHLIGHTS.map((h, i) => (
                <li key={h.title} className="stagger-in flex gap-4" style={{ "--stagger": i + 3 } as React.CSSProperties}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <h.icon className="size-5 text-primary-300" />
                  </span>
                  <span>
                    <span className="block font-semibold">{h.title}</span>
                    <span className="text-sm text-white/65">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-white/40">Authorized NaWeHub staff only. Activity is logged.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <div className="app-aura" aria-hidden />
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
