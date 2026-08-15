#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleBusinessClient } from "./client.js";
import { ConfigError, DEFAULT_BASES, hasCredentials, loadConfig } from "./config.js";
import { instrumentToolCalls, Telemetry } from "./telemetry.js";
import type { GoogleBusinessConfig } from "./types.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerLocationTools } from "./tools/locations.js";
import { registerPerformanceTools } from "./tools/performance.js";
import { registerReviewTools } from "./tools/reviews.js";
import { registerPostTools } from "./tools/posts.js";
import { registerRawTool } from "./tools/raw.js";

/**
 * Server instructions: the `initialize` result's prose, and the only text the
 * calling model reads before it picks a tool. It carries what the tool list
 * cannot — what this API is (and is not), the quota that makes every call fail,
 * where writes are irreversible, and what simply has no tool here. Keep it
 * dense; it is prepended to every session's context.
 */
const INSTRUCTIONS =
  "Google Business Profile (formerly Google My Business) manages the Search and Maps listings the " +
  "authenticated Google account owns or manages: profile fields, reviews, local posts and metrics. " +
  "It is not Google Ads, and a listing the account does not manage is unreachable — only profiles " +
  "under the accounts list_accounts returns exist here. Creating a location and managing profile " +
  "photos have no dedicated tool: raw_request is the only route; verifying a location is not " +
  "possible at all (the Verifications API lives on a separate host this server cannot reach). " +
  "If every call " +
  "fails with a 429/403 quota error you are not sending too many requests: Business Profile APIs " +
  "ship with a default quota of 0 QPM until Google approves the project's Application for Basic API " +
  "Access (approved projects get 300 QPM per API), and writes additionally share a hard, " +
  "non-raisable cap of 10 edits per minute per profile. An empty account list means the " +
  "credentials' Google account manages no profile rather than a bad token. Writes are public and " +
  "there is no undo: reply_to_review overwrites an existing reply without warning, deletions are " +
  "final, and update_location's validateOnly is the only dry run available.";

/**
 * Prepended to INSTRUCTIONS when no credentials are configured. The model reads
 * this before it picks a tool, so an unconfigured session opens with the fix
 * rather than with a failed call. There is no in-chat login here: credentials
 * come only from the environment, so the fix is an operator action + restart.
 */
const UNCONFIGURED_PREFIX =
  "ATTENTION: Google Business Profile is not connected yet — no credentials are configured, so " +
  "every tool call will fail. The operator must set GOOGLE_BUSINESS_CLIENT_ID + " +
  "GOOGLE_BUSINESS_CLIENT_SECRET + GOOGLE_BUSINESS_REFRESH_TOKEN (OAuth2 refresh flow; the " +
  "README's \"Getting credentials\" section shows how to mint the refresh token via the OAuth " +
  "2.0 Playground), or GOOGLE_BUSINESS_ACCESS_TOKEN with a short-lived access token, in the " +
  "MCP client's server config and restart this server — the variables are read only at " +
  "startup. ";

/** Reads the package version so the server reports its real version to MCP clients. */
function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Loads the config without dying on a bad value. A server that exits here never
 * completes the MCP handshake, so the user sees a dead server and no reason.
 * Instead the problem is carried into the session, where the model can read it
 * and relay it: the config degrades to "no credentials" and every tool call
 * fails with the actionable message.
 */
function loadConfigOrDegraded(telemetry: Telemetry): {
  config: GoogleBusinessConfig;
  problem?: ConfigError;
} {
  try {
    return { config: loadConfig() };
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err;
    console.error(`Error: ${err.message}`);
    // Fire-and-forget now that the process survives: the historical
    // `startup_failed` funnel stays comparable, but nothing blocks startup.
    telemetry.send("startup_failed", { reason: err.reason });
    return {
      config: {
        apiBases: {
          accounts: process.env.GOOGLE_BUSINESS_ACCOUNTS_API_BASE || DEFAULT_BASES.accounts,
          businessinfo: process.env.GOOGLE_BUSINESS_INFO_API_BASE || DEFAULT_BASES.businessinfo,
          performance: process.env.GOOGLE_BUSINESS_PERFORMANCE_API_BASE || DEFAULT_BASES.performance,
          v4: process.env.GOOGLE_BUSINESS_V4_API_BASE || DEFAULT_BASES.v4,
        },
      },
      problem: err,
    };
  }
}

async function main(): Promise<void> {
  // Anonymous usage pings (ids/names/versions only, never data or arguments);
  // opt out with ASKADS_TELEMETRY=0. Built before the config so a malformed
  // config can be reported; wired to the server before tools register.
  const telemetry = new Telemetry(readVersion());
  const { config, problem } = loadConfigOrDegraded(telemetry);
  const client = new GoogleBusinessClient(config);

  // Decided once, at startup: credentials come only from the environment, so
  // "restart after setting the variables" is the accurate advice to give.
  const connected = hasCredentials(config);

  const server = new McpServer(
    {
      name: "mcp-google-business",
      version: readVersion(),
    },
    {
      instructions: connected
        ? INSTRUCTIONS
        : UNCONFIGURED_PREFIX + (problem ? `Configuration problem: ${problem.message} ` : "") + INSTRUCTIONS,
    },
  );

  instrumentToolCalls(server, telemetry);
  server.server.oninitialized = () => {
    telemetry.setClientInfo(server.server.getClientVersion());
    // Split on purpose: `server_start` keeps meaning "a usable install started",
    // so the unconfigured case gets its own event instead of inflating that number.
    if (connected) telemetry.send("server_start");
    else telemetry.send("unconfigured_start", { reason: problem?.reason ?? "missing_credentials" });
  };

  registerAccountTools(server, client);
  registerLocationTools(server, client);
  registerPerformanceTools(server, client);
  registerReviewTools(server, client);
  registerPostTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `mcp-google-business running on stdio${connected ? "" : " (no credentials — set the environment variables and restart)"}`,
  );
}

main().catch((err) => {
  console.error("Fatal error starting mcp-google-business:", err);
  process.exit(1);
});
