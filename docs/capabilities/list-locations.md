# Google Business Profile: List locations of an account — MCP tool

**Google Business Profile MCP tool:** Lists the business locations under an account (Business Information API).

Technical name: `list_locations`

## What task it solves

> I want to list locations of an account.

Lists the business locations under an account (Business Information API).

## When to use it

Use this capability when you need “List locations of an account” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123" (get it from list_accounts).
- `readMask` — **optional**. Comma-separated FieldMask of Location fields to return, e.g. "name,title,storefrontAddress,regularHours,metadata". The API requires it; omit to use the default "name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata".
- `pageSize` — **optional**. Locations per page (1..100; default 10).
- `pageToken` — **optional**. nextPageToken from the previous page.
- `filter` — **optional**. Filter expression, e.g. 'title="Coffee Corner"'. Also enables totalSize in the response.
- `orderBy` — **optional**. Sort order, e.g. "title" or "title, storeCode desc".

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> List locations of an account in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Each location's name is locations/{id} — that id feeds locationId everywhere else (including the Performance API and, together with the account id, the v4 reviews/posts tools). totalSize is only present when filter is set. Fields are limited by readMask; ask for metadata to get mapsUri/placeId/newReviewUri.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [Search business categories](./list-categories.md) — `list_categories`
- [Search chains](./search-chains.md) — `search_chains`

## Technical details

- **Impact:** read-only
- **Group:** Locations
- **Description source:** `list_locations` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
