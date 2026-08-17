# Google Business Profile MCP capabilities

This catalog contains 20 public pages—one for every registered MCP tool in `mcp-google-business`. Each page starts with the user's task, explains the result, and states whether the call changes real data.

Use this catalog to choose a ready-made capability. Full parameter schemas and API response details remain in the [technical reference](../TOOLS.md).

## Local posts

- [Create a local post](./create-local-post.md) — Publishes a new local post on the Business Profile. **Impact:** changes data.
- [Delete a local post](./delete-local-post.md) — Deletes a local post from the Business Profile. **Impact:** destructive operation.
- [List local posts](./list-local-posts.md) — Lists the local posts (What's New / Event / Offer updates shown on the Business Profile) of a location. **Impact:** read-only.
- [Update a local post](./update-local-post.md) — Updates fields of an existing local post (PATCH with a required updateMask — only masked fields change, e.g. **Impact:** changes data.

## Reviews

- [Delete a review reply](./delete-review-reply.md) — Deletes the business's reply to a review (the review itself is the customer's and cannot be deleted). **Impact:** destructive operation.
- [Get a review](./get-review.md) — Returns one review by id — same shape as a list_reviews entry (starRating is an enum ONE..FIVE, reviewReply present only if the business already answered). **Impact:** read-only.
- [List reviews](./list-reviews.md) — Lists reviews of a location, newest-updated first by default. **Impact:** read-only.
- [Reply to a review](./reply-to-review.md) — Creates OR replaces the business's public reply to a review (PUT upsert — there is no separate create, and calling it again overwrites the previous reply). **Impact:** changes data.

## Performance

- [Multiple daily metrics at once](./fetch-multi-daily-metrics.md) — Returns daily time series for SEVERAL performance metrics of a location in one call — same data as get_daily_metrics, but batched. **Impact:** read-only.
- [Daily metric time series](./get-daily-metrics.md) — Returns a daily time series for ONE performance metric of a location: impressions by surface (Maps/Search × desktop/mobile), direction requests, call clicks, website clicks, conversations, bookings, food orders or menu clicks. **Impact:** read-only.
- [Monthly search keywords](./list-search-keyword-impressions.md) — Returns the search keywords that surfaced the business on Google, month by month. **Impact:** read-only.

## Locations

- [Get a location](./get-location.md) — Returns one location by id (Business Information API; v1 uses the bare locations/{id} name, no account prefix). **Impact:** read-only.
- [List available attributes](./list-attribute-metadata.md) — Lists which attributes (e.g. **Impact:** read-only.
- [Search business categories](./list-categories.md) — Lists/searches the reference taxonomy of business categories (e.g. **Impact:** read-only.
- [List locations of an account](./list-locations.md) — Lists the business locations under an account (Business Information API). **Impact:** read-only.
- [Search chains](./search-chains.md) — Searches business chains by name (exact/partial/fuzzy), ranked by relevance. **Impact:** read-only.
- [Update a location](./update-location.md) — Updates fields of a location (PATCH with a required updateMask — only masked fields change). **Impact:** changes data.
- [Update location attributes](./update-location-attributes.md) — Updates attributes of a location (PATCH). **Impact:** changes data.

## Accounts

- [List Business Profile accounts](./list-accounts.md) — Lists all Google Business Profile accounts the authenticated user can access (the personal account first). **Impact:** read-only.

## Additional API methods

- [Raw Google Business Profile API call](./raw-request.md) — Escape hatch to call any Google Business Profile endpoint directly, for endpoints without a dedicated tool. **Impact:** destructive operation.

## For maintainers and publishers

- [MCP capability documentation contract](../CAPABILITY-DOCUMENTATION.md)
- [Technical tool reference](../TOOLS.md)
- [GitHub repository](https://github.com/A1-x-Tech/mcp-google-business)
