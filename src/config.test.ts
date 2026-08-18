import { test } from "node:test";
import assert from "node:assert/strict";

import { ConfigError, DEFAULT_BASES, hasCredentials, loadConfig } from "./config.js";

/** Every variable loadConfig reads — cleared before each case for determinism. */
const ALL_VARS = [
  "GOOGLE_BUSINESS_CLIENT_ID",
  "GOOGLE_BUSINESS_CLIENT_SECRET",
  "GOOGLE_BUSINESS_REFRESH_TOKEN",
  "GOOGLE_BUSINESS_ACCESS_TOKEN",
  "GOOGLE_BUSINESS_ACCOUNTS_API_BASE",
  "GOOGLE_BUSINESS_INFO_API_BASE",
  "GOOGLE_BUSINESS_PERFORMANCE_API_BASE",
  "GOOGLE_BUSINESS_V4_API_BASE",
  "GOOGLE_BUSINESS_TIMEOUT_MS",
  "GOOGLE_BUSINESS_MAX_RETRIES",
] as const;

/**
 * The reason codes below are the vocabulary the telemetry dashboard groups by —
 * renaming one silently splits a bar in two, so they are pinned here.
 */
function withEnv(vars: Record<string, string | undefined>, run: () => void): void {
  const keys = new Set([...ALL_VARS, ...Object.keys(vars)]);
  const saved = new Map([...keys].map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined) process.env[k] = v;
  }
  try {
    run();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function reasonOf(vars: Record<string, string | undefined>): string {
  let caught: unknown;
  withEnv(vars, () => {
    try {
      loadConfig();
    } catch (err) {
      caught = err;
    }
  });
  assert.ok(caught instanceof ConfigError, "config problems must throw ConfigError, not exit");
  return caught.reason;
}

/**
 * Missing credentials used to throw here, which killed the process before the
 * MCP handshake and left the user with a dead server and no reason. It is now
 * a survivable state: the server starts degraded and the client raises
 * CredentialsError on the first call instead (pinned in client.test.ts).
 * Reverting this would restore that dead end.
 */
test("no credentials at all is not an error — the config loads with empty fields", () => {
  withEnv({}, () => {
    const config = loadConfig();
    assert.equal(config.clientId, undefined);
    assert.equal(config.clientSecret, undefined);
    assert.equal(config.refreshToken, undefined);
    assert.equal(config.accessToken, undefined);
    assert.deepEqual(config.apiBases, DEFAULT_BASES);
    assert.equal(hasCredentials(config), false);
  });
});

test("empty strings read as absent — not as an incomplete trio", () => {
  withEnv(
    {
      GOOGLE_BUSINESS_CLIENT_ID: "",
      GOOGLE_BUSINESS_CLIENT_SECRET: "",
      GOOGLE_BUSINESS_REFRESH_TOKEN: "",
      GOOGLE_BUSINESS_ACCESS_TOKEN: "",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.clientId, undefined);
      assert.equal(config.accessToken, undefined);
      assert.equal(hasCredentials(config), false);
    },
  );
});

test("a partial OAuth trio reports incomplete_oauth_credentials", () => {
  assert.equal(
    reasonOf({ GOOGLE_BUSINESS_CLIENT_ID: "id", GOOGLE_BUSINESS_CLIENT_SECRET: "sec" }),
    "incomplete_oauth_credentials",
  );
  assert.equal(reasonOf({ GOOGLE_BUSINESS_REFRESH_TOKEN: "ref" }), "incomplete_oauth_credentials");
});

test("the full OAuth trio loads without throwing", () => {
  withEnv(
    {
      GOOGLE_BUSINESS_CLIENT_ID: "id",
      GOOGLE_BUSINESS_CLIENT_SECRET: "sec",
      GOOGLE_BUSINESS_REFRESH_TOKEN: "ref",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.refreshToken, "ref");
      assert.deepEqual(config.apiBases, DEFAULT_BASES);
      assert.equal(config.timeoutMs, 60_000);
      assert.equal(config.maxRetries, 3);
      assert.equal(hasCredentials(config), true);
    },
  );
});

test("a static access token alone is a valid config", () => {
  withEnv({ GOOGLE_BUSINESS_ACCESS_TOKEN: "tok" }, () => {
    const config = loadConfig();
    assert.equal(config.accessToken, "tok");
    assert.equal(hasCredentials(config), true);
  });
});

test("per-service base overrides are honored", () => {
  withEnv(
    {
      GOOGLE_BUSINESS_ACCESS_TOKEN: "tok",
      GOOGLE_BUSINESS_V4_API_BASE: "http://localhost:8080",
      GOOGLE_BUSINESS_INFO_API_BASE: "http://localhost:8081",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.apiBases.v4, "http://localhost:8080");
      assert.equal(config.apiBases.businessinfo, "http://localhost:8081");
      assert.equal(config.apiBases.accounts, DEFAULT_BASES.accounts);
      assert.equal(config.apiBases.performance, DEFAULT_BASES.performance);
    },
  );
});

test("invalid numeric envs silently fall back to defaults", () => {
  withEnv(
    {
      GOOGLE_BUSINESS_ACCESS_TOKEN: "tok",
      GOOGLE_BUSINESS_TIMEOUT_MS: "not-a-number",
      GOOGLE_BUSINESS_MAX_RETRIES: "-5",
    },
    () => {
      const config = loadConfig();
      assert.equal(config.timeoutMs, 60_000);
      assert.equal(config.maxRetries, 3);
    },
  );
});
