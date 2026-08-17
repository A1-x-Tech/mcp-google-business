# Google Business Profile: Search chains — MCP tool

**Google Business Profile MCP tool:** Searches business chains by name (exact/partial/fuzzy), ranked by relevance.

Technical name: `search_chains`

## What task it solves

> I want to search chains.

Searches business chains by name (exact/partial/fuzzy), ranked by relevance.

## When to use it

Use this capability when you need “Search chains” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `chainName` — **required**. Chain name to search for, e.g. "walmart".
- `pageSize` — **optional**. Matches to return (1..500; default 10).

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Search chains in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Each chain has name (chains/{chain_id}), chainNames, websites and locationCount. Use the chain name when relating a location to its brand (location.relationshipData).

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [Search business categories](./list-categories.md) — `list_categories`
- [List locations of an account](./list-locations.md) — `list_locations`

## Technical details

- **Impact:** read-only
- **Group:** Locations
- **Description source:** `search_chains` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
