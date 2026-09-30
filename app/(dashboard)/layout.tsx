"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { BatchJobWatcher } from "@/components/notifications/batch-job-watcher";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/lib/store/auth-store";

const COLLAPSE_KEY = "nwh-admin-sidebar-collapsed";

// Remembered per browser - a convenience, so storage failures are ignored.
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const storedCollapsed = useSyncExternalStore(subscribeStorage, readCollapsed, () => false);
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const collapsed = collapsedOverride ?? storedCollapsed;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    // A PENDING admin signed in with a one-time code and must set a password first.
    else if (status === "authenticated" && user?.status === "PENDING") router.replace("/set-password");
  }, [status, user?.status, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status !== "authenticated" || user?.status !== "ACTIVE") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="animate-pulse-subtle"><Logo size="lg" href={null} /></div>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="app-aura" aria-hidden />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => {
          const next = !collapsed;
          setCollapsedOverride(next);
          try {
            localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
          } catch {}
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <BatchJobWatcher />
    </div>
  );
}
