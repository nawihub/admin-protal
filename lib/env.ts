/** Centralized, typed access to public env vars - the one place to check when wiring a deployment. */
export const env = {
  /** admin-api-gateway, called directly from the browser. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8081",
  /** The public website, for "view on site" links. */
  publicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://nawehub.com",
};
