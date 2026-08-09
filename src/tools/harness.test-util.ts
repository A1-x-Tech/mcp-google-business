/**
 * Shared test harness for tool modules: a fake server that captures handlers
 * and a fake client that records calls. Not a test file itself (the .test-util
 * suffix keeps it out of the `find src -name '*.test.ts'` glob).
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoogleBusinessClient } from "../client.js";

export type Args = Record<string, unknown>;
export type Handler = (args: Args) => Promise<{ content: { text: string }[]; isError?: boolean }>;

export interface Harness {
  calls: { method: string; params: unknown }[];
  tools: Record<string, Handler>;
}

/** Builds fake server+client and runs the given register functions against them. */
export function harness(
  register: (server: McpServer, client: GoogleBusinessClient) => void,
  opts: { throwOn?: string } = {},
): Harness {
  const calls: { method: string; params: unknown }[] = [];
  const client = new Proxy(
    {},
    {
      get:
        (_target, prop: string) =>
        async (params: unknown) => {
          calls.push({ method: prop, params });
          if (opts.throwOn === prop) throw new Error("boom");
          return { ok: true };
        },
    },
  ) as GoogleBusinessClient;
  const tools: Record<string, Handler> = {};
  const server = {
    registerTool: (name: string, _cfg: unknown, handler: Handler) => {
      tools[name] = handler;
    },
  } as unknown as McpServer;
  register(server, client);
  return { calls, tools };
}
