# Google Business Profile: List available attributes — MCP tool

**Google Business Profile MCP tool:** Lists which attributes (e.g.

Technical name: `list_attribute_metadata`

## What task it solves

> I want to list available attributes.

Lists which attributes (e.g.

## When to use it

Use this capability when you need “List available attributes” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **optional**. Location id to list attributes for (alternative to categoryName+regionCode).
- `categoryName` — **optional**. Category, e.g. "gcid:restaurant" or "categories/gcid:restaurant".
- `regionCode` — **optional**. ISO 3166-1 alpha-2 country code (with categoryName).
- `languageCode` — **optional**. BCP 47 language for display names.
- `showAll` — **optional**. Return the whole attribute catalog (requires regionCode + languageCode).
- `pageSize` — **optional**. Attributes per page (default 200).
- `pageToken` — **optional**. nextPageToken from the previous page.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> List available attributes in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

wheelchair accessibility, wi-fi, payment options) are legal for a location or for a category+region. Pass locationId for a concrete location, OR categoryName+regionCode to explore. Each entry has parent (the attribute id for update_location_attributes), valueType (BOOL / ENUM / REPEATED_ENUM / URL), displayName, repeatable and valueMetadata (legal values).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [Search business categories](./list-categories.md) — `list_categories`
- [List locations of an account](./list-locations.md) — `list_locations`
- [Search chains](./search-chains.md) — `search_chains`

## Technical details

- **Impact:** read-only
- **Group:** Locations
- **Description source:** `list_attribute_metadata` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
