/** Best-effort decode of a JWT's payload, used ONLY to read `exp` so we can
 * schedule a proactive silent refresh before the access token expires.
 * This never verifies the signature - that's the gateway/auth-service's job
 * on every request; a forged/expired token is simply rejected there. */
export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof json.exp !== "number") return null;
    return json.exp * 1000;
  } catch {
    return null;
  }
}
