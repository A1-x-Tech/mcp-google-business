# Google Business Profile: Monthly search keywords — MCP tool

**Google Business Profile MCP tool:** Returns the search keywords that surfaced the business on Google, month by month.

Technical name: `list_search_keyword_impressions`

## What task it solves

> I want to monthly search keywords.

Returns the search keywords that surfaced the business on Google, month by month.

## When to use it

Use this capability when you need “Monthly search keywords” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id from list_locations (the unobfuscated listing id; locations/123 also works).
- `startMonth` — **required**. First month (inclusive), e.g. 2026-01.
- `endMonth` — **required**. Last month (inclusive), e.g. 2026-06.
- `pageSize` — **optional**. Keywords per page (1..100; default 100).
- `pageToken` — **optional**. nextPageToken from the previous page.

## What it returns

Returns the search keywords that surfaced the business on Google, month by month. Response: searchKeywordsCounts[] of {searchKeyword, insightsValue} — insightsValue is a UNION: either an exact {value} or a {threshold} for low-volume keywords (the true count is below it; never sum thresholds as exact counts).

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Monthly search keywords in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Months are calendar months; data for the current month appears with a lag.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Multiple daily metrics at once](./fetch-multi-daily-metrics.md) — `fetch_multi_daily_metrics`
- [Daily metric time series](./get-daily-metrics.md) — `get_daily_metrics`

## Technical details

- **Impact:** read-only
- **Group:** Performance
- **Description source:** `list_search_keyword_impressions` registration in `src/tools/performance.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
