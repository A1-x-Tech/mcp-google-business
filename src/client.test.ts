import { test } from "node:test";
import assert from "node:assert/strict";
import { bareAccountId, bareLocationId, GoogleBusinessClient } from "./client.js";
import type { GoogleBusinessConfig } from "./types.js";

const BASES = {
  accounts: "https://mybusinessaccountmanagement.googleapis.com",
  businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
  performance: "https://businessprofileperformance.googleapis.com",
  v4: "https://mybusiness.googleapis.com",
} as const;

/** Static-token client: no OAuth traffic, so calls[0] is the API call itself. */
function makeClient(overrides: Partial<GoogleBusinessConfig> = {}) {
  return new GoogleBusinessClient({
    accessToken: "STATIC",
    apiBases: { ...BASES },
    retryBaseMs: 0, // no real backoff delay in tests
    maxRetries: 0,
    ...overrides,
  });
}

interface Recorded {
  url: string;
  method: string;
  auth: unknown;
  contentType: unknown;
  body: unknown;
}

function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  const calls: Recorded[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as RequestInit & { headers?: Record<string, string> };
    calls.push({
      url: String(url),
      method: String(i.method),
      auth: i.headers?.Authorization,
      contentType: i.headers?.["Content-Type"],
      body: typeof i.body === "string" && i.body.startsWith("{") ? JSON.parse(i.body) : i.body,
    });
    return handler(String(url), i);
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

const okJson = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

// ---------- resource-name helpers ----------

test("bare id helpers accept bare ids, single names and full v4 names", () => {
  assert.equal(bareAccountId("123"), "123");
  assert.equal(bareAccountId("accounts/123"), "123");
  assert.equal(bareAccountId("accounts/123/locations/9"), "123");
  assert.equal(bareLocationId("9"), "9");
  assert.equal(bareLocationId("locations/9"), "9");
  assert.equal(bareLocationId("accounts/123/locations/9"), "9");
});

// ---------- OAuth2 ----------

test("refresh flow: mints a token at the Google token endpoint, then caches it", async () => {
  const mock = mockFetch((url) => {
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      return new Response(JSON.stringify({ access_token: "MINTED", expires_in: 3600 }), { status: 200 });
    }
    return okJson();
  });
  try {
    const client = makeClient({ accessToken: undefined, clientId: "id", clientSecret: "sec", refreshToken: "ref" });
    await client.listAccounts();
    await client.listAccounts();

    const tokenCalls = mock.calls.filter((c) => c.url.startsWith("https://oauth2.googleapis.com/token"));
    assert.equal(tokenCalls.length, 1, "second API call must reuse the cached token");
    assert.equal(tokenCalls[0].method, "POST");
    assert.equal(tokenCalls[0].contentType, "application/x-www-form-urlencoded");
    const form = new URLSearchParams(String(tokenCalls[0].body));
    assert.equal(form.get("grant_type"), "refresh_token");
    assert.equal(form.get("refresh_token"), "ref");
    assert.equal(form.get("client_id"), "id");
    assert.equal(form.get("client_secret"), "sec");

    const apiCalls = mock.calls.filter((c) => !c.url.startsWith("https://oauth2.googleapis.com/token"));
    assert.equal(apiCalls.length, 2);
    for (const c of apiCalls) assert.equal(c.auth, "Bearer MINTED");
  } finally {
    mock.restore();
  }
});

test("a failed token refresh is not cached: the next call retries the refresh", async () => {
  let tokenCalls = 0;
  const mock = mockFetch((url) => {
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      tokenCalls++;
      if (tokenCalls === 1) {
        return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
      }
      return new Response(JSON.stringify({ access_token: "SECOND", expires_in: 3600 }), { status: 200 });
    }
    return okJson();
  });
  try {
    const client = makeClient({ accessToken: undefined, clientId: "id", clientSecret: "sec", refreshToken: "ref" });
    await assert.rejects(() => client.listAccounts(), /HTTP 400/);
    await client.listAccounts();
    assert.equal(tokenCalls, 2);
  } finally {
    mock.restore();
  }
});

test("a static GOOGLE_BUSINESS_ACCESS_TOKEN skips the token endpoint entirely", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listAccounts();
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].auth, "Bearer STATIC");
    assert.ok(!mock.calls[0].url.includes("oauth2"), "must not hit the token endpoint");
  } finally {
    mock.restore();
  }
});

// ---------- per-endpoint host / path / query / body mapping ----------

test("listAccounts hits the Account Management host and normalizes parentAccount", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listAccounts({ pageSize: 20, pageToken: "tok", parentAccount: "77", filter: "type=USER_GROUP" });
  } finally {
    mock.restore();
  }
  assert.equal(
    mock.calls[0].url,
    `${BASES.accounts}/v1/accounts?pageSize=20&pageToken=tok&parentAccount=accounts%2F77&filter=type%3DUSER_GROUP`,
  );
  assert.equal(mock.calls[0].method, "GET");
});

