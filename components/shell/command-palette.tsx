"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NAV_SECTIONS } from "@/components/shell/nav";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils";

/** ⌘K / Ctrl+K quick navigation - only lists pages the admin is allowed to open. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { canRead } = usePermissions();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    const all = NAV_SECTIONS.flatMap((s) => s.items.map((item) => ({ ...item, section: s.title })))
      .filter((item) => !item.area || canRead(item.area));
    const q = query.trim().toLowerCase();
    return q ? all.filter((i) => `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(q)) : all;
  }, [query, canRead]);

  // Start from the top whenever the palette reopens.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setActive(0);
  }

  function go(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg -translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Go to</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && items[active]) go(items[active].href);
            }}
            placeholder="Jump to a page…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search pages"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matching pages</li>}
          {items.map((item, i) => (
            <li key={item.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  i === active ? "bg-primary-500/10 text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-4", i === active && "text-primary-600 dark:text-primary-400")} />
                <span className="flex-1">{item.label}</span>
                <span className="text-[11px] text-muted-foreground/70">{item.section}</span>
                {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
