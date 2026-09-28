import { NextResponse } from "next/server";
import { gateway, gatewayError, respondWithSession } from "../_lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.emailOrUsername || !body?.password) {
    return NextResponse.json({ message: "Enter your email or username and password" }, { status: 400 });
  }
  const { res, data } = await gateway("/api/v1/auth/login", {
    method: "POST",
    json: {
      emailOrUsername: body.emailOrUsername,
      password: body.password,
      deviceId: body.deviceId ?? "admin-portal",
    },
    // The gateway rate-limits logins per client IP - pass the real one through.
    headers: { "X-Forwarded-For": request.headers.get("x-forwarded-for") ?? "" },
  });
  if (!res.ok) return gatewayError(res.status, data, "Sign in failed");
  return respondWithSession(data);
}
