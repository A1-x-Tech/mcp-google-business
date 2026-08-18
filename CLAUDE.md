# CLAUDE.md — mcp-google-business

MCP server for Google Business Profile (TypeScript, stdio). Read/write: tools wrap
accounts, locations (Business Information), performance metrics, reviews and local
posts; `raw_request` is the escape hatch. GBP is served by **four hosts under one
OAuth scope** (`https://www.googleapis.com/auth/business.manage`):
Account Management, Business Information and Performance (v1) plus the **legacy v4**
`mybusiness.googleapis.com` — reviews and local posts were never migrated to v1 and
only exist there. Auth is an OAuth2 refresh flow (client id + secret + refresh
token → Bearer), or a static access token for quick tests.

## Commands

```bash
npm run dev        # run from source (tsx watch)
npm test           # unit tests + dist stdio smoke, no network
npm run typecheck  # types for src + tests
npm run build      # emit dist/
npm run smoke      # live READ-ONLY call (needs real credentials)
```

## Architecture

- `src/config.ts` — env → config. Accepts either the OAuth trio
  (`GOOGLE_BUSINESS_CLIENT_ID`/`_CLIENT_SECRET`/`_REFRESH_TOKEN`; a partial trio without an
  access token throws `ConfigError` `incomplete_oauth_credentials`) or
  `GOOGLE_BUSINESS_ACCESS_TOKEN`; optional timeout/retries and four per-service base
  overrides. `DEFAULT_BASES` (the host map) lives here. No credentials at all is NOT an
  error: the fields stay `undefined` and the server starts degraded. Also home to
  `CredentialsError` / `MISSING_CREDENTIALS_MESSAGE` (opens with the historical startup error
  verbatim, then names the variables and the restart) and `hasCredentials()`.
- `src/client.ts` — ALL HTTP: the `ApiService → host` routing
  (`accounts`/`businessinfo`/`performance`/`v4`), the OAuth2 token refresh with caching and
  in-flight dedupe, resource-name building (`bareAccountId`/`bareLocationId` accept bare ids
  and full names), the default `readMask` injection, flattened
  `dailyRange.*`/`monthlyRange.*` query params, retries (429/quota-403 always; 5xx/network only
  for non-POST), the AbortController timeout that also covers reading the body, the SSRF origin
  guard and `GoogleBusinessError(status, body)` with the quota-0 hint.
- `src/tools/*.ts` — one module per API group: `accounts` (1 tool), `locations` (7),
  `performance` (3), `reviews` (4), `posts` (4), `raw` (1) = 20 tools. `src/tools/util.ts` —
  `ok`/`fail`, the five annotation constants (`READ_ONLY`/`WRITE`/`CREATE`/`DESTRUCTIVE`/`RAW`)
  and the `isoDate`/`isoMonth` schema factories.
- `src/index.ts` — wires every `register*` into the McpServer. `loadConfigOrDegraded()`
  catches `ConfigError`, pings `startup_failed` (fire-and-forget) and degrades the config to
  "no credentials"; an unconfigured start prepends `UNCONFIGURED_PREFIX` — plus
  `Configuration problem: <message>` when a ConfigError was caught — to the initialize
  `instructions`, and `oninitialized` sends `server_start` for a configured install or
  `unconfigured_start` (with the reason) otherwise.
- `src/telemetry.ts` — anonymous usage pings (ids/names/versions only, never data or
  arguments; fire-and-forget, must never block or throw; opt-out `ASKADS_TELEMETRY=0`).
  `server_start` means "a usable install started"; `unconfigured_start` is a degraded start
  and `startup_failed` a malformed config caught at load — both carry a `reason` from a
  closed vocabulary (`missing_credentials`, `incomplete_oauth_credentials`) — never a
  variable's name or value.

## Conventions (do not break)

- **Never exit because of configuration.** A server that dies before the MCP handshake leaves
  the user with a red cross and no reason — telemetry across this line of servers showed that
  state accounted for nearly every unconfigured install, and almost none of them recovered.
  Missing credentials are a survivable state: start, answer initialize (with the unconfigured
  prefix in `instructions`) and tools/list, and let the first tool call fail with
  `CredentialsError` — its message names the variables to set and says to restart, because
  credentials come only from the environment. `config.test.ts`, `client.test.ts` and
  `test/dist-smoke.test.js` pin this.
