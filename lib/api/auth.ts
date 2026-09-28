import { api, refreshAccessToken } from "@/lib/api/http";
import type { AdminUser, Session } from "@/lib/api/types";

async function sessionCall(path: string, body?: unknown): Promise<Session> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Request failed");
  return data as Session;
}

export const authApi = {
  login: (emailOrUsername: string, password: string) =>
    sessionCall("/api/auth/login", { emailOrUsername, password, deviceId: "admin-portal" }),
  /** Resolves with the new access token (or null when signed out); updates the store itself. */
  refresh: refreshAccessToken,
  logout: () => fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null),
  me: () => api.get<AdminUser>("/api/v1/auth/me"),
  /** A PENDING admin (signed in with a one-time code) sets their own password to activate. */
  createPassword: (newPassword: string) => api.post<AdminUser>("/api/v1/auth/create-password", { newPassword }),
};
