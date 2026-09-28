import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, clearRefreshCookie, gateway, respondWithSession } from "../_lib/session";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ message: "No session" }, { status: 401 });

  const { res, data } = await gateway("/api/v1/auth/refresh", { method: "POST", json: { refreshToken } });
  if (!res.ok) {
    // Expired, or revoked by reuse detection - never retry the same token, just sign in again.
    return clearRefreshCookie(NextResponse.json({ message: "Session expired" }, { status: 401 }));
  }
  return respondWithSession(data);
}
