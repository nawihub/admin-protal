import { env } from "@/lib/env";
import { useAuthStore, getAccessToken } from "@/lib/store/auth-store";
import type { ApiErrorBody } from "@/lib/api/types";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Every refresh goes through here. Refresh tokens rotate, so two refreshes racing with the same
 * cookie would make one fail and sign the admin out: calls in this tab share one in-flight
 * request, and the Web Locks API queues other tabs until the rotated cookie is in place.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function callRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
    if (!res.ok) {
      useAuthStore.getState().clear();
      return null;
    }
    const data = await res.json();
    useAuthStore.getState().setSession(data.accessToken, data.user);
    return data.accessToken as string;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    // request() resolves with the callback's (awaited) result.
    const run = (locks ? locks.request("nwh-admin-refresh", callRefresh) : callRefresh()) as Promise<string | null>;
    refreshInFlight = run.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Pass a FormData instance directly for multipart uploads - the
   * Content-Type (with boundary) is left for the browser to set. */
  form?: FormData;
  /** Arrays are sent comma-separated, which Spring binds to List<String>; empty ones are omitted. */
  query?: Record<string, string | string[] | number | boolean | undefined | null>;
  /** Skip attaching a bearer token / retrying on 401 - for the handful of
   * public gateway endpoints. */
  auth?: boolean;
  signal?: AbortSignal;
  /** Overrides the default 15s timeout, e.g. for large file downloads. */
  timeoutMs?: number;
  /** Return the raw body as a Blob (file downloads) instead of parsed JSON/text. */
  responseType?: "json" | "blob";
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${env.apiBaseUrl}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        if (value.length) url.searchParams.set(key, value.join(","));
      } else if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseBody(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (res.status === 204) return null;
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => null);
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { method = "GET", body, form, query, auth = true, signal, timeoutMs = 15_000, responseType = "json" } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Every call gets a default timeout so a hung backend/network/service-worker
  // never leaves a caller's isLoading stuck true forever - a real request that
  // times out here still rejects and settles the query, just as an error
  // instead of an infinite spinner. Callers that pass their own `signal`
  // (e.g. to cancel on unmount) keep full control instead.
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(0, null, `Request to ${path} timed out`);
    }
    throw err;
  }

  if (res.status === 401 && auth && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const parsed = (await parseBody(res)) as ApiErrorBody | string | null;
    const errBody =
      parsed && typeof parsed === "object" ? (parsed as ApiErrorBody) : null;
    const message =
      errBody?.message ??
      errBody?.detail ??
      errBody?.title ??
      (typeof parsed === "string" ? parsed : undefined) ??
      `Request to ${path} failed with ${res.status}`;
    throw new ApiError(res.status, errBody, message);
  }

  if (responseType === "blob") {
    return (await res.blob()) as T;
  }
  return (await parseBody(res)) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body" | "form">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
  blob: (path: string, options?: Omit<RequestOptions, "method" | "body" | "form" | "responseType">) =>
    request<Blob>(path, { ...options, method: "GET", responseType: "blob" }),
  upload: <T>(path: string, form: FormData, options?: Omit<RequestOptions, "method" | "form" | "body">) =>
    request<T>(path, { ...options, method: "POST", form }),
};
