import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { GoogleBusinessClient } from "../dist/client.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const ALL_TOOLS = [
  "create_local_post",
  "delete_local_post",
  "delete_review_reply",
  "fetch_multi_daily_metrics",
  "get_daily_metrics",
  "get_location",
  "get_review",
  "list_accounts",
  "list_attribute_metadata",
  "list_categories",
  "list_local_posts",
  "list_locations",
  "list_reviews",
  "list_search_keyword_impressions",
  "raw_request",
  "reply_to_review",
  "search_chains",
  "update_local_post",
  "update_location",
  "update_location_attributes",
];

/** Spawns the built dist/index.js binary and completes a real MCP handshake over stdio. */
async function connectDist() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) env[k] = v;
  }
  env.GOOGLE_BUSINESS_ACCESS_TOKEN = "dist-smoke-token";
  env.ASKADS_TELEMETRY = "0";

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["dist/index.js"],
    cwd: ROOT,
    env,
    stderr: "ignore",
  });
  const client = new Client({ name: "dist-smoke", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

test("dist binary completes the MCP handshake over stdio and lists all tools", async () => {
  const client = await connectDist();
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ALL_TOOLS);
    for (const tool of tools) {
      assert.ok(tool.annotations, `${tool.name} must carry annotations`);
      assert.ok(tool.description, `${tool.name} must carry a description`);
    }
  } finally {
    await client.close();
  }
});

test("dist binary serves a tools/call end to end (SSRF guard, no network needed)", async () => {
  const client = await connectDist();
  try {
    const res = await client.callTool({
      name: "raw_request",
      arguments: { service: "v4", path: "https://evil.example/steal" },
    });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /foreign origin/);
  } finally {
    await client.close();
  }
});

test("dist client rejects foreign-origin paths before sending the Bearer token", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };
  try {
    const client = new GoogleBusinessClient({
      accessToken: "SECRET",
      apiBases: {
        accounts: "https://mybusinessaccountmanagement.googleapis.com",
        businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
        performance: "https://businessprofileperformance.googleapis.com",
        v4: "https://mybusiness.googleapis.com",
      },
      maxRetries: 0,
    });
    await assert.rejects(() => client.request("v4", "GET", "https://example.invalid/steal"), /foreign origin/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("dist client always sends a readMask on location reads (400 without it)", async () => {
  const original = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response("{}", { status: 200 });
  };
  try {
    const client = new GoogleBusinessClient({
      accessToken: "SECRET",
      apiBases: {
        accounts: "https://mybusinessaccountmanagement.googleapis.com",
        businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
        performance: "https://businessprofileperformance.googleapis.com",
        v4: "https://mybusiness.googleapis.com",
      },
      maxRetries: 0,
    });
    await client.getLocation({ locationId: "7" });
    assert.ok(new URL(urls[0]).searchParams.get("readMask"), "default readMask must be injected");
  } finally {
    globalThis.fetch = original;
  }
});
