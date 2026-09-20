import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  OAuthError,
  registerGoogleAuth,
  TokenProvider,
  unconfiguredPrefix,
  USERINFO_URL,
  type GoogleAuthOptions,
} from "@a1-x-tech/mcp-google-auth";
import { probeApi } from "../client.js";
import { GoogleBusinessError } from "../types.js";

/**
 * The scopes an in-chat login requests (the per-task table lives in
 * docs/TOOLS.md). The component always adds the identity scopes on top. Google Business Profile exposes a single scope — `business.manage` covers every read and write the API offers.
 */
export const LOGIN_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
];

/**
 * True when a Google API error body says the API itself is switched off in the
 * caller's Cloud project. Google reports this two ways at once and has been
 * migrating between them: the legacy `error.errors[].reason` is
 * `accessNotConfigured`, the newer `error.details[].reason` is
 * `SERVICE_DISABLED`. Either spelling means the same fix, so both are matched.
 */
function isApiDisabled(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return false;
  const reasons = new Set<unknown>();
  for (const key of ["errors", "details"] as const) {
    const list = (error as Record<string, unknown>)[key];
    if (Array.isArray(list)) {
      for (const entry of list) {
        if (typeof entry === "object" && entry !== null) {
          reasons.add((entry as { reason?: unknown }).reason);
        }
      }
    }
  }
  return reasons.has("accessNotConfigured") || reasons.has("SERVICE_DISABLED");
}

/**
 * `verifyIdentity` for the component: one cheap Google Business Profile read, plus the
 * translation the component cannot do itself. An API that is not enabled in the
 * user's Cloud project answers the first call with HTTP 403 — the most likely
 * failure right after a login — as a bare error reading "PERMISSION_DENIED",
 * which sends the user to check permissions they cannot fix. Re-thrown as
 * `OAuthError("accessNotConfigured")` it becomes the real advice: enable the
 * API in the SAME project as the OAuth client.
 *
 * Checking the product API (rather than the component's default OIDC userinfo)
 * is the point: OIDC answers even when Google Business Profile API is switched off, so a
 * login would look successful and the first real tool call would fail instead.
 */
async function verifyIdentity(accessToken: string): Promise<{ email?: string }> {
  try {
    await probeApi(accessToken);
  } catch (error) {
    if (error instanceof GoogleBusinessError && error.status === 403 && isApiDisabled(error.body)) {
      throw new OAuthError("accessNotConfigured", "Google Business Profile API", error.status);
    }
    throw error;
  }
  return { email: await accountEmail(accessToken) };
}

/**
 * The account label shown after a login. Best-effort on purpose: the connection
 * is already proven by the probe above, and failing the whole login over a
 * cosmetic label would be wrong.
 */
async function accountEmail(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return undefined;
    const data: unknown = await res.json();
    const email = (data as { email?: unknown }).email;
    return typeof email === "string" ? email : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The single source of the auth wiring: serverName "business" puts the stored
 * login in ~/.config/mcp-google-business/credentials.json (the component
 * prefixes "mcp-google-"), envPrefix keeps the provider reading the exact
 * GOOGLE_BUSINESS_* variables config.ts documents — which is what preserves the
 * env-beats-stored priority for existing installs.
 */
export const AUTH_OPTIONS: GoogleAuthOptions = {
  serverName: "business",
  envPrefix: "GOOGLE_BUSINESS",
  scopes: LOGIN_SCOPES,
  verifyIdentity,
};

/**
 * Registers the six onboarding tools (auth_status, setup_instructions,
 * set_client, start_login, finish_login, logout) and returns the TokenProvider
 * the client plugs in as its fallback token source — the same instance, so a
 * login finished mid-session is visible to the very next API call without a
 * restart.
 */
export function registerAuthTools(server: McpServer): TokenProvider {
  return registerGoogleAuth(server, AUTH_OPTIONS);
}

/** True when any token exists — env variables or a stored in-chat login. */
export function hasAuthToken(): boolean {
  return new TokenProvider(AUTH_OPTIONS).hasToken();
}

/** The "NOT CONNECTED" prefix for the initialize instructions (names both fixes). */
export function authUnconfiguredPrefix(): string {
  return unconfiguredPrefix(AUTH_OPTIONS);
}
