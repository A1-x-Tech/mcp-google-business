# Google Business Profile: Raw Google Business Profile API call — MCP tool

**Google Business Profile MCP tool:** Escape hatch to call any Google Business Profile endpoint directly, for endpoints without a dedicated tool.

Technical name: `raw_request`

## What task it solves

> I want to raw Google Business Profile API call.

Escape hatch to call any Google Business Profile endpoint directly, for endpoints without a dedicated tool.

## When to use it

Use this capability when you need “Raw Google Business Profile API call” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `service` — **required**. Which API host to call.
- `path` — **required**. API path relative to the host, e.g. "v1/accounts".
- `method` — **optional**. HTTP method; defaults to GET.
- `query` — **optional**. Query parameters (arrays become repeated params).
- `body` — **optional**. JSON request body (POST/PUT/PATCH).

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The source marks the entire “Raw Google Business Profile API call” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Raw Google Business Profile API call in Google Business Profile. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

`service` picks the host: accounts (mybusinessaccountmanagement, v1), businessinfo (mybusinessbusinessinformation, v1), performance (businessprofileperformance, v1) or v4 (legacy mybusiness.googleapis.com — reviews, posts, media). `path` is relative to the host, e.g. "v1/accounts" or "v4/accounts/1/locations/2/media". Remember v1 quirks: readMask/updateMask go in `query`. The Bearer token is attached automatically; a path resolving to a foreign origin is rejected.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

There are no other dedicated tools in this group.

## Technical details

- **Impact:** destructive operation
- **Group:** Additional API methods
- **Description source:** `raw_request` registration in `src/tools/raw.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
