import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient } from "../client.js";
import { fail, ok, READ_ONLY } from "./util.js";

export function registerAccountTools(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "list_accounts",
    {
      title: "List Business Profile accounts",
      annotations: READ_ONLY,
      description:
        "Lists all Google Business Profile accounts the authenticated user can access (the personal account first). " +
        "Each account has name (accounts/{id} — the id feeds the accountId of other tools), accountName, " +
        "type (PERSONAL / LOCATION_GROUP / USER_GROUP / ORGANIZATION), role, and verificationState. " +
        "The API caps pageSize at 20 (unusually small), so follow nextPageToken to see every account.",
      inputSchema: {
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Accounts per page (1..20 — the API's hard cap; default 20)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
        parentAccount: z
          .string()
          .optional()
          .describe("Account id or accounts/{id}: list this account's sub-accounts instead of top-level ones."),
        filter: z
          .string()
          .optional()
          .describe('Filter expression, e.g. "type=USER_GROUP". Omit to list every account.'),
      },
    },
    async ({ pageSize, pageToken, parentAccount, filter }) => {
      try {
        return ok(await client.listAccounts({ pageSize, pageToken, parentAccount, filter }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
