import { test } from "node:test";
import assert from "node:assert/strict";
import { GoogleBusinessClient } from "../client.js";
import { registerRawTool } from "./raw.js";

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<{ content: { text: string }[]; isError?: boolean }>;

/** Registers raw_request against a real client with a recording fetch stub. */
function harness() {
  const original = globalThis.fetch;
  const calls: { url: string; method: string; body: unknown }[] = [];
  globalThis.fetch = (async (url: unknown, init: unknown) => {
    const i = (init ?? {}) as { method: string; body?: string };
    calls.push({ url: String(url), method: i.method, body: i.body ? JSON.parse(i.body) : undefined });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  const client = new GoogleBusinessClient({
    accessToken: "TKN",
    apiBases: {
      accounts: "https://mybusinessaccountmanagement.googleapis.com",
      businessinfo: "https://mybusinessbusinessinformation.googleapis.com",
      performance: "https://businessprofileperformance.googleapis.com",
      v4: "https://mybusiness.googleapis.com",
    },
    maxRetries: 0,
  });
  const tools: Record<string, Handler> = {};
  const server = { registerTool: (name: string, _cfg: unknown, h: Handler) => { tools[name] = h; } };
  registerRawTool(server as never, client);
  return { tools, calls, restore: () => { globalThis.fetch = original; } };
}

test("raw_request defaults to GET and routes to the selected service host", async () => {
  const { tools, calls, restore } = harness();
  try {
    const res = await tools.raw_request({ service: "accounts", path: "v1/accounts", query: { pageSize: 5 } });
    assert.equal(res.isError, undefined);
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].url, "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=5");
  } finally {
    restore();
  }
});

test("raw_request reaches the legacy v4 host with a body", async () => {
  const { tools, calls, restore } = harness();
  try {
    await tools.raw_request({
      service: "v4",
      path: "v4/accounts/1/locations/2/reviews/r/reply",
      method: "PUT",
      body: { comment: "hi" },
    });
    assert.equal(calls[0].method, "PUT");
    assert.equal(calls[0].url, "https://mybusiness.googleapis.com/v4/accounts/1/locations/2/reviews/r/reply");
    assert.deepEqual(calls[0].body, { comment: "hi" });
  } finally {
    restore();
  }
});

test("raw_request rejects an absolute path as an isError result, without fetching", async () => {
  for (const evil of ["https://evil.example/steal", "http://evil.example/x", "\\\\evil.example/x"]) {
    const { tools, calls, restore } = harness();
    try {
      const res = await tools.raw_request({ service: "businessinfo", path: evil });
      assert.equal(res.isError, true, `${JSON.stringify(evil)} should be isError`);
      assert.match(res.content[0].text, /foreign origin/);
      assert.equal(calls.length, 0, `must not fetch for ${JSON.stringify(evil)}`);
    } finally {
      restore();
    }
  }
});
