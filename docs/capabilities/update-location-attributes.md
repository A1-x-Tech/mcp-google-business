# Google Business Profile: Update location attributes — MCP tool

**Google Business Profile MCP tool:** Updates attributes of a location (PATCH).

Technical name: `update_location_attributes`

## What task it solves

> I want to update location attributes.

Updates attributes of a location (PATCH).

## When to use it

Use this capability when you need “Update location attributes” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id — bare "123", "locations/123" or "accounts/1/locations/123" all work.
- `attributes` — **required**. Attribute objects to set, e.g. [{"name": "attributes/wi_fi", "repeatedEnumValue": {"setValues": ["free_wi_fi"]}}].
- `attributeMask` — **optional**. Comma-separated attribute names to update. Defaults to the names of `attributes`.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool changes real Google Business Profile data as described above. The server does not promise an automatic rollback.

## Example request

> Update location attributes in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Each attribute needs its name (attributes/{attribute_id} from list_attribute_metadata's parent field) plus values (BOOL/ENUM), uriValues (URL) or repeatedEnumValue ({setValues, unsetValues}). attributeMask defaults to the names of the attributes you pass; name an attribute in the mask with no values to clear it. Counts against the 10 edits/min per-profile cap.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [Search business categories](./list-categories.md) — `list_categories`
- [List locations of an account](./list-locations.md) — `list_locations`

## Technical details

- **Impact:** changes data
- **Group:** Locations
- **Description source:** `update_location_attributes` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
