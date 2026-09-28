"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_SECTIONS, type NavItem } from "@/components/shell/nav";
import { initials, roleLabel } from "@/components/shell/user-initials";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useBusinessCount, useEntrepreneurCount, useIdeaCount, useOpportunityCount } from "@/lib/queries/counts";
import { cn } from "@/lib/utils";

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Queue sizes shown next to each moderation area - only fetched for areas the admin can see. */
function useQueueCounts() {
  const { canRead } = usePermissions();
  return {
    ideas: useIdeaCount("PUBLISHED", canRead("bigIdeas")).data,
    opportunities: useOpportunityCount("PENDING", canRead("opportunities")).data,
    businesses: useBusinessCount("PENDING", canRead("businesses")).data,
    entrepreneurs: useEntrepreneurCount({ status: "PENDING" }, canRead("entrepreneurs")).data,
  };
}

function NavLink({ item, active, collapsed, count, onNavigate }: {
  item: NavItem; active: boolean; collapsed: boolean; count?: number; onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-normal",
        active
          ? "bg-primary-500/12 text-primary-700 dark:bg-primary-400/15 dark:text-primary-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {/* Glowing indicator that grows in for the active item */}
      <span
        className={cn(
          "nav-indicator absolute -left-3 top-2 bottom-2 w-1 origin-center rounded-r-full bg-primary-500 transition-transform duration-slow ease-spring",
          active ? "scale-y-100" : "scale-y-0",
        )}
        aria-hidden
      />
      <item.icon className={cn("size-[18px] shrink-0 transition-transform duration-normal ease-spring group-hover:scale-110", active && "text-primary-600 dark:text-primary-400")} />
      {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
      {!!count && count > 0 && (
        <span
          className={cn(
            "animate-scale-in rounded-full bg-secondary-500 font-mono text-[10px] font-semibold text-white",
            collapsed ? "absolute right-1 top-1 size-2 p-0 text-[0px]" : "ml-auto min-w-5 px-1.5 py-0.5 text-center",
          )}
          aria-label={`${count} waiting`}
        >
          {collapsed ? "" : count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {!!count && ` · ${count} waiting`}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { user, canRead } = usePermissions();
  const counts = useQueueCounts();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.area || canRead(item.area)),
  })).filter((section) => section.items.length > 0);

  const content = (isMobile: boolean) => {
    const compact = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex h-16 items-center gap-2 px-5", compact && "justify-center px-0")}>
          <Logo size="sm" markOnly={compact} href="/" />
          {!compact && (
            <span className="rounded-md bg-secondary-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-secondary-700 dark:text-secondary-300">
              Admin
            </span>
          )}
          {isMobile && (
            <button type="button" onClick={onCloseMobile} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close menu">
              <X className="size-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
          {sections.map((section, s) => (
            <div key={section.title} className="animate-slide-in-left" style={{ animationDelay: `${s * 70}ms` }}>
              {!compact && (
                <p className="mb-2 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{section.title}</p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    collapsed={compact}
                    count={item.badge ? counts[item.badge] : undefined}
                    onNavigate={isMobile ? onCloseMobile : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/70 p-3">
          <div className={cn("flex items-center gap-3 rounded-xl p-2", compact && "justify-center")}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-xs font-semibold text-white shadow-md ring-2 ring-card">
              {initials(user?.firstName, user?.lastName)}
            </span>
            {!compact && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="truncate text-xs text-muted-foreground">{user ? roleLabel(user.permissions) : ""}</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={cn("mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", compact && "justify-center px-0")}
              aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronsLeft className={cn("size-4 transition-transform duration-slow ease-spring", compact && "rotate-180")} />
              {!compact && "Collapse"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-border/70 bg-card/60 backdrop-blur-xl transition-[width] duration-slow ease-out lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        {content(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-modal lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="animate-slide-in-left absolute inset-y-0 left-0 w-[280px] border-r border-border bg-card shadow-xl">
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
}
