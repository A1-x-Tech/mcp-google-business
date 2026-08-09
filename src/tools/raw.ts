import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient, HttpMethod, Query } from "../client.js";
import { fail, ok, RAW } from "./util.js";

export function registerRawTool(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "raw_request",
    {
      title: "Raw Google Business Profile API call",
      // Write API escape hatch: it can express creates and deletes, so it is
      // deliberately NOT read-only (see util.ts RAW).
      annotations: RAW,
      description:
        "Escape hatch to call any Google Business Profile endpoint directly, for endpoints without a dedicated " +
        "tool. `service` picks the host: accounts (mybusinessaccountmanagement, v1), businessinfo " +
        "(mybusinessbusinessinformation, v1), performance (businessprofileperformance, v1) or v4 (legacy " +
        'mybusiness.googleapis.com — reviews, posts, media). `path` is relative to the host, e.g. "v1/accounts" ' +
        'or "v4/accounts/1/locations/2/media". Remember v1 quirks: readMask/updateMask go in `query`. ' +
        "The Bearer token is attached automatically; a path resolving to a foreign origin is rejected.",
      inputSchema: {
        service: z
          .enum(["accounts", "businessinfo", "performance", "v4"])
          .describe("Which API host to call."),
        path: z.string().min(1).describe('API path relative to the host, e.g. "v1/accounts".'),
        method: z
          .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
          .optional()
          .describe("HTTP method; defaults to GET."),
        query: z
          .record(z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]))
          .optional()
          .describe("Query parameters (arrays become repeated params)."),
        body: z.record(z.any()).optional().describe("JSON request body (POST/PUT/PATCH)."),
      },
    },
    async ({ service, path, method, query, body }) => {
      try {
        const m = (method ?? "GET") as HttpMethod;
        return ok(await client.request(service, m, path, { query: query as Query, body }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
