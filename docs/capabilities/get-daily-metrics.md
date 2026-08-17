# Google Business Profile: Daily metric time series — MCP tool

**Google Business Profile MCP tool:** Returns a daily time series for ONE performance metric of a location: impressions by surface (Maps/Search × desktop/mobile), direction requests, call clicks, website clicks, conversations, bookings, food orders or menu clicks.

Technical name: `get_daily_metrics`

## What task it solves

> I want to daily metric time series.

Returns a daily time series for ONE performance metric of a location: impressions by surface (Maps/Search × desktop/mobile), direction requests, call clicks, website clicks, conversations, bookings, food orders or menu clicks.

## When to use it

Use this capability when you need “Daily metric time series” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id from list_locations (the unobfuscated listing id; locations/123 also works).
- `dailyMetric` — **required**. The metric to fetch.
- `startDate` — **required**. Range start (inclusive), e.g. 2026-07-01.
- `endDate` — **required**. Range end (inclusive), e.g. 2026-07-31.

## What it returns

Returns a daily time series for ONE performance metric of a location: impressions by surface (Maps/Search × desktop/mobile), direction requests, call clicks, website clicks, conversations, bookings, food orders or menu clicks. Response: timeSeries.datedValues[] of {date{year,month,day}, value} — value is int64 serialized as a string; a missing value means no data for that day.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Daily metric time series in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Metrics for the most recent days are not available immediately (multi-day lag, typically a few days) — empty values near today are normal, not an error.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Multiple daily metrics at once](./fetch-multi-daily-metrics.md) — `fetch_multi_daily_metrics`
- [Monthly search keywords](./list-search-keyword-impressions.md) — `list_search_keyword_impressions`

## Technical details

- **Impact:** read-only
- **Group:** Performance
- **Description source:** `get_daily_metrics` registration in `src/tools/performance.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
