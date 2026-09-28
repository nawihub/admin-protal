"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Search, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_SECTIONS } from "@/components/shell/nav";
import { isActive } from "@/components/shell/sidebar";
import { initials, roleLabel } from "@/components/shell/user-initials";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

function useSectionTitle() {
  const pathname = usePathname();
  const items = NAV_SECTIONS.flatMap((s) => s.items);
  // Longest matching href wins (so "/" doesn't swallow everything).
  const match = items.filter((i) => isActive(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "Dashboard";
}

export function Topbar({ onOpenMenu, onOpenPalette }: { onOpenMenu: () => void; onOpenPalette: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const title = useSectionTitle();

  async function signOut() {
    await authApi.logout();
    useAuthStore.getState().clear();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <header className="glass sticky top-0 z-sticky flex h-16 items-center gap-3 border-b border-border/70 px-4 sm:px-6">
      <button type="button" onClick={onOpenMenu} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <h2 key={title} className="animate-fade-in font-display text-lg font-semibold">{title}</h2>

      <button
        type="button"
        onClick={onOpenPalette}
        className="group ml-auto hidden h-9 w-64 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 text-sm text-muted-foreground transition-all hover:border-primary-400/60 hover:shadow-sm sm:flex"
      >
        <Search className="size-4 transition-transform group-hover:scale-110" />
        Jump to…
        <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[10px]">⌘K</kbd>
      </button>
      <button type="button" onClick={onOpenPalette} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted sm:hidden" aria-label="Search">
        <Search className="size-5" />
      </button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full transition-transform duration-normal ease-spring hover:scale-105" aria-label="Account menu">
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 text-xs font-semibold text-white shadow-md ring-2 ring-card">
              {initials(user?.firstName, user?.lastName)}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs font-normal text-muted-foreground">{user ? roleLabel(user.permissions) : ""}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile"><UserRound /> My profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
