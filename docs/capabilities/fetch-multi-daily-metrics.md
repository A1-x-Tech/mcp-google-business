# Google Business Profile: Multiple daily metrics at once — MCP tool

**Google Business Profile MCP tool:** Returns daily time series for SEVERAL performance metrics of a location in one call — same data as get_daily_metrics, but batched.

Technical name: `fetch_multi_daily_metrics`

## What task it solves

> I want to multiple daily metrics at once.

Returns daily time series for SEVERAL performance metrics of a location in one call — same data as get_daily_metrics, but batched.

## When to use it

Use this capability when you need “Multiple daily metrics at once” without doing the same work manually in the Google Business Profile interface. It runs only when an AI client calls it.

## What to provide

- `locationId` — **required**. Location id from list_locations (the unobfuscated listing id; locations/123 also works).
- `dailyMetrics` — **required**. The metrics to fetch (one or more).
- `startDate` — **required**. Range start (inclusive), e.g. 2026-07-01.
- `endDate` — **required**. Range end (inclusive), e.g. 2026-07-31.

## What it returns

Returns daily time series for SEVERAL performance metrics of a location in one call — same data as get_daily_metrics, but batched. Response: multiDailyMetricTimeSeries[].dailyMetricTimeSeries[] of {dailyMetric, timeSeries.datedValues[]}; values are int64 strings.

## What changes in Google Business Profile

The tool reads Google Business Profile data and does not change it.

## Example request

> Multiple daily metrics at once in Google Business Profile. Ask for any required identifiers that are missing.

## Errors and limitations

Prefer this over several get_daily_metrics calls to save quota. Metrics for the most recent days are not available immediately (multi-day lag, typically a few days) — empty values near today are normal, not an error.

Access also depends on token permissions, quotas, and upstream API limits.

## Related MCP tools

- [Daily metric time series](./get-daily-metrics.md) — `get_daily_metrics`
- [Monthly search keywords](./list-search-keyword-impressions.md) — `list_search_keyword_impressions`

## Technical details

- **Impact:** read-only
- **Group:** Performance
- **Description source:** `fetch_multi_daily_metrics` registration in `src/tools/performance.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
