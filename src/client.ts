import type { ApiService, GoogleBusinessConfig } from "./types.js";
import { GoogleBusinessError, isQuotaError } from "./types.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Query values: arrays become repeated params, undefined entries are dropped. */
export type Query = Record<string, string | number | boolean | Array<string | number> | undefined>;

/** Google's OAuth2 token endpoint (fixed — never derived from user input). */
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * Host map: which of the four Google Business Profile hosts serves each tool
 * group. Reviews and Local Posts were NEVER migrated to v1 and live only on the
 * legacy v4 host — do not "modernize" them onto the businessinfo host.
 *
 *   accounts      list_accounts
 *   businessinfo  locations / categories / attributes / chains
 *   performance   daily metrics / search keyword impressions
 *   v4            reviews / local posts (legacy mybusiness.googleapis.com/v4)
 *
 * The default URLs live in config.ts (DEFAULT_BASES); the client only reads the
 * per-service bases resolved into the config.
 */

/**
 * readMask applied when the caller does not pass one: locations.get and
 * accounts.locations.list return 400 without a readMask, so the client always
 * sends one.
 */
export const DEFAULT_READ_MASK = "name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata";

/** "123", "accounts/123" or a full v4 name → bare account id. */
export function bareAccountId(id: string): string {
  const m = /accounts\/([^/]+)/.exec(id);
  return m ? m[1] : id.replace(/^\/+|\/+$/g, "");
}

/** "123", "locations/123" or "accounts/1/locations/123" → bare location id. */
export function bareLocationId(id: string): string {
  const m = /locations\/([^/]+)/.exec(id);
  return m ? m[1] : id.replace(/^\/+|\/+$/g, "");
}

// ---------- Normalized per-endpoint parameter shapes ----------

export interface ListAccountsParams {
  pageSize?: number;
  pageToken?: string;
  /** List sub-accounts of this account instead of top-level ones. */
  parentAccount?: string;
  filter?: string;
}

export interface ListLocationsParams {
  accountId: string;
  readMask?: string;
  pageSize?: number;
  pageToken?: string;
  filter?: string;
  orderBy?: string;
}

export interface GetLocationParams {
  locationId: string;
  readMask?: string;
}

export interface UpdateLocationParams {
  locationId: string;
  updateMask: string;
  location: Record<string, unknown>;
  validateOnly?: boolean;
}

export interface ListCategoriesParams {
  regionCode: string;
  languageCode: string;
  view: "BASIC" | "FULL";
  filter?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface ListAttributeMetadataParams {
  locationId?: string;
  categoryName?: string;
  regionCode?: string;
  languageCode?: string;
  showAll?: boolean;
  pageSize?: number;
  pageToken?: string;
}

export interface UpdateLocationAttributesParams {
  locationId: string;
  attributes: Array<{ name: string } & Record<string, unknown>>;
  /** Defaults to the names of the attributes passed. */
  attributeMask?: string;
}

export interface SearchChainsParams {
  chainName: string;
  pageSize?: number;
}

export interface GetDailyMetricsParams {
  locationId: string;
  dailyMetric: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
}

export interface FetchMultiDailyMetricsParams {
  locationId: string;
  dailyMetrics: string[];
  startDate: string;
  endDate: string;
}

export interface ListSearchKeywordImpressionsParams {
  locationId: string;
  /** YYYY-MM */
  startMonth: string;
  /** YYYY-MM */
  endMonth: string;
  pageSize?: number;
  pageToken?: string;
}

export interface ReviewRef {
  accountId: string;
  locationId: string;
  reviewId: string;
}

export interface ListReviewsParams {
  accountId: string;
  locationId: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

export interface LocalPostRef {
  accountId: string;
  locationId: string;
  postId: string;
}

export interface ListLocalPostsParams {
  accountId: string;
  locationId: string;
  pageSize?: number;
  pageToken?: string;
}

export interface CreateLocalPostParams {
  accountId: string;
  locationId: string;
  post: Record<string, unknown>;
}

export interface UpdateLocalPostParams extends LocalPostRef {
  updateMask: string;
  post: Record<string, unknown>;
}

export class GoogleBusinessClient {
  private readonly bases: Record<ApiService, string>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  /** Cached access token from the refresh flow (renewed ~60 s before expiry). */
  private tokenCache?: { token: string; expiresAt: number };
  /** In-flight refresh, so concurrent requests share one token call. */
  private tokenRefresh?: Promise<string>;

