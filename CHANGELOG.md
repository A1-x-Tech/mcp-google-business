# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-09-20

### Added

- In-chat Google login via `@a1-x-tech/mcp-google-auth` — 6 new onboarding
  tools: `auth_status`, `setup_instructions`, `set_client`, `start_login`
  (deliberately not read-only), `finish_login`, `logout`. The flow is loopback
  `127.0.0.1` + PKCE against a user-owned Desktop OAuth client; the code is
  exchanged locally and the client secret never passes through the chat. Each
  tool has a capability page under `docs/capabilities/`.
- Tokens from a login are stored per server in
  `~/.config/mcp-google-business/credentials.json` (0600) and re-read on every
  call, so a login finished mid-session works without restarting the AI client.
  `GOOGLE_BUSINESS_OAUTH_PORT` pins the loopback listener port for SSH forwarding.
- `finish_login` verifies a fresh login against **Google Business Profile API** itself rather than
  Google's identity endpoint: OIDC answers even when the API is switched off in
  the Cloud project, which would make a broken setup look connected. A 403 that
  says the API is disabled is translated into the actual fix — enable it in the
  same project as the OAuth client.

### Changed

- The client accepts the component's `TokenProvider` as a fallback token
  source: environment credentials (the refresh triple or `GOOGLE_BUSINESS_ACCESS_TOKEN`)
  keep absolute priority and behave exactly as before; the stored in-chat login
  is used only when the environment carries no credentials. The single 401
  re-mint + replay works for provider-backed tokens too, and is skipped when
  nothing can be re-minted.
- The unconfigured `initialize` instructions lead with the in-chat login
  (`setup_instructions` → `set_client` → `start_login` → `finish_login`, no
  restart needed); setting the environment variables + restart remains the
  documented alternative.

## [1.1.0] — 2026-08-18

### Changed

- **The server no longer exits because of configuration.** Missing credentials are a
  survivable state: the server starts, completes the MCP handshake, serves the full tool list
  and opens the `initialize` instructions with the fix (which variables to set, and that the
  server must be restarted afterwards — credentials are read from the environment only at
  startup). The first tool call then fails with that same actionable message instead of the
  client showing a dead server with no reason. A malformed setup (a partial OAuth trio with
  no access token) still reports `incomplete_oauth_credentials`, but degrades the same way —
  its message is carried into the instructions — instead of killing the process before the
  handshake.

### Added

- Telemetry event `unconfigured_start` (with the same closed reason vocabulary): a server
  without credentials now survives to the MCP handshake, so a degraded start is counted
  separately instead of inflating `server_start` or dying as `startup_failed`.

## [1.0.1] — 2026-08-12

### Added

- Server instructions. The MCP `initialize` response now carries a short briefing for the calling
  model: what this API is and is not, what it cannot do, and the quotas, retry rules and misleading
  failures that should change how it is used. That knowledge previously lived only in the README,
  which a model never reads.

## [1.0.0] — 2026-08-11

### Changed

- Declared stable. The tool surface, input schemas and environment variables of 0.1.x carry over
  unchanged — this release marks API stability, not new behaviour.

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

[Unreleased]: https://github.com/A1-x-Tech/mcp-google-business/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/A1-x-Tech/mcp-google-business/releases/tag/v1.0.1
[1.0.0]: https://github.com/A1-x-Tech/mcp-google-business/releases/tag/v1.0.0
[0.1.0]: https://github.com/A1-x-Tech/mcp-google-business/releases/tag/v0.1.0