- **Credential failures are not transport failures.** `CredentialsError` is thrown in
  `getAccessToken()` before the token mint, the retry/backoff loop and the fetch — retrying
  it burns seconds of backoff before the user sees the one message that helps. Pinned by a
  "fetch must not be called" assertion in `client.test.ts`.
- **Write API discipline.** Every tool carries one of the pinned annotation constants;
  `annotations.test.ts` pins the full tool → hints map. 5xx/network retries are gated to
  idempotent methods (everything except POST) — a replayed POST duplicates the resource.
- **Host routing lives in the client.** Tools never know hosts or full URLs; they call a
  typed client method, and `request(service, method, path, ...)` picks the host from the
  service map. Reviews/posts are v4-only — never route them to `businessinfo`.
- **readMask is the client's job.** `locations.get`/`locations.list` 400 without a readMask,
  so the client injects `DEFAULT_READ_MASK` when the tool passes none.
- **Ids are normalized in the client.** Tools accept bare ids OR resource names
  (`123`, `locations/123`, `accounts/1/locations/123`); `bare*Id` extracts the id and the
  client builds the scheme each endpoint wants (v1 bare `locations/{id}` vs v4
  `accounts/*/locations/*`).
- **Google enums pass through unmapped** (deliberate deviation from the wire-mapping pattern
  of sibling servers): `BUSINESS_IMPRESSIONS_*`, `STANDARD|EVENT|OFFER|ALERT`, `BASIC|FULL`
  etc. appear verbatim in requests AND responses, so a normalized vocabulary would only
  create asymmetry. Constrain them with `z.enum` in the tools.
- **Validate inputs with zod** in `inputSchema`; use the schema **factories** (`isoDate()`,
  per-module `accountId()`/`locationId()`) — a fresh schema per field avoids `$ref` dedup in
  the JSON schema.
- **Output compact JSON via `ok`** — the consumer is an LLM; pretty-printing burns tokens.
  Responses pass through verbatim (describe the fields in the tool `description`, the only
  place the external model reads).
- **Metric values are int64 strings.** Performance `value`s arrive as JSON strings; and
  searchkeywords `insightsValue` is a value-OR-threshold union — never sum thresholds.
- **Quota errors get the access-form hint.** Unapproved projects have 0 QPM; keep the
  "Application for Basic API Access" pointer in `GoogleBusinessError`.

## Adding a tool

Before changing the tool registry, read [the MCP capability documentation contract](docs/CAPABILITY-DOCUMENTATION.md). Every registered tool must have exactly one task-oriented page in `docs/capabilities/`; update that page, the index, and the coverage test in the same change.

1. Add (or extend) `src/tools/<group>.ts` with `register<Group>Tools(server, client)`.
2. If it hits a new endpoint, add a typed method to `src/client.ts` (pick the right
   `ApiService`; add masks/range flattening there, not in the tool).
3. Import and call the register fn in `src/index.ts`.
4. Add tests: the fake-client harness for the tool, mock-fetch for the client method, the
   expected annotations in `annotations.test.ts` and the name in `test/dist-smoke.test.js`.
5. `npm run typecheck && npm test`.

## Releasing

Keep the version in sync across **all** channels in one go (`git push --follow-tags` pushes
the tag but does **not** create a GitHub Release; the registry is immutable per version):

1. Bump `version` in **three places, identically**: `package.json`, and in `server.json`
   **both** the root `version` **and** `packages[0].version`. `mcpName` in `package.json`
   must match `name` in `server.json` (`io.github.A1-x-Tech/mcp-google-business`). Verify:
   `grep -n '"version"' package.json server.json`.
   > ⚠️ `mcp-publisher` publishes the **root** `server.json.version`. A stale root makes
   > `mcp-publisher publish` fail with a misleading `400 cannot publish duplicate version`
   > even though `npm publish` succeeded.
2. `npm publish` (runs typecheck + tests + build via `prepublishOnly` / `prepare`).
3. `git commit`, `git tag -a vX.Y.Z -m vX.Y.Z`, `git push origin main --follow-tags`.
4. **GitHub Release:** `gh release create vX.Y.Z --title vX.Y.Z --generate-notes --verify-tag`.
5. **Official MCP registry:** `mcp-publisher logout && mcp-publisher login github --token
   "$(gh auth token)" && mcp-publisher publish` (token login — device-flow does not see the
   organization).
