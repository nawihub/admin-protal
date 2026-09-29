"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tracks the pointer for the spotlight and a gentle tilt toward it (CSS: `.tile`). */
function track(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
  el.style.setProperty("--rx", `${((0.5 - y) * 4).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${((x - 0.5) * 5).toFixed(2)}deg`);
}

function reset(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

/** Card shell for grid views. Put a <TileLink> inside to make the whole card one target. */
export function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article
      onPointerMove={track}
      onPointerLeave={reset}
      className={cn("tile stat-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}
    >
      {children}
    </article>
  );
}

/**
 * The card's title, stretched (via ::after) over the whole card so it's a single link or button
 * without nesting other interactive elements inside it. Controls that must stay clickable sit
 * above it with `relative z-[2]`.
 */
export function TileLink({ href, onClick, className, children }: { href?: string; onClick?: () => void; className?: string; children: React.ReactNode }) {
  const cls = cn(
    "text-left outline-none after:absolute after:inset-0 after:z-[1] after:content-[''] transition-colors group-hover:text-primary-700 dark:group-hover:text-primary-300",
    className,
  );
  return href ? <Link href={href} className={cls}>{children}</Link> : <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** Segmented progress meter (e.g. idea stage, registration progress). */
export function SegmentMeter({ value, total, tone = "primary", label }: { value: number; total: number; tone?: "primary" | "secondary" | "error"; label: string }) {
  const fill = { primary: "bg-primary-500", secondary: "bg-secondary-400", error: "bg-error" }[tone];
  return (
    <div className="flex gap-1" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className={cn("animate-grow-x block h-full origin-left rounded-full", i < value ? fill : "bg-transparent")}
            style={{ animationDelay: `${150 + i * 90}ms`, animationFillMode: "both" }}
          />
        </span>
      ))}
    </div>
  );
}

const GRADIENTS = [
  "from-primary-400 to-primary-700",
  "from-secondary-300 to-secondary-600",
  "from-primary-400 to-info",
  "from-info to-primary-600",
  "from-secondary-400 to-error",
  "from-primary-300 to-primary-600",
];

/** A stable brand gradient per name, so the same business or person always gets the same colours. */
export function gradientFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
