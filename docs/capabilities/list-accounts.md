# Google Business Profile: List Business Profile accounts — MCP tool

**Google Business Profile MCP tool:** Lists all Google Business Profile accounts the authenticated user can access (the personal account first).

Technical name: `list_accounts`

## What task it solves

> I want to list Business Profile accounts.

Lists all Google Business Profile accounts the authenticated user can access (the personal account first).

## When to use it

Use this capability when you need “List Business Profile accounts” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `pageSize` — **optional**. Accounts per page (1..20 — the API's hard cap; default 20).
- `pageToken` — **optional**. nextPageToken from the previous page.
- `parentAccount` — **optional**. Account id or accounts/{id}: list this account's sub-accounts instead of top-level ones.
- `filter` — **optional**. Filter expression, e.g. "type=USER_GROUP". Omit to list every account.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> List Business Profile accounts in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Each account has name (accounts/{id} — the id feeds the accountId of other tools), accountName, type (PERSONAL / LOCATION_GROUP / USER_GROUP / ORGANIZATION), role, and verificationState. The API caps pageSize at 20 (unusually small), so follow nextPageToken to see every account.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

There are no other dedicated tools in this group.

## Technical details

- **Impact:** read-only
- **Group:** Accounts
- **Description source:** `list_accounts` registration in `src/tools/accounts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
