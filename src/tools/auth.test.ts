import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OAuthError } from "@a1-x-tech/mcp-google-auth";
import {
  AUTH_OPTIONS,
  authUnconfiguredPrefix,
  hasAuthToken,
  LOGIN_SCOPES,
  registerAuthTools,
} from "./auth.js";

/**
 * Routing tests for the six onboarding tools the @a1-x-tech/mcp-google-auth
 * component registers on this server. The component's own suite covers the
 * OAuth flow in depth; these pin the wiring THIS repo owns — tool set, options
 * (env prefix, server name, scopes) and the degraded behavior — fully offline
 * and against an isolated config dir.
 */

interface Captured {
  config: { title?: string; description?: string; annotations?: Record<string, boolean> };
  handler: (args: Record<string, unknown>) => Promise<{ isError?: boolean; content: { text?: string }[] }>;
}

function fakeServer(): { tools: Map<string, Captured>; server: never } {
  const tools = new Map<string, Captured>();
  const server = {
    registerTool: (name: string, config: Captured["config"], handler: Captured["handler"]) => {
      tools.set(name, { config, handler });
    },
  };
  return { tools, server: server as never };
}

const ENV_KEYS = [
  "GOOGLE_BUSINESS_CLIENT_ID",
  "GOOGLE_BUSINESS_CLIENT_SECRET",
  "GOOGLE_BUSINESS_REFRESH_TOKEN",
  "GOOGLE_BUSINESS_ACCESS_TOKEN",
  "GOOGLE_BUSINESS_OAUTH_PORT",
];
const savedEnv = new Map<string, string | undefined>();
const originalFetch = globalThis.fetch;
let configDir: string;

before(() => {
  // Isolate from the developer's real login and env: the component reads
  // GOOGLE_BUSINESS_* live and re-reads $XDG_CONFIG_HOME files per call.
  for (const key of [...ENV_KEYS, "XDG_CONFIG_HOME"]) savedEnv.set(key, process.env[key]);
  for (const key of ENV_KEYS) delete process.env[key];
  configDir = mkdtempSync(join(tmpdir(), "mcp-business-auth-test-"));
  process.env.XDG_CONFIG_HOME = configDir;
});

after(() => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
  rmSync(configDir, { recursive: true, force: true });
});

test("options pin this server's wiring: env prefix, server name and documented scopes", () => {
  assert.equal(AUTH_OPTIONS.envPrefix, "GOOGLE_BUSINESS", "must read the same variables as config.ts");
  assert.equal(AUTH_OPTIONS.serverName, "business", "token path must be mcp-google-business/credentials.json");
  assert.deepEqual(LOGIN_SCOPES, [
    "https://www.googleapis.com/auth/business.manage",
  ]);
});

test("registers exactly the six contract tools and returns the shared TokenProvider", () => {
  const { tools, server } = fakeServer();
  const provider = registerAuthTools(server);
  assert.deepEqual(
    [...tools.keys()].sort(),
    ["auth_status", "finish_login", "logout", "set_client", "setup_instructions", "start_login"],
  );
  for (const [name, tool] of tools) {
    assert.ok(tool.config.title, `${name} needs a title`);
    assert.ok(tool.config.description, `${name} needs a description`);
    assert.ok(tool.config.annotations, `${name} needs annotations`);
  }
  // The provider is what the client plugs in as its fallback token source.
  assert.equal(typeof provider.getAccessToken, "function");
  assert.equal(typeof provider.canRefresh, "function");
  assert.equal(provider.hasToken(), false, "isolated config dir must read as not connected");
});

test("env priority flows through the provider: GOOGLE_BUSINESS_ACCESS_TOKEN wins (invariant 3)", async () => {
  const { server } = fakeServer();
  const provider = registerAuthTools(server);
  process.env.GOOGLE_BUSINESS_ACCESS_TOKEN = "ENV-TOK";
  try {
    assert.equal(provider.hasToken(), true);
    assert.equal(await provider.getAccessToken(), "ENV-TOK");
    assert.equal(hasAuthToken(), true, "index.ts's connected check must see the env token");
  } finally {
    delete process.env.GOOGLE_BUSINESS_ACCESS_TOKEN;
  }
  assert.equal(hasAuthToken(), false, "and read the environment live, not once");
});

test("auth_status routes to the provider: not connected, this server's paths, no error", async () => {
  const { tools, server } = fakeServer();
  registerAuthTools(server);
  const result = await tools.get("auth_status")!.handler({});
  assert.ok(!result.isError, "auth_status must not fail without credentials");
  const text = result.content.map((c) => c.text ?? "").join(" ");
  assert.match(text, /mcp-google-business/, "must report this server's own credentials path");
});

test("the unconfigured prefix offers the in-chat login first and the env path as alternative", () => {
  const prefix = authUnconfiguredPrefix();
  assert.match(prefix, /NOT CONNECTED/);
  assert.match(prefix, /start_login/);
  assert.match(prefix, /GOOGLE_BUSINESS_CLIENT_ID/);
  assert.ok(
    prefix.indexOf("start_login") < prefix.indexOf("GOOGLE_BUSINESS_CLIENT_ID"),
    "the no-restart fix must come before the restart one",
  );
});

test("verifyIdentity turns a disabled-API 403 into the enable-the-API advice", async () => {
  // Google reports a switched-off API two ways at once; the newer spelling is
  // used here, and the older errors[].reason is covered by the same matcher.
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: { code: 403, status: "PERMISSION_DENIED", details: [{ reason: "SERVICE_DISABLED" }] },
      }),
      { status: 403 },
    )) as typeof fetch;
  await assert.rejects(
    () => AUTH_OPTIONS.verifyIdentity!("TOKEN"),
    (error: unknown) => {
      assert.ok(error instanceof OAuthError, "a bare 403 would send the user to fix permissions instead");
      return true;
    },
  );
  globalThis.fetch = originalFetch;
});

test("verifyIdentity passes a plain failure through untouched", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: { code: 401, status: "UNAUTHENTICATED" } }), {
      status: 401,
    })) as typeof fetch;
  await assert.rejects(
    () => AUTH_OPTIONS.verifyIdentity!("TOKEN"),
    (error: unknown) => {
      assert.ok(!(error instanceof OAuthError), "only the disabled-API 403 is translated");
      return true;
    },
  );
  globalThis.fetch = originalFetch;
});
