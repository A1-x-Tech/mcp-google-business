# Google Business Profile: Search business categories — MCP tool

**Google Business Profile MCP tool:** Lists/searches the reference taxonomy of business categories (e.g.

Technical name: `list_categories`

## What task it solves

> I want to search business categories.

Lists/searches the reference taxonomy of business categories (e.g.

## When to use it

Use this capability when you need “Search business categories” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `regionCode` — **required**. ISO 3166-1 alpha-2 country code the categories should be valid in, e.g. "US".
- `languageCode` — **required**. BCP 47 language for display names, e.g. "en".
- `view` — **optional**. BASIC (default) returns name + displayName; FULL adds serviceTypes and moreHoursTypes.
- `filter` — **optional**. Filter, e.g. "displayName=coffee".
- `pageSize` — **optional**. Categories per page (1..100; default 100).
- `pageToken` — **optional**. nextPageToken from the previous page.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Search business categories in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

gcid:restaurant). Category names (categories/gcid:...) feed location.categories on update_location and categoryName on list_attribute_metadata. view=FULL also returns serviceTypes and moreHoursTypes per category; filter narrows by display name, e.g. "displayName=coffee".

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [List locations of an account](./list-locations.md) — `list_locations`
- [Search chains](./search-chains.md) — `search_chains`

## Technical details

- **Impact:** read-only
- **Group:** Locations
- **Description source:** `list_categories` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
