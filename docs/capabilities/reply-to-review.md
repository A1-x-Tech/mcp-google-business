# Google Business Profile: Reply to a review — MCP tool

**Google Business Profile MCP tool:** Creates OR replaces the business's public reply to a review (PUT upsert — there is no separate create, and calling it again overwrites the previous reply).

Technical name: `reply_to_review`

## What task it solves

> I want to reply to a review.

Creates OR replaces the business's public reply to a review (PUT upsert — there is no separate create, and calling it again overwrites the previous reply).

## When to use it

Use this capability when you need “Reply to a review” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `reviewId` — **required**. Review id (from list_reviews `reviewId` or `name`).
- `comment` — **required**. The public reply text (plain text; keep it concise — very long replies may be rejected).

## What it returns

Returns the ReviewReply {comment, updateTime}.

## What changes in Google Business Profile

The tool changes real Google Business Profile data as described above. The server does not promise an automatic rollback.

## Example request

> Reply to a review in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Only works on verified locations. Counts against the 10 edits/min per-profile cap. Reviews live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a review reply](./delete-review-reply.md) — `delete_review_reply`
- [Get a review](./get-review.md) — `get_review`
- [List reviews](./list-reviews.md) — `list_reviews`

## Technical details

- **Impact:** changes data
- **Group:** Reviews
- **Description source:** `reply_to_review` registration in `src/tools/reviews.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
