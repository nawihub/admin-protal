"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useAuthStore } from "@/lib/store/auth-store";

const EVENT = "nwh-admin-seen-jobs";
const keyFor = (userId: string) => `nwh-admin-seen-jobs:${userId}`;
const EMPTY: string[] = [];
let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(userId: string | undefined): string[] {
  if (!userId) return EMPTY;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(keyFor(userId));
  } catch {}
  // Same array while storage is unchanged, as useSyncExternalStore needs.
  if (raw !== cache.raw) {
    let ids: string[] = EMPTY;
    try {
      ids = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    } catch {}
    cache = { raw, ids };
  }
  return cache.ids;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * Which finished batch jobs this admin has already seen in the notifications bell - kept per
 * browser (a convenience; if storage is unavailable everything simply shows as unread).
 */
export function useSeenJobs() {
  const userId = useAuthStore((s) => s.user?.id);
  const seen = useSyncExternalStore(subscribe, () => read(userId), () => EMPTY);
  const hasBaseline = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return !!userId && localStorage.getItem(keyFor(userId)) !== null;
      } catch {
        return true; // storage unavailable: never try to baseline
      }
    },
    () => true,
  );
  const markSeen = useCallback(
    (ids: string[]) => {
      if (!userId) return;
      const next = Array.from(new Set([...read(userId), ...ids])).slice(-200);
      try {
        localStorage.setItem(keyFor(userId), JSON.stringify(next));
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [userId],
  );
  return { seen, hasBaseline, markSeen };
}