  constructor(private readonly config: GoogleBusinessConfig) {
    this.bases = Object.fromEntries(
      Object.entries(config.apiBases).map(([k, v]) => [k, v.endsWith("/") ? v : v + "/"]),
    ) as Record<ApiService, string>;
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBaseMs = config.retryBaseMs ?? 500;
  }

  /** Backoff before a retry: honors Retry-After when present, else exponential (capped at 30s). */
  private backoffMs(attempt: number, res?: Response): number {
    const retryAfter = res ? Number(res.headers.get("Retry-After")) : NaN;
    if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter, 30) * 1000;
    return Math.min(this.retryBaseMs * 2 ** attempt, 30_000);
  }

  /**
   * fetch with an AbortController timeout. Reads the response body inside the
   * guarded zone so the timeout also covers a slow or drip-feeding body, not
   * just the initial headers, and returns the text alongside the response.
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    label: string,
  ): Promise<{ res: Response; text: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const text = await res.text();
      return { res, text };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request to "${label}" timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Exchanges the refresh token for a fresh access token at Google's token endpoint. */
  private async mintAccessToken(): Promise<{ token: string; expiresInSec: number }> {
    const form = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken ?? "",
      client_id: this.config.clientId ?? "",
      client_secret: this.config.clientSecret ?? "",
    });
    const { res, text } = await this.fetchWithTimeout(
      TOKEN_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
      "oauth2 token refresh",
    );
    const data = parseBody(text);
    if (!res.ok) throw new GoogleBusinessError(res.status, data);
    const obj = data as { access_token?: string; expires_in?: number };
    if (typeof obj?.access_token !== "string") {
      throw new Error("OAuth2 token endpoint returned no access_token");
    }
    return { token: obj.access_token, expiresInSec: obj.expires_in ?? 3600 };
  }

  /**
   * The Bearer token for the next request: the static GOOGLE_BUSINESS_ACCESS_TOKEN
   * if configured, else a cached refresh-flow token (renewed 60 s before expiry;
   * concurrent callers share one in-flight refresh, and a failed refresh is not
   * cached).
   */
  private async getAccessToken(): Promise<string> {
    if (this.config.accessToken) return this.config.accessToken;
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) return this.tokenCache.token;
    if (!this.tokenRefresh) {
      this.tokenRefresh = this.mintAccessToken()
        .then(({ token, expiresInSec }) => {
          this.tokenCache = { token, expiresAt: Date.now() + Math.max(expiresInSec - 60, 30) * 1000 };
          return token;
        })
        .finally(() => {
          this.tokenRefresh = undefined;
        });
    }
    return this.tokenRefresh;
  }

  /**
   * Low-level request to one of the four Google Business Profile hosts. `service`
   * picks the host; `path` is relative to it (e.g. "v1/accounts" or
   * "v4/accounts/1/locations/2/reviews"). Retries rate limits — 429 and the
   * legacy-v4 quota-403 — for every method (the request was never executed);
   * 5xx and network errors/timeouts only for idempotent methods (everything
   * except POST — a 502 after a committed POST would duplicate the created
   * resource). Any other non-2xx throws a {@link GoogleBusinessError}.
   */
  async request<T = unknown>(
    service: ApiService,
    method: HttpMethod,
    path: string,
    opts: { query?: Query; body?: unknown } = {},
  ): Promise<T> {
    const base = this.bases[service];
    // Resolve the path against the service base, then reject anything that
    // escaped to a foreign origin (an absolute "https://evil/x" or a "\\evil/x"
    // slipped through raw_request) so the Bearer token can never leak.
    const url = new URL(path.replace(/^\//, ""), base);
    if (url.origin !== new URL(base).origin) {
      throw new Error(`raw_request path must be a relative API path (resolved to foreign origin ${url.origin})`);
    }
    appendQuery(url, opts.query);
    const target = url.toString();

    const hasBody = opts.body !== undefined && method !== "GET" && method !== "DELETE";
    const idempotent = method !== "POST";

    for (let attempt = 0; ; attempt++) {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (hasBody) headers["Content-Type"] = "application/json";

      let res: Response;
      let text: string;
      try {
        ({ res, text } = await this.fetchWithTimeout(
          target,
          { method, headers, body: hasBody ? JSON.stringify(opts.body) : undefined },
          path,
        ));
      } catch (err) {
        if (idempotent && attempt < this.maxRetries) {
          await delay(this.backoffMs(attempt));
          continue;
        }
        throw err;
      }

      const data = parseBody(text);
      // 429 and quota-403 mean "not executed, slow down" — retryable for every
      // method. 5xx is retried only for idempotent methods.
      const rateLimited = res.status === 429 || (res.status === 403 && isQuotaError(data));
      const transient = rateLimited || (idempotent && res.status >= 500 && res.status < 600);
      if (transient && attempt < this.maxRetries) {
        await delay(this.backoffMs(attempt, res));
        continue;
      }

      if (!res.ok) throw new GoogleBusinessError(res.status, data);
      return data as T;
    }
  }

  // ---------- Account Management (v1) ----------

  /** All GBP accounts the authenticated user can access. pageSize caps at 20 (API limit). */
  async listAccounts(p: ListAccountsParams = {}): Promise<unknown> {
    return this.request("accounts", "GET", "v1/accounts", {
      query: {
        pageSize: p.pageSize,
        pageToken: p.pageToken,
        parentAccount: p.parentAccount ? `accounts/${bareAccountId(p.parentAccount)}` : undefined,
        filter: p.filter,
      },
    });
  }

  // ---------- Business Information (v1) ----------

  async listLocations(p: ListLocationsParams): Promise<unknown> {
    return this.request("businessinfo", "GET", `v1/accounts/${bareAccountId(p.accountId)}/locations`, {
      query: {
        readMask: p.readMask ?? DEFAULT_READ_MASK,
        pageSize: p.pageSize,
        pageToken: p.pageToken,
        filter: p.filter,
        orderBy: p.orderBy,
      },
    });
  }

  /** v1 uses the bare `locations/{id}` name — no account prefix. */
  async getLocation(p: GetLocationParams): Promise<unknown> {
    return this.request("businessinfo", "GET", `v1/locations/${bareLocationId(p.locationId)}`, {
      query: { readMask: p.readMask ?? DEFAULT_READ_MASK },
    });
  }

  async updateLocation(p: UpdateLocationParams): Promise<unknown> {
    return this.request("businessinfo", "PATCH", `v1/locations/${bareLocationId(p.locationId)}`, {
      query: { updateMask: p.updateMask, validateOnly: p.validateOnly },
      body: p.location,
    });
  }

  async listCategories(p: ListCategoriesParams): Promise<unknown> {
    return this.request("businessinfo", "GET", "v1/categories", {
      query: {
        regionCode: p.regionCode,
        languageCode: p.languageCode,
        view: p.view,
        filter: p.filter,
        pageSize: p.pageSize,
        pageToken: p.pageToken,
      },
    });
  }

  async listAttributeMetadata(p: ListAttributeMetadataParams): Promise<unknown> {
    const categoryName =
      p.categoryName && !p.categoryName.startsWith("categories/")
        ? `categories/${p.categoryName}`
        : p.categoryName;
    return this.request("businessinfo", "GET", "v1/attributes", {
      query: {
        parent: p.locationId ? `locations/${bareLocationId(p.locationId)}` : undefined,
        categoryName,
        regionCode: p.regionCode,
        languageCode: p.languageCode,
        showAll: p.showAll,
        pageSize: p.pageSize,
        pageToken: p.pageToken,
      },
    });
  }

  async updateLocationAttributes(p: UpdateLocationAttributesParams): Promise<unknown> {
    const id = bareLocationId(p.locationId);
    return this.request("businessinfo", "PATCH", `v1/locations/${id}/attributes`, {
      query: { attributeMask: p.attributeMask ?? p.attributes.map((a) => a.name).join(",") },
      body: { name: `locations/${id}/attributes`, attributes: p.attributes },
    });
  }

  async searchChains(p: SearchChainsParams): Promise<unknown> {
    return this.request("businessinfo", "GET", "v1/chains:search", {
      query: { chainName: p.chainName, pageSize: p.pageSize },
    });
  }

  // ---------- Business Profile Performance (v1) ----------

  async getDailyMetrics(p: GetDailyMetricsParams): Promise<unknown> {
    return this.request(
      "performance",
      "GET",
      `v1/locations/${bareLocationId(p.locationId)}:getDailyMetricsTimeSeries`,
      { query: { dailyMetric: p.dailyMetric, ...dailyRangeQuery(p.startDate, p.endDate) } },
    );
  }

  async fetchMultiDailyMetrics(p: FetchMultiDailyMetricsParams): Promise<unknown> {
    return this.request(
      "performance",
      "GET",
      `v1/locations/${bareLocationId(p.locationId)}:fetchMultiDailyMetricsTimeSeries`,
      { query: { dailyMetrics: p.dailyMetrics, ...dailyRangeQuery(p.startDate, p.endDate) } },
    );
  }

  async listSearchKeywordImpressions(p: ListSearchKeywordImpressionsParams): Promise<unknown> {
    const s = parseIsoMonth(p.startMonth);
    const e = parseIsoMonth(p.endMonth);
    return this.request(
      "performance",
      "GET",
      `v1/locations/${bareLocationId(p.locationId)}/searchkeywords/impressions/monthly`,
      {
        query: {
          "monthlyRange.start_month.year": s.year,
          "monthlyRange.start_month.month": s.month,
          "monthlyRange.end_month.year": e.year,
          "monthlyRange.end_month.month": e.month,
          pageSize: p.pageSize,
          pageToken: p.pageToken,
        },
      },
    );
  }

  // ---------- Reviews (LEGACY v4 only) ----------

  /** v4 resource names need the full accounts/{a}/locations/{l} prefix. */
  private v4LocationPath(accountId: string, locationId: string): string {
    return `v4/accounts/${bareAccountId(accountId)}/locations/${bareLocationId(locationId)}`;
  }

  async listReviews(p: ListReviewsParams): Promise<unknown> {
    return this.request("v4", "GET", `${this.v4LocationPath(p.accountId, p.locationId)}/reviews`, {
      query: { pageSize: p.pageSize, pageToken: p.pageToken, orderBy: p.orderBy },
    });
  }

  async getReview(p: ReviewRef): Promise<unknown> {
    return this.request("v4", "GET", `${this.v4LocationPath(p.accountId, p.locationId)}/reviews/${p.reviewId}`);
  }

  /** PUT upsert: creates the reply or replaces the existing one. */
  async replyToReview(p: ReviewRef & { comment: string }): Promise<unknown> {
    return this.request(
      "v4",
      "PUT",
      `${this.v4LocationPath(p.accountId, p.locationId)}/reviews/${p.reviewId}/reply`,
      { body: { comment: p.comment } },
    );
  }

  async deleteReviewReply(p: ReviewRef): Promise<unknown> {
    return this.request(
      "v4",
      "DELETE",
      `${this.v4LocationPath(p.accountId, p.locationId)}/reviews/${p.reviewId}/reply`,
    );
  }

  // ---------- Local Posts (LEGACY v4 only) ----------

  async listLocalPosts(p: ListLocalPostsParams): Promise<unknown> {
    return this.request("v4", "GET", `${this.v4LocationPath(p.accountId, p.locationId)}/localPosts`, {
      query: { pageSize: p.pageSize, pageToken: p.pageToken },
    });
  }

  async createLocalPost(p: CreateLocalPostParams): Promise<unknown> {
    return this.request("v4", "POST", `${this.v4LocationPath(p.accountId, p.locationId)}/localPosts`, {
      body: p.post,
    });
  }

  async updateLocalPost(p: UpdateLocalPostParams): Promise<unknown> {
    return this.request(
      "v4",
      "PATCH",
      `${this.v4LocationPath(p.accountId, p.locationId)}/localPosts/${p.postId}`,
      { query: { updateMask: p.updateMask }, body: p.post },
    );
  }

  async deleteLocalPost(p: LocalPostRef): Promise<unknown> {
    return this.request(
      "v4",
      "DELETE",
      `${this.v4LocationPath(p.accountId, p.locationId)}/localPosts/${p.postId}`,
    );
  }
}

/** Appends query params; arrays repeat the key, undefined entries are dropped. */
function appendQuery(url: URL, query?: Query): void {
  if (!query) return;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.append(key, String(value));
    }
  }
}

/** The Performance API takes date ranges as flattened query params. */
function dailyRangeQuery(startDate: string, endDate: string): Query {
  const s = parseIsoDate(startDate);
  const e = parseIsoDate(endDate);
  return {
    "dailyRange.start_date.year": s.year,
    "dailyRange.start_date.month": s.month,
    "dailyRange.start_date.day": s.day,
    "dailyRange.end_date.year": e.year,
    "dailyRange.end_date.month": e.month,
    "dailyRange.end_date.day": e.day,
  };
}

function parseIsoDate(date: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date "${date}" — expected YYYY-MM-DD`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseIsoMonth(month: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error(`Invalid month "${month}" — expected YYYY-MM`);
  return { year: Number(m[1]), month: Number(m[2]) };
}

function parseBody(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
