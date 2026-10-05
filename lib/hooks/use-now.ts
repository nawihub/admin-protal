"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed every {@code intervalMs} - for UI that changes when a deadline passes. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