test("listLocations hits the Business Information host and always sends a readMask", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listLocations({ accountId: "accounts/12" });
    await makeClient().listLocations({ accountId: "12", readMask: "name,title", pageSize: 5 });
  } finally {
    mock.restore();
  }
  const first = new URL(mock.calls[0].url);
  assert.equal(first.origin, BASES.businessinfo);
  assert.equal(first.pathname, "/v1/accounts/12/locations");
  assert.ok(first.searchParams.get("readMask"), "default readMask must be injected (400 without it)");
  const second = new URL(mock.calls[1].url);
  assert.equal(second.searchParams.get("readMask"), "name,title");
  assert.equal(second.searchParams.get("pageSize"), "5");
});

test("getLocation uses the bare v1 locations/{id} name (no account prefix)", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().getLocation({ locationId: "accounts/12/locations/777", readMask: "name" });
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.businessinfo}/v1/locations/777?readMask=name`);
});

test("updateLocation PATCHes with updateMask + validateOnly and the location body", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().updateLocation({
      locationId: "777",
      updateMask: "title",
      location: { title: "New name" },
      validateOnly: true,
    });
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.businessinfo}/v1/locations/777?updateMask=title&validateOnly=true`);
  assert.equal(mock.calls[0].method, "PATCH");
  assert.equal(mock.calls[0].contentType, "application/json");
  assert.deepEqual(mock.calls[0].body, { title: "New name" });
});

test("listCategories passes region/language/view", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listCategories({ regionCode: "US", languageCode: "en", view: "FULL", filter: "displayName=coffee" });
  } finally {
    mock.restore();
  }
  assert.equal(
    mock.calls[0].url,
    `${BASES.businessinfo}/v1/categories?regionCode=US&languageCode=en&view=FULL&filter=displayName%3Dcoffee`,
  );
});

test("listAttributeMetadata builds parent from locationId and prefixes bare gcids", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listAttributeMetadata({ locationId: "locations/9" });
    await makeClient().listAttributeMetadata({ categoryName: "gcid:cafe", regionCode: "DE", languageCode: "de" });
  } finally {
    mock.restore();
  }
  assert.equal(new URL(mock.calls[0].url).searchParams.get("parent"), "locations/9");
  const second = new URL(mock.calls[1].url);
  assert.equal(second.searchParams.get("categoryName"), "categories/gcid:cafe");
  assert.equal(second.searchParams.get("regionCode"), "DE");
});

test("updateLocationAttributes derives attributeMask from attribute names", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().updateLocationAttributes({
      locationId: "9",
      attributes: [
        { name: "attributes/wi_fi", repeatedEnumValue: { setValues: ["free_wi_fi"] } },
        { name: "attributes/has_delivery", values: [true] },
      ],
    });
  } finally {
    mock.restore();
  }
  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, "/v1/locations/9/attributes");
  assert.equal(url.searchParams.get("attributeMask"), "attributes/wi_fi,attributes/has_delivery");
  assert.deepEqual(mock.calls[0].body, {
    name: "locations/9/attributes",
    attributes: [
      { name: "attributes/wi_fi", repeatedEnumValue: { setValues: ["free_wi_fi"] } },
      { name: "attributes/has_delivery", values: [true] },
    ],
  });
});

