# Google Business Profile: Get a location — MCP tool

**Google Business Profile MCP tool:** Returns one location by id (Business Information API; v1 uses the bare locations/{id} name, no account prefix).

Technical name: `get_location`

## What task it solves

> I want to get a location.

Returns one location by id (Business Information API; v1 uses the bare locations/{id} name, no account prefix).

## When to use it

Use this capability when you need “Get a location” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id — bare "123", "locations/123" or "accounts/1/locations/123" all work.
- `readMask` — **optional**. Comma-separated FieldMask of Location fields to return, e.g. "name,title,storefrontAddress,regularHours,metadata". The API requires it; omit to use the default "name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata".

## What it returns

Returns one location by id (Business Information API; v1 uses the bare locations/{id} name, no account prefix).

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Get a location in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

The readMask picks which fields come back: title, categories, storefrontAddress, phoneNumbers, websiteUri, regularHours, specialHours, openInfo, profile (description), storeCode, latlng, metadata (mapsUri, newReviewUri, placeId).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [Search business categories](./list-categories.md) — `list_categories`
- [List locations of an account](./list-locations.md) — `list_locations`
- [Search chains](./search-chains.md) — `search_chains`

## Technical details

- **Impact:** read-only
- **Group:** Locations
- **Description source:** `get_location` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
