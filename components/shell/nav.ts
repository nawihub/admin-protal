import {
  Building2, ClipboardList, FolderOpen, HandCoins, LayoutDashboard, Lightbulb, ShieldCheck, Trophy, UserRound, Users,
  type LucideIcon,
} from "lucide-react";
import type { Area } from "@/lib/auth/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden unless the admin can read this area; no area = always visible. */
  area?: Area;
  /** Which queue count to badge the item with. */
  badge?: "ideas" | "opportunities" | "businesses" | "entrepreneurs";
  keywords?: string;
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview stats" }],
  },
  {
    title: "Moderation",
    items: [
      { href: "/big-ideas", label: "Big Ideas", icon: Lightbulb, area: "bigIdeas", badge: "ideas", keywords: "pitches submissions review" },
      { href: "/competitions", label: "Competitions", icon: Trophy, area: "bigIdeas", keywords: "next big idea shortlist finalists winners pitch" },
      { href: "/opportunities", label: "Opportunities", icon: HandCoins, area: "opportunities", badge: "opportunities", keywords: "grants events funding" },
      { href: "/businesses", label: "Businesses", icon: Building2, area: "businesses", badge: "businesses", keywords: "registrations kyc" },
      { href: "/entrepreneurs", label: "Entrepreneurs", icon: Users, area: "entrepreneurs", badge: "entrepreneurs", keywords: "profiles vetting" },
      { href: "/resources", label: "Resources", icon: FolderOpen, area: "resources", keywords: "library files templates" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/users", label: "Admin Team", icon: ShieldCheck, area: "adminUsers", keywords: "users permissions access" },
      { href: "/audit-logs", label: "Audit Log", icon: ClipboardList, area: "auditLogs", keywords: "activity history" },
      { href: "/profile", label: "My Profile", icon: UserRound, keywords: "account password settings" },
    ],
  },
];
