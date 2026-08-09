/**
 * The server talks to Google Business Profile, which is served by FOUR separate
 * Google API hosts under one OAuth scope (https://www.googleapis.com/auth/business.manage):
 *
 *   - accounts      → mybusinessaccountmanagement.googleapis.com  (v1, Account Management)
 *   - businessinfo  → mybusinessbusinessinformation.googleapis.com (v1, Business Information)
 *   - performance   → businessprofileperformance.googleapis.com    (v1, Performance)
 *   - v4            → mybusiness.googleapis.com                    (legacy v4: Reviews & Local Posts,
 *                                                                   never migrated to v1)
 *
 * The client keeps an explicit host map keyed by these service names; every
 * request names the service it targets.
 */

/** The four Google Business Profile API hosts the client can talk to. */
export type ApiService = "accounts" | "businessinfo" | "performance" | "v4";

export interface GoogleBusinessConfig {
  /** OAuth2 client id (Google Cloud Console). Required for the refresh flow. */
  clientId?: string;
  /** OAuth2 client secret. Treated as a secret. */
  clientSecret?: string;
  /** OAuth2 refresh token with the business.manage scope. Treated as a secret. */
  refreshToken?: string;
  /**
   * A ready-made OAuth2 access token (alternative to the refresh flow, e.g. for
   * quick tests). Expires in ~1 hour and is never refreshed. Treated as a secret.
   */
  accessToken?: string;
  /** Base URL per API service; each entry can be overridden via env for tests/proxies. */
  apiBases: Record<ApiService, string>;
  /** Per-request timeout in milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
  /** Max retries for transient errors (429; 5xx/network only on idempotent calls). Defaults to 3. */
  maxRetries?: number;
  /** Base backoff in milliseconds, doubled each retry. Defaults to 500. */
  retryBaseMs?: number;
}

/** The Basic API Access application form — without an approved application the project quota is 0. */
export const ACCESS_FORM_URL = "https://support.google.com/business/contact/api_default";

/**
 * Google APIs report failures as a non-2xx HTTP status with a JSON envelope:
 * { "error": { "code", "message", "status", "details" } }. The parsed body is
 * kept alongside the status and a short readable message is derived. Quota
 * errors get an extra hint: a fresh project has 0 QPM until Google approves its
 * "Application for Basic API Access", and every call fails until then.
 */
export class GoogleBusinessError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}: ${formatErrorBody(body)}${quotaHint(status, body)}`);
    this.name = "GoogleBusinessError";
    this.status = status;
    this.body = body;
  }
}

/** Turns a parsed Google error envelope into a short, readable message. */
function formatErrorBody(body: unknown): string {
  if (body == null) return "(no body)";
  if (typeof body === "string") return body.slice(0, 500);
  if (typeof body !== "object") return String(body);
  const obj = body as Record<string, unknown>;

  // Google Cloud style: { error: { code, message, status, details } }
  const error = obj.error;
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") {
      const status = typeof e.status === "string" ? `[${e.status}] ` : "";
      return `${status}${e.message}`.slice(0, 500);
    }
  }
  if (typeof obj.message === "string") return obj.message.slice(0, 500);

  return JSON.stringify(obj).slice(0, 500);
}

/**
 * Appends the "project not approved?" diagnostic to quota errors. Unapproved
 * projects have 0 QPM and surface it as 429 RESOURCE_EXHAUSTED (sometimes 403
 * rateLimitExceeded) on every single call.
 */
function quotaHint(status: number, body: unknown): string {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  const rateLimited =
    status === 429 || (status === 403 && /rateLimitExceeded|RESOURCE_EXHAUSTED|quota/i.test(text));
  if (!rateLimited) return "";
  return (
    " — if every call fails like this, your Google Cloud project probably has the default 0 QPM quota:" +
    ` Business Profile APIs need an approved "Application for Basic API Access" (${ACCESS_FORM_URL}).`
  );
}
