"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "table" | "grid";

const KEY = (list: string) => `nwh-admin-view:${list}`;
const EVENT = "nwh-admin-view-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Table or card view for a list, remembered per list in this browser (a convenience - storage failures fall back to the table). */
export function useViewMode(list: string): [ViewMode, (mode: ViewMode) => void] {
  const mode = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(KEY(list)) === "grid" ? "grid" : "table";
      } catch {
        return "table";
      }
    },
    () => "table" as const,
  );
  const setMode = useCallback(
    (next: ViewMode) => {
      try {
        localStorage.setItem(KEY(list), next);
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [list],
  );
  return [mode, setMode];
}
