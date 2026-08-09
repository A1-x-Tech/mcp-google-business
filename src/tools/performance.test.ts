import { test } from "node:test";
import assert from "node:assert/strict";
import { DAILY_METRICS, registerPerformanceTools } from "./performance.js";
import { harness } from "./harness.test-util.js";

test("registers the three performance tools", () => {
  const { tools } = harness(registerPerformanceTools);
  assert.deepEqual(Object.keys(tools).sort(), [
    "fetch_multi_daily_metrics",
    "get_daily_metrics",
    "list_search_keyword_impressions",
  ]);
});

test("the DailyMetric vocabulary is the complete verified 11-value set", () => {
  assert.deepEqual(
    [...DAILY_METRICS].sort(),
    [
      "BUSINESS_BOOKINGS",
      "BUSINESS_CONVERSATIONS",
      "BUSINESS_DIRECTION_REQUESTS",
      "BUSINESS_FOOD_MENU_CLICKS",
      "BUSINESS_FOOD_ORDERS",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "CALL_CLICKS",
      "WEBSITE_CLICKS",
    ],
  );
});

test("get_daily_metrics forwards the metric and date range", async () => {
  const { calls, tools } = harness(registerPerformanceTools);
  await tools.get_daily_metrics({
    locationId: "5",
    dailyMetric: "CALL_CLICKS",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
  assert.equal(calls[0].method, "getDailyMetrics");
  assert.deepEqual(calls[0].params, {
    locationId: "5",
    dailyMetric: "CALL_CLICKS",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
});

test("fetch_multi_daily_metrics forwards the metric list", async () => {
  const { calls, tools } = harness(registerPerformanceTools);
  await tools.fetch_multi_daily_metrics({
    locationId: "5",
    dailyMetrics: ["WEBSITE_CLICKS", "CALL_CLICKS"],
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
  assert.equal(calls[0].method, "fetchMultiDailyMetrics");
  assert.deepEqual(calls[0].params, {
    locationId: "5",
    dailyMetrics: ["WEBSITE_CLICKS", "CALL_CLICKS"],
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
});

test("list_search_keyword_impressions forwards the month range and paging", async () => {
  const { calls, tools } = harness(registerPerformanceTools);
  await tools.list_search_keyword_impressions({
    locationId: "5",
    startMonth: "2026-01",
    endMonth: "2026-06",
    pageSize: 50,
    pageToken: "t",
  });
  assert.equal(calls[0].method, "listSearchKeywordImpressions");
  assert.deepEqual(calls[0].params, {
    locationId: "5",
    startMonth: "2026-01",
    endMonth: "2026-06",
    pageSize: 50,
    pageToken: "t",
  });
});

test("a client error is returned as an isError result, not thrown", async () => {
  const { tools } = harness(registerPerformanceTools, { throwOn: "getDailyMetrics" });
  const res = await tools.get_daily_metrics({
    locationId: "5",
    dailyMetric: "CALL_CLICKS",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /boom/);
});