test("searchChains hits the chains:search custom method", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().searchChains({ chainName: "walmart", pageSize: 3 });
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.businessinfo}/v1/chains:search?chainName=walmart&pageSize=3`);
});

test("getDailyMetrics hits the Performance host with a flattened dailyRange", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().getDailyMetrics({
      locationId: "555",
      dailyMetric: "CALL_CLICKS",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  } finally {
    mock.restore();
  }
  const url = new URL(mock.calls[0].url);
  assert.equal(url.origin, BASES.performance);
  assert.equal(url.pathname, "/v1/locations/555:getDailyMetricsTimeSeries");
  assert.equal(url.searchParams.get("dailyMetric"), "CALL_CLICKS");
  assert.equal(url.searchParams.get("dailyRange.start_date.year"), "2026");
  assert.equal(url.searchParams.get("dailyRange.start_date.month"), "7");
  assert.equal(url.searchParams.get("dailyRange.start_date.day"), "1");
  assert.equal(url.searchParams.get("dailyRange.end_date.day"), "31");
});

test("fetchMultiDailyMetrics repeats the dailyMetrics query param", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().fetchMultiDailyMetrics({
      locationId: "locations/555",
      dailyMetrics: ["WEBSITE_CLICKS", "CALL_CLICKS"],
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  } finally {
    mock.restore();
  }
  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, "/v1/locations/555:fetchMultiDailyMetricsTimeSeries");
  assert.deepEqual(url.searchParams.getAll("dailyMetrics"), ["WEBSITE_CLICKS", "CALL_CLICKS"]);
});

test("listSearchKeywordImpressions flattens the monthlyRange", async () => {
  const mock = mockFetch(() => okJson());
  try {
    await makeClient().listSearchKeywordImpressions({
      locationId: "555",
      startMonth: "2026-01",
      endMonth: "2026-06",
      pageSize: 10,
    });
  } finally {
    mock.restore();
  }
  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, "/v1/locations/555/searchkeywords/impressions/monthly");
  assert.equal(url.searchParams.get("monthlyRange.start_month.year"), "2026");
  assert.equal(url.searchParams.get("monthlyRange.start_month.month"), "1");
  assert.equal(url.searchParams.get("monthlyRange.end_month.year"), "2026");
  assert.equal(url.searchParams.get("monthlyRange.end_month.month"), "6");
  assert.equal(url.searchParams.get("pageSize"), "10");
});

test("reviews live on the legacy v4 host with full accounts/*/locations/* names", async () => {
  const mock = mockFetch(() => okJson());
  try {
    const client = makeClient();
    await client.listReviews({ accountId: "1", locationId: "2", pageSize: 50 });
    await client.getReview({ accountId: "accounts/1", locationId: "locations/2", reviewId: "r9" });
    await client.replyToReview({ accountId: "1", locationId: "2", reviewId: "r9", comment: "Thank you!" });
    await client.deleteReviewReply({ accountId: "1", locationId: "2", reviewId: "r9" });
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.v4}/v4/accounts/1/locations/2/reviews?pageSize=50`);
  assert.equal(mock.calls[1].url, `${BASES.v4}/v4/accounts/1/locations/2/reviews/r9`);
  assert.equal(mock.calls[2].method, "PUT");
  assert.equal(mock.calls[2].url, `${BASES.v4}/v4/accounts/1/locations/2/reviews/r9/reply`);
  assert.deepEqual(mock.calls[2].body, { comment: "Thank you!" });
  assert.equal(mock.calls[3].method, "DELETE");
  assert.equal(mock.calls[3].url, `${BASES.v4}/v4/accounts/1/locations/2/reviews/r9/reply`);
  assert.equal(mock.calls[3].body, undefined);
});

