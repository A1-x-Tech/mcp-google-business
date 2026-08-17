# Google Business Profile: Update a location — MCP tool

**Google Business Profile MCP tool:** Updates fields of a location (PATCH with a required updateMask — only masked fields change).

Technical name: `update_location`

## What task it solves

> I want to update a location.

Updates fields of a location (PATCH with a required updateMask — only masked fields change).

## When to use it

Use this capability when you need “Update a location” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id — bare "123", "locations/123" or "accounts/1/locations/123" all work.
- `updateMask` — **required**. Comma-separated FieldMask of the fields to overwrite, e.g. "title,phoneNumbers.primaryPhone".
- `location` — **required**. Location object with the new field values (only fields named in updateMask are applied).
- `validateOnly` — **optional**. If true, validate the update without applying it.

## What it returns

Returns the updated Location.

## What changes in Google Business Profile

The tool changes real Google Business Profile data as described above. The server does not promise an automatic rollback.

## Example request

> Update a location in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Pass the new values in `location`, e.g. {"title": "New name"} with updateMask "title". Set validateOnly to check the change without applying it. Note: every profile has a hard cap of 10 edits per minute (not raisable) — batch your changes into one call where possible.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a location](./get-location.md) — `get_location`
- [List available attributes](./list-attribute-metadata.md) — `list_attribute_metadata`
- [Search business categories](./list-categories.md) — `list_categories`
- [List locations of an account](./list-locations.md) — `list_locations`

## Technical details

- **Impact:** changes data
- **Group:** Locations
- **Description source:** `update_location` registration in `src/tools/locations.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
