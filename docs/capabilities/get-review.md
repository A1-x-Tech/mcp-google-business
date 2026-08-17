# Google Business Profile: Get a review — MCP tool

**Google Business Profile MCP tool:** Returns one review by id — same shape as a list_reviews entry (starRating is an enum ONE..FIVE, reviewReply present only if the business already answered).

Technical name: `get_review`

## What task it solves

> I want to get a review.

Returns one review by id — same shape as a list_reviews entry (starRating is an enum ONE..FIVE, reviewReply present only if the business already answered).

## When to use it

Use this capability when you need “Get a review” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `reviewId` — **required**. Review id (from list_reviews `reviewId` or `name`).

## What it returns

Returns one review by id — same shape as a list_reviews entry (starRating is an enum ONE..FIVE, reviewReply present only if the business already answered).

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Get a review in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Reviews live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Delete a review reply](./delete-review-reply.md) — `delete_review_reply`
- [List reviews](./list-reviews.md) — `list_reviews`
- [Reply to a review](./reply-to-review.md) — `reply_to_review`

## Technical details

- **Impact:** read-only
- **Group:** Reviews
- **Description source:** `get_review` registration in `src/tools/reviews.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
