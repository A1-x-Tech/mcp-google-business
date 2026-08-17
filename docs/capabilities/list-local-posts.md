# Google Business Profile: List local posts — MCP tool

**Google Business Profile MCP tool:** Lists the local posts (What's New / Event / Offer updates shown on the Business Profile) of a location.

Technical name: `list_local_posts`

## What task it solves

> I want to list local posts.

Lists the local posts (What's New / Event / Offer updates shown on the Business Profile) of a location.

## When to use it

Use this capability when you need “List local posts” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `pageSize` — **optional**. Posts per page (default 20).
- `pageToken` — **optional**. nextPageToken from the previous page.

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> List local posts in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Each post has name (accounts/*/locations/*/localPosts/{post_id}), summary, topicType, state (LIVE / PROCESSING / REJECTED), searchUrl, createTime and updateTime. Local posts live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create a local post](./create-local-post.md) — `create_local_post`
- [Delete a local post](./delete-local-post.md) — `delete_local_post`
- [Update a local post](./update-local-post.md) — `update_local_post`

## Technical details

- **Impact:** read-only
- **Group:** Local posts
- **Description source:** `list_local_posts` registration in `src/tools/posts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