test("local posts live on the legacy v4 host (list/create/update/delete)", async () => {
  const mock = mockFetch(() => okJson());
  try {
    const client = makeClient();
    await client.listLocalPosts({ accountId: "1", locationId: "2", pageSize: 20 });
    await client.createLocalPost({ accountId: "1", locationId: "2", post: { topicType: "STANDARD", summary: "Hi" } });
    await client.updateLocalPost({ accountId: "1", locationId: "2", postId: "p3", updateMask: "summary", post: { summary: "New" } });
    await client.deleteLocalPost({ accountId: "1", locationId: "2", postId: "p3" });
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.v4}/v4/accounts/1/locations/2/localPosts?pageSize=20`);
  assert.equal(mock.calls[1].method, "POST");
  assert.deepEqual(mock.calls[1].body, { topicType: "STANDARD", summary: "Hi" });
  assert.equal(mock.calls[2].method, "PATCH");
  assert.equal(mock.calls[2].url, `${BASES.v4}/v4/accounts/1/locations/2/localPosts/p3?updateMask=summary`);
  assert.deepEqual(mock.calls[2].body, { summary: "New" });
  assert.equal(mock.calls[3].method, "DELETE");
  assert.equal(mock.calls[3].url, `${BASES.v4}/v4/accounts/1/locations/2/localPosts/p3`);
});

// ---------- errors ----------

test("non-2xx throws GoogleBusinessError with the parsed Google envelope", async () => {
  const mock = mockFetch(
    () =>
      new Response(
        JSON.stringify({ error: { code: 403, message: "The caller does not have permission", status: "PERMISSION_DENIED" } }),
        { status: 403 },
      ),
  );
  try {
    await assert.rejects(
      () => makeClient().listAccounts(),
      /HTTP 403: \[PERMISSION_DENIED\] The caller does not have permission/,
    );
  } finally {
    mock.restore();
  }
});

test("quota errors carry the Basic API Access hint (unapproved projects have 0 QPM)", async () => {
  const mock = mockFetch(
    () =>
      new Response(
        JSON.stringify({ error: { code: 429, message: "Quota exceeded", status: "RESOURCE_EXHAUSTED" } }),
        { status: 429 },
      ),
  );
  try {
    await assert.rejects(
      () => makeClient().listAccounts(),
      /Application for Basic API Access/,
    );
  } finally {
    mock.restore();
  }
});

// ---------- retry / timeout / SSRF ----------

test("request() retries a 429 then returns the result", async () => {
  let n = 0;
  const mock = mockFetch(() => {
    n++;
    if (n === 1) return new Response("rate limited", { status: 429 });
    return okJson();
  });
  try {
    const result = await makeClient({ maxRetries: 2 }).listAccounts();
    assert.deepEqual(result, { ok: true });
    assert.equal(n, 2);
  } finally {
    mock.restore();
  }
});

test("request() retries a 5xx on idempotent methods only — a POST is never replayed", async () => {
  let n = 0;
  const mock = mockFetch(() => {
    n++;
    if (n === 1) return new Response("unavailable", { status: 503 });
    return okJson();
  });
  try {
    const result = await makeClient({ maxRetries: 2 }).listAccounts();
    assert.deepEqual(result, { ok: true });
    assert.equal(n, 2, "GET must retry the 503");
  } finally {
    mock.restore();
  }

  n = 0;
  const mock2 = mockFetch(() => {
    n++;
    return new Response("bad gateway", { status: 502 });
  });
  try {
    await assert.rejects(
      () => makeClient({ maxRetries: 2 }).createLocalPost({ accountId: "1", locationId: "2", post: {} }),
      /HTTP 502/,
    );
    assert.equal(n, 1, "a 502 after a committed POST would duplicate the post — no retry");
  } finally {
    mock2.restore();
  }
});

test("request() does not retry a 400 and gives up after maxRetries on 429", async () => {
  let n = 0;
  const mock = mockFetch(() => {
    n++;
    return new Response("nope", { status: 400 });
  });
  try {
    await assert.rejects(() => makeClient({ maxRetries: 2 }).listAccounts(), /HTTP 400/);
    assert.equal(n, 1);
  } finally {
    mock.restore();
  }

  n = 0;
  const mock2 = mockFetch(() => {
    n++;
    return new Response("slow down", { status: 429 });
  });
  try {
    await assert.rejects(() => makeClient({ maxRetries: 2 }).listAccounts(), /HTTP 429/);
    assert.equal(n, 3); // initial + 2 retries
  } finally {
    mock2.restore();
  }
});

test("request() retries a network error for reads and rethrows it for a POST", async () => {
  let n = 0;
  const mock = mockFetch(() => {
    n++;
    if (n === 1) throw new Error("ECONNRESET");
    return okJson();
  });
  try {
    const result = await makeClient({ maxRetries: 2 }).listAccounts();
    assert.deepEqual(result, { ok: true });
    assert.equal(n, 2);
  } finally {
    mock.restore();
  }

  n = 0;
  const mock2 = mockFetch(() => {
    n++;
    throw new Error("ECONNRESET");
  });
  try {
    await assert.rejects(
      () => makeClient({ maxRetries: 2 }).createLocalPost({ accountId: "1", locationId: "2", post: {} }),
      /ECONNRESET/,
    );
    assert.equal(n, 1);
  } finally {
    mock2.restore();
  }
});

test("request() aborts and reports a timeout when the request hangs", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = ((_url: unknown, init: unknown) =>
    new Promise((_resolve, reject) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      signal.addEventListener("abort", () =>
        reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
      );
    })) as typeof fetch;
  try {
    const client = makeClient({ timeoutMs: 10, maxRetries: 0 });
    await assert.rejects(() => client.listAccounts(), /timed out after 10ms/);
  } finally {
    globalThis.fetch = original;
  }
});

test("request() rejects an absolute path (SSRF) and never fetches a foreign origin", async () => {
  for (const evil of ["https://evil.example/steal", "http://evil.example/x", "\\\\evil.example/x"]) {
    const mock = mockFetch(() => okJson());
    try {
      await assert.rejects(() => makeClient().request("v4", "GET", evil), /foreign origin/);
      assert.equal(mock.calls.length, 0, `must not fetch for ${JSON.stringify(evil)}`);
    } finally {
      mock.restore();
    }
  }
});

test("request() still accepts a relative API path on every service", async () => {
  const mock = mockFetch(() => okJson());
  try {
    const client = makeClient();
    await client.request("accounts", "GET", "v1/accounts");
    await client.request("businessinfo", "GET", "/v1/categories");
    await client.request("performance", "GET", "v1/locations/1:getDailyMetricsTimeSeries");
    await client.request("v4", "GET", "v4/accounts/1/locations/2/reviews");
  } finally {
    mock.restore();
  }
  assert.equal(mock.calls[0].url, `${BASES.accounts}/v1/accounts`);
  assert.equal(mock.calls[1].url, `${BASES.businessinfo}/v1/categories`);
  assert.equal(mock.calls[2].url, `${BASES.performance}/v1/locations/1:getDailyMetricsTimeSeries`);
  assert.equal(mock.calls[3].url, `${BASES.v4}/v4/accounts/1/locations/2/reviews`);
});
