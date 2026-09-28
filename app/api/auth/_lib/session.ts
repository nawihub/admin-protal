import { NextResponse } from "next/server";

/**
 * The refresh token lives only in this httpOnly cookie - browser JS never sees it. These
 * route handlers are the only code that reads or rotates it.
 */
export const REFRESH_COOKIE = "nwh_admin_rt";

const GATEWAY =
  (process.env.ADMIN_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081").replace(/\/$/, "");

// Refresh tokens are long-lived; the cookie mirrors a generous upper bound and the gateway
// remains the authority on whether one is still valid.
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function gateway(path: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${GATEWAY}${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Turns a fresh token pair into the client session: loads the admin's profile and
 * permissions from /auth/me, sets the rotated refresh cookie, and returns only the access
 * token + user to the browser.
 */
export async function respondWithSession(tokens: TokenResponse) {
  const me = await gateway("/api/v1/auth/me", { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  if (!me.res.ok) {
    return clearRefreshCookie(NextResponse.json({ message: "Couldn't load your admin profile" }, { status: 502 }));
  }
  const response = NextResponse.json({ accessToken: tokens.accessToken, user: me.data });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearRefreshCookie(response: NextResponse) {
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/api/auth", maxAge: 0 });
  return response;
}

/** Forwards the gateway's error message (never the raw body) with its status. */
export function gatewayError(status: number, data: unknown, fallback: string) {
  const message =
    data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string"
      ? (data as { message: string }).message
      : fallback;
  return NextResponse.json({ message }, { status });
}
