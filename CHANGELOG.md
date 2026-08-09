# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] — 2026-08-09

### Added
- First working release: MCP server (stdio) for Google Business Profile with 20 tools
  across the four GBP API hosts (one OAuth scope, `business.manage`):
  - **Account Management (v1)** — `list_accounts`;
  - **Business Information (v1)** — `list_locations`, `get_location`, `update_location`,
    `list_categories`, `list_attribute_metadata`, `update_location_attributes`,
    `search_chains`; a default `readMask` is injected on reads (the API 400s without one);
  - **Performance (v1)** — `get_daily_metrics`, `fetch_multi_daily_metrics` (full
    verified 11-value DailyMetric vocabulary), `list_search_keyword_impressions`
    (`insightsValue` is a value-or-threshold union);
  - **Reviews (legacy v4)** — `list_reviews`, `get_review`, `reply_to_review`
    (PUT upsert), `delete_review_reply`;
  - **Local Posts (legacy v4)** — `list_local_posts`, `create_local_post`,
    `update_local_post`, `delete_local_post`;
  - `raw_request` escape hatch with an explicit `service` host selector.
- OAuth2 auth: refresh flow (`GOOGLE_BUSINESS_CLIENT_ID` / `_CLIENT_SECRET` /
  `_REFRESH_TOKEN`) with in-process token caching and in-flight dedupe, or a static
  `GOOGLE_BUSINESS_ACCESS_TOKEN` for quick tests.
- Resilience: retries with backoff (429 always; 5xx/network only on idempotent
  methods — a POST is never replayed), request timeout covering the body read,
  SSRF guard on `raw_request` paths, and a quota-0 diagnostic pointing at the
  "Application for Basic API Access" form on quota errors.
- Anonymous usage telemetry (`server_start`, `tool_call`, `startup_failed`; names and
  versions only, never data or arguments). Opt out with `ASKADS_TELEMETRY=0`.
- Test suite: offline unit tests for every tool and client method (mocked `fetch`)
  plus a dist smoke test doing a real MCP handshake with the built binary over stdio.
- CI (Node 20/22) and a daily read-only health check (skips when secrets are absent).

[Unreleased]: https://github.com/A1-x-Tech/mcp-google-business/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/A1-x-Tech/mcp-google-business/releases/tag/v0.1.0
