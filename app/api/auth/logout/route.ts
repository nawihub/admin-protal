import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, clearRefreshCookie, gateway } from "../_lib/session";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await gateway("/api/v1/auth/logout", { method: "POST", json: { refreshToken } }).catch(() => null);
  }
  return clearRefreshCookie(NextResponse.json({ success: true }));
}
