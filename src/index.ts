#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleBusinessClient } from "./client.js";
import { ConfigError, loadConfig } from "./config.js";
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
  "under the accounts list_accounts returns exist here. Creating or verifying a location and " +
  "managing profile photos have no dedicated tool: raw_request is the only route. If every call " +
  "fails with a 429/403 quota error you are not sending too many requests: Business Profile APIs " +
  "ship with a default quota of 0 QPM until Google approves the project's Application for Basic API " +
  "Access (approved projects get 300 QPM per API), and writes additionally share a hard, " +
  "non-raisable cap of 10 edits per minute per profile. An empty account list means the " +
  "credentials' Google account manages no profile rather than a bad token. Writes are public and " +
  "there is no undo: reply_to_review overwrites an existing reply without warning, deletions are " +
  "final, and update_location's validateOnly is the only dry run available.";

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
 * Loads the config, reporting the drop-off if it is missing. An unconfigured
 * server dies before the MCP handshake, so this ping is the only trace such an
 * install ever leaves — and it has to be awaited, or process.exit() below would
 * kill the request in flight.
 */
async function loadConfigOrExit(telemetry: Telemetry): Promise<GoogleBusinessConfig> {
  try {
    return loadConfig();
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err;
    console.error(`Error: ${err.message}`);
    await telemetry.sendBlocking("startup_failed", { reason: err.reason });
    process.exit(1);
  }
}

async function main(): Promise<void> {
  // Anonymous usage pings (ids/names/versions only, never data or arguments);
  // opt out with ASKADS_TELEMETRY=0. Built before the config so missing
  // credentials can be reported; wired to the server before tools register.
  const telemetry = new Telemetry(readVersion());
  const config = await loadConfigOrExit(telemetry);
  const client = new GoogleBusinessClient(config);

  const server = new McpServer(
    {
      name: "mcp-google-business",
      version: readVersion(),
    },
    { instructions: INSTRUCTIONS },
  );

  instrumentToolCalls(server, telemetry);
  server.server.oninitialized = () => {
    telemetry.setClientInfo(server.server.getClientVersion());
    telemetry.send("server_start");
  };

  registerAccountTools(server, client);
  registerLocationTools(server, client);
  registerPerformanceTools(server, client);
  registerReviewTools(server, client);
  registerPostTools(server, client);
  registerRawTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-google-business running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting mcp-google-business:", err);
  process.exit(1);
});
