# Google Business Profile: Update a local post — MCP tool

**Google Business Profile MCP tool:** Updates fields of an existing local post (PATCH with a required updateMask — only masked fields change, e.g.

Technical name: `update_local_post`

## What task it solves

> I want to update a local post.

Updates fields of an existing local post (PATCH with a required updateMask — only masked fields change, e.g.

## When to use it

Use this capability when you need “Update a local post” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `postId` — **required**. Local post id (last segment of the post's `name`).
- `updateMask` — **required**. Comma-separated FieldMask of post fields to overwrite, e.g. "summary,callToAction".
- `post` — **required**. Partial LocalPost with the new field values.

## What it returns

Returns the updated post.

## What changes in Google Business Profile

The tool changes real Google Business Profile data as described above. The server does not promise an automatic rollback.

## Example request

> Update a local post in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

updateMask "summary" with post {"summary": "New text"}). LocalPost fields: languageCode; summary (the post text); topicType (STANDARD | EVENT | OFFER | ALERT); callToAction {actionType: BOOK | ORDER | SHOP | LEARN_MORE | SIGN_UP | CALL, url}; event {title, schedule{startDate{year,month,day}, startTime{hours,minutes}, endDate, endTime}} — required for EVENT and OFFER; offer {couponCode, redeemOnlineUrl, termsConditions}; media [{mediaFormat: "PHOTO", sourceUrl}]. ALERT posts are restricted to Google-initiated campaigns and are typically rejected. Counts against the 10 edits/min per-profile cap. Local posts live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Create a local post](./create-local-post.md) — `create_local_post`
- [Delete a local post](./delete-local-post.md) — `delete_local_post`
- [List local posts](./list-local-posts.md) — `list_local_posts`

## Technical details

- **Impact:** changes data
- **Group:** Local posts
- **Description source:** `update_local_post` registration in `src/tools/posts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
