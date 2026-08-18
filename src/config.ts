import type { ApiService, GoogleBusinessConfig } from "./types.js";

/** Default base URL per API service (see src/types.ts for the map's rationale). */
export const DEFAULT_BASES: Record<ApiService, string> = {
  accounts: "https://mybusinessaccountmanagement.googleapis.com",
  businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
  performance: "https://businessprofileperformance.googleapis.com",
  v4: "https://mybusiness.googleapis.com",
};

/**
 * A malformed environment variable. Thrown instead of exiting on the spot so
 * index.ts can catch it, report the drop-off and start degraded instead of
 * dying; `reason` is the machine-readable code that ships with that ping
 * (never a variable's value).
 */
export class ConfigError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "ConfigError";
    this.reason = reason;
  }
}

/**
 * What a tool call without credentials reads. The first sentence is the
 * historical startup error, verbatim — the rest exists because credentials come
 * only from the environment, so the fix is an operator action plus a restart,
 * never a retry.
 */
export const MISSING_CREDENTIALS_MESSAGE =
  "Google Business credentials are required: set GOOGLE_BUSINESS_CLIENT_ID, " +
  "GOOGLE_BUSINESS_CLIENT_SECRET and GOOGLE_BUSINESS_REFRESH_TOKEN (OAuth2 refresh flow), " +
  "or GOOGLE_BUSINESS_ACCESS_TOKEN for a short-lived token. " +
  "This is not a network failure and retrying will not help: the operator must set these " +
  "environment variables in the MCP client's server config and restart the server — they are " +
  "read only at startup.";

/**
 * Raised when a tool call needs credentials and none were configured. The
 * message is the whole point of the class: it is the only text the calling
 * model reads about the missing setup, so it names the fix (which variables,
 * and that a restart is needed) instead of the failure.
 */
export class CredentialsError extends Error {
  constructor(message: string = MISSING_CREDENTIALS_MESSAGE) {
    super(message);
    this.name = "CredentialsError";
  }
}

/** True when the config carries usable credentials (the full OAuth trio or a static token). */
export function hasCredentials(config: GoogleBusinessConfig): boolean {
  return Boolean(config.accessToken || (config.clientId && config.clientSecret && config.refreshToken));
}

/**
 * Builds the client config from environment variables. Two auth shapes are
 * accepted:
 *
 *   GOOGLE_BUSINESS_CLIENT_ID + GOOGLE_BUSINESS_CLIENT_SECRET +
 *   GOOGLE_BUSINESS_REFRESH_TOKEN          OAuth2 refresh flow (recommended)
 *   GOOGLE_BUSINESS_ACCESS_TOKEN           ready-made access token (~1 h, for quick tests)
 *
 * Missing credentials are NOT an error here: the server starts anyway and the
 * client raises {@link CredentialsError} on the first tool call, so an
 * unconfigured install completes the MCP handshake and carries the fix into
 * the session instead of dying before it with nothing to read. A malformed
 * setup — the OAuth trio set only partially, with no access token to fall back
 * on — still throws, because guessing what the user meant is worse.
 *
 * Optional: GOOGLE_BUSINESS_TIMEOUT_MS, GOOGLE_BUSINESS_MAX_RETRIES and the
 * per-service base overrides GOOGLE_BUSINESS_ACCOUNTS_API_BASE,
 * GOOGLE_BUSINESS_INFO_API_BASE, GOOGLE_BUSINESS_PERFORMANCE_API_BASE,
 * GOOGLE_BUSINESS_V4_API_BASE.
 */
export function loadConfig(): GoogleBusinessConfig {
  // An empty string reads as absent, never as an empty credential.
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID || undefined;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET || undefined;
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN || undefined;
  const accessToken = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN || undefined;

  const anyOauth = Boolean(clientId || clientSecret || refreshToken);
  const fullOauth = Boolean(clientId && clientSecret && refreshToken);

  if (!accessToken && anyOauth && !fullOauth) {
    throw new ConfigError(
      "Incomplete OAuth2 config: GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET and " +
        "GOOGLE_BUSINESS_REFRESH_TOKEN must all be set (or use GOOGLE_BUSINESS_ACCESS_TOKEN instead).",
      "incomplete_oauth_credentials",
    );
  }

  const timeoutMs = Number(process.env.GOOGLE_BUSINESS_TIMEOUT_MS);
  const maxRetries = Number(process.env.GOOGLE_BUSINESS_MAX_RETRIES);

  return {
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
    apiBases: {
      accounts: process.env.GOOGLE_BUSINESS_ACCOUNTS_API_BASE || DEFAULT_BASES.accounts,
      businessinfo: process.env.GOOGLE_BUSINESS_INFO_API_BASE || DEFAULT_BASES.businessinfo,
      performance: process.env.GOOGLE_BUSINESS_PERFORMANCE_API_BASE || DEFAULT_BASES.performance,
      v4: process.env.GOOGLE_BUSINESS_V4_API_BASE || DEFAULT_BASES.v4,
    },
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60_000,
    maxRetries: Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : 3,
  };
}
