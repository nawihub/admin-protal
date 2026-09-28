"use client";

import { useEffect, useRef } from "react";
import { authApi } from "@/lib/api/auth";
import { decodeJwtExpiryMs } from "@/lib/auth/jwt";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * Mount-time silent refresh plus proactive renewal: on first load there's no access token in
 * memory, so this mints one from the httpOnly refresh cookie (or lands in "unauthenticated").
 * It then renews ~60s before each token expires, so an active session never waits on a 401.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Shared single-flight refresh: a re-run of this effect joins the same request.
    if (!useAuthStore.getState().accessToken) void authApi.refresh();
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!accessToken) return;
    const expiresAt = decodeJwtExpiryMs(accessToken);
    if (!expiresAt) return;
    const delay = Math.max(expiresAt - Date.now() - 60_000, 5_000);
    timer.current = setTimeout(() => void authApi.refresh(), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [accessToken]);

  return <>{children}</>;
}
