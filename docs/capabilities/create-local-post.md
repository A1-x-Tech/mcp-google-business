# Google Business Profile: Create a local post — MCP tool

**Google Business Profile MCP tool:** Publishes a new local post on the Business Profile.

Technical name: `create_local_post`

## What task it solves

> I want to create a local post.

Publishes a new local post on the Business Profile.

## When to use it

Use this capability when you need “Create a local post” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `post` — **required**. The LocalPost to create, e.g. {"languageCode": "en", "topicType": "STANDARD", "summary": "Fresh croissants every morning!", "callToAction": {"actionType": "LEARN_MORE", "url": "https://example.com"}}.

## What it returns

Returns the created post with its name and state (a fresh post is usually PROCESSING before it goes LIVE).

## What changes in Google Business Profile

The tool changes real Google Business Profile data as described above. The server does not promise an automatic rollback.

## Example request

> Create a local post in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Pass the LocalPost as `post`. LocalPost fields: languageCode; summary (the post text); topicType (STANDARD | EVENT | OFFER | ALERT); callToAction {actionType: BOOK | ORDER | SHOP | LEARN_MORE | SIGN_UP | CALL, url}; event {title, schedule{startDate{year,month,day}, startTime{hours,minutes}, endDate, endTime}} — required for EVENT and OFFER; offer {couponCode, redeemOnlineUrl, termsConditions}; media [{mediaFormat: "PHOTO", sourceUrl}]. ALERT posts are restricted to Google-initiated campaigns and are typically rejected. Counts against the 10 edits/min per-profile cap. Local posts live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a local post](./delete-local-post.md) — `delete_local_post`
- [List local posts](./list-local-posts.md) — `list_local_posts`
- [Update a local post](./update-local-post.md) — `update_local_post`

## Technical details

- **Impact:** changes data
- **Group:** Local posts
- **Description source:** `create_local_post` registration in `src/tools/posts.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
