import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient } from "../client.js";
import { fail, isoDate, isoMonth, ok, READ_ONLY } from "./util.js";

/**
 * The complete DailyMetric vocabulary (Business Profile Performance API).
 * Google's wire enums are self-describing, so they pass through unmapped —
 * responses echo the same values.
 */
export const DAILY_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_DIRECTION_REQUESTS",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_BOOKINGS",
  "BUSINESS_FOOD_ORDERS",
  "BUSINESS_FOOD_MENU_CLICKS",
] as const;

/** FACTORY (see util.ts): a fresh schema per field avoids `$ref` dedup in the JSON schema. */
const dailyMetric = () => z.enum(DAILY_METRICS);

const locationId = () =>
  z
    .string()
    .min(1)
    .describe("Location id from list_locations (the unobfuscated listing id; locations/123 also works).");

const LAG_NOTE =
  "Metrics for the most recent days are not available immediately (multi-day lag, typically a few days) — " +
  "empty values near today are normal, not an error.";

export function registerPerformanceTools(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "get_daily_metrics",
    {
      title: "Daily metric time series",
      annotations: READ_ONLY,
      description:
        "Returns a daily time series for ONE performance metric of a location: impressions by surface " +
        "(Maps/Search × desktop/mobile), direction requests, call clicks, website clicks, conversations, " +
        "bookings, food orders or menu clicks. Response: timeSeries.datedValues[] of {date{year,month,day}, " +
        "value} — value is int64 serialized as a string; a missing value means no data for that day. " +
        LAG_NOTE,
      inputSchema: {
        locationId: locationId(),
        dailyMetric: dailyMetric().describe("The metric to fetch."),
        startDate: isoDate().describe("Range start (inclusive), e.g. 2026-07-01."),
        endDate: isoDate().describe("Range end (inclusive), e.g. 2026-07-31."),
      },
    },
    async ({ locationId, dailyMetric, startDate, endDate }) => {
      try {
        return ok(await client.getDailyMetrics({ locationId, dailyMetric, startDate, endDate }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "fetch_multi_daily_metrics",
    {
      title: "Multiple daily metrics at once",
      annotations: READ_ONLY,
      description:
        "Returns daily time series for SEVERAL performance metrics of a location in one call — same data as " +
        "get_daily_metrics, but batched. Response: multiDailyMetricTimeSeries[].dailyMetricTimeSeries[] of " +
        "{dailyMetric, timeSeries.datedValues[]}; values are int64 strings. Prefer this over several " +
        "get_daily_metrics calls to save quota. " +
        LAG_NOTE,
      inputSchema: {
        locationId: locationId(),
        dailyMetrics: z
          .array(dailyMetric())
          .min(1)
          .describe("The metrics to fetch (one or more)."),
        startDate: isoDate().describe("Range start (inclusive), e.g. 2026-07-01."),
        endDate: isoDate().describe("Range end (inclusive), e.g. 2026-07-31."),
      },
    },
    async ({ locationId, dailyMetrics, startDate, endDate }) => {
      try {
        return ok(await client.fetchMultiDailyMetrics({ locationId, dailyMetrics, startDate, endDate }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "list_search_keyword_impressions",
    {
      title: "Monthly search keywords",
      annotations: READ_ONLY,
      description:
        "Returns the search keywords that surfaced the business on Google, month by month. Response: " +
        "searchKeywordsCounts[] of {searchKeyword, insightsValue} — insightsValue is a UNION: either an exact " +
        "{value} or a {threshold} for low-volume keywords (the true count is below it; never sum thresholds " +
        "as exact counts). Months are calendar months; data for the current month appears with a lag.",
      inputSchema: {
        locationId: locationId(),
        startMonth: isoMonth().describe("First month (inclusive), e.g. 2026-01."),
        endMonth: isoMonth().describe("Last month (inclusive), e.g. 2026-06."),
        pageSize: z.number().int().min(1).max(100).optional().describe("Keywords per page (1..100; default 100)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
      },
    },
    async ({ locationId, startMonth, endMonth, pageSize, pageToken }) => {
      try {
        return ok(
          await client.listSearchKeywordImpressions({ locationId, startMonth, endMonth, pageSize, pageToken }),
        );
      } catch (e) {
        return fail(e);
      }
    },
  );
}
