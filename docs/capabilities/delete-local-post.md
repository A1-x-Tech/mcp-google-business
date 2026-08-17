# Google Business Profile: Delete a local post — MCP tool

**Google Business Profile MCP tool:** Deletes a local post from the Business Profile.

Technical name: `delete_local_post`

## What task it solves

> I want to delete a local post.

Deletes a local post from the Business Profile.

## When to use it

Use this capability when you need “Delete a local post” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `postId` — **required**. Local post id (last segment of the post's `name`).

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The source marks the entire “Delete a local post” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Delete a local post in Google Business Profile. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

Empty response on success. Local posts live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create a local post](./create-local-post.md) — `create_local_post`
- [List local posts](./list-local-posts.md) — `list_local_posts`
- [Update a local post](./update-local-post.md) — `update_local_post`

## Technical details

- **Impact:** destructive operation
- **Group:** Local posts
- **Description source:** `delete_local_post` registration in `src/tools/posts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
