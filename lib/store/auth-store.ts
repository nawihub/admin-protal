import { create } from "zustand";
import type { AdminUser } from "@/lib/api/types";

/**
 * Client-side session state. The access token only ever lives in memory; the rotating refresh
 * token is an httpOnly cookie set by this app's own /api/auth/* route handlers, so it never
 * reaches browser JS. A hard refresh re-mints the access token from the cookie (AuthProvider).
 */
interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  setSession: (accessToken: string, user: AdminUser) => void;
  setUser: (user: AdminUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: "loading",
  setSession: (accessToken, user) => set({ accessToken, user, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));

/** Non-hook accessor so the fetch client can read the current token outside React. */
export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}
