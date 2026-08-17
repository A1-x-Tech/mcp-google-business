# Google Business Profile: List reviews — MCP tool

**Google Business Profile MCP tool:** Lists reviews of a location, newest-updated first by default.

Technical name: `list_reviews`

## What task it solves

> I want to list reviews.

Lists reviews of a location, newest-updated first by default.

## When to use it

Use this capability when you need “List reviews” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `pageSize` — **optional**. Reviews per page (1..50 — API cap; default 50).
- `pageToken` — **optional**. nextPageToken from the previous page.
- `orderBy` — **optional**. Sort order; default "updateTime desc".

## What it returns

Response: reviews[] of {name, reviewId, reviewer{displayName, isAnonymous}, starRating (ONE..FIVE enum, not a number), comment, createTime, updateTime, reviewReply{comment, updateTime} if answered}, plus averageRating (1–5) and totalReviewCount.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> List reviews in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

pageSize caps at 50. Reviews live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a review reply](./delete-review-reply.md) — `delete_review_reply`
- [Get a review](./get-review.md) — `get_review`
- [Reply to a review](./reply-to-review.md) — `reply_to_review`

## Technical details

- **Impact:** read-only
- **Group:** Reviews
- **Description source:** `list_reviews` registration in `src/tools/reviews.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
