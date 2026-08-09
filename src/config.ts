import type { ApiService, GoogleBusinessConfig } from "./types.js";

/** Default base URL per API service (see src/types.ts for the map's rationale). */
export const DEFAULT_BASES: Record<ApiService, string> = {
  accounts: "https://mybusinessaccountmanagement.googleapis.com",
  businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
  performance: "https://businessprofileperformance.googleapis.com",
  v4: "https://mybusiness.googleapis.com",
};

/**
 * A missing or malformed environment variable. Thrown instead of exiting on the
 * spot so index.ts can report the drop-off before the process dies; `reason` is
 * the machine-readable code that ships with that ping (never a variable's value).
 */
export class ConfigError extends Error {
  readonly reason: string;

  constructor(message: string, reason: string) {
    super(message);
    this.name = "ConfigError";
    this.reason = reason;
  }
}

function die(message: string, reason: string): never {
  throw new ConfigError(message, reason);
}

/**
 * Builds the client config from environment variables, throwing ConfigError if
 * required ones are missing. Two auth shapes are accepted:
 *
 *   GOOGLE_BUSINESS_CLIENT_ID + GOOGLE_BUSINESS_CLIENT_SECRET +
 *   GOOGLE_BUSINESS_REFRESH_TOKEN          OAuth2 refresh flow (recommended)
 *   GOOGLE_BUSINESS_ACCESS_TOKEN           ready-made access token (~1 h, for quick tests)
 *
 * Optional: GOOGLE_BUSINESS_TIMEOUT_MS, GOOGLE_BUSINESS_MAX_RETRIES and the
 * per-service base overrides GOOGLE_BUSINESS_ACCOUNTS_API_BASE,
 * GOOGLE_BUSINESS_INFO_API_BASE, GOOGLE_BUSINESS_PERFORMANCE_API_BASE,
 * GOOGLE_BUSINESS_V4_API_BASE.
 */
export function loadConfig(): GoogleBusinessConfig {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN;
  const accessToken = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN;

  const anyOauth = Boolean(clientId || clientSecret || refreshToken);
  const fullOauth = Boolean(clientId && clientSecret && refreshToken);

  if (!accessToken && !anyOauth) {
    die(
      "Google Business credentials are required: set GOOGLE_BUSINESS_CLIENT_ID, " +
        "GOOGLE_BUSINESS_CLIENT_SECRET and GOOGLE_BUSINESS_REFRESH_TOKEN (OAuth2 refresh flow), " +
        "or GOOGLE_BUSINESS_ACCESS_TOKEN for a short-lived token.",
      "missing_credentials",
    );
  }
  if (!accessToken && !fullOauth) {
    die(
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
