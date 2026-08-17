# Google Business Profile: Delete a review reply — MCP tool

**Google Business Profile MCP tool:** Deletes the business's reply to a review (the review itself is the customer's and cannot be deleted).

Technical name: `delete_review_reply`

## What task it solves

> I want to delete a review reply.

Deletes the business's reply to a review (the review itself is the customer's and cannot be deleted).

## When to use it

Use this capability when you need “Delete a review reply” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `accountId` — **required**. Account id — bare "123" or "accounts/123".
- `locationId` — **required**. Location id — bare "456", "locations/456" or "accounts/1/locations/456".
- `reviewId` — **required**. Review id (from list_reviews `reviewId` or `name`).

## What it returns

Returns compact JSON from the upstream API or a clear MCP tool error. The exact fields depend on the operation and are documented in the technical reference.

## What changes in Google Business Profile

The source marks the entire “Delete a review reply” call as destructive. The exact effect depends on the selected action and is described below; review the parameters and reversibility before calling it.

## Example request

> Delete a review reply in Google Business Profile. Ask for any required identifiers that are missing. Show me the exact change and wait for confirmation first.

## Errors and limitations

Empty response on success. Reviews live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Get a review](./get-review.md) — `get_review`
- [List reviews](./list-reviews.md) — `list_reviews`
- [Reply to a review](./reply-to-review.md) — `reply_to_review`

## Technical details

- **Impact:** destructive operation
- **Group:** Reviews
- **Description source:** `delete_review_reply` registration in `src/tools/reviews.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
