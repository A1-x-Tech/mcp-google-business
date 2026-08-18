# Development

## Requirements

- Node.js 20+ (the published package ships compiled `dist/`; `npx` needs no separate
  install). CI runs the suite on Node 20 and 22.

## Commands

```bash
npm install
npm run dev        # run from source with tsx watch
npm test           # unit tests (node:test) + dist stdio smoke, no network
npm run typecheck  # type-check src + tests (no emit)
npm run build      # clean dist/ and compile with tsc
npm run smoke      # live READ-ONLY call: lists the accessible accounts
```

## Local run

```bash
npm run build
GOOGLE_BUSINESS_CLIENT_ID=... GOOGLE_BUSINESS_CLIENT_SECRET=... \
GOOGLE_BUSINESS_REFRESH_TOKEN=... node dist/index.js
# or a quick one-hour token: GOOGLE_BUSINESS_ACCESS_TOKEN=... node dist/index.js
# optional: GOOGLE_BUSINESS_TIMEOUT_MS, GOOGLE_BUSINESS_MAX_RETRIES,
#           GOOGLE_BUSINESS_{ACCOUNTS,INFO,PERFORMANCE,V4}_API_BASE
```

`npm run smoke` needs the same credentials and makes one live read (`accounts.list`).
Note the API access caveat: a Google Cloud project without an approved "Application for
Basic API Access" has 0 quota and every call fails — see the README.

## Tests

Unit tests mock `globalThis.fetch` (client) or use a fake server + fake client (tools), so
the whole suite runs offline — including the OAuth token refresh, which is asserted against
a mocked `oauth2.googleapis.com`. `test/dist-smoke.test.js` additionally spawns the built
`dist/index.js` and completes a **real MCP handshake over stdio** (lists the tools and makes
a no-network tools/call). Put a `*.test.ts` next to the code it covers;
`npm run typecheck && npm test` is the gate (also run by `prepublishOnly`).

## Usage telemetry

The server sends anonymous events to `usage.gistrec.cloud` (`server_start` when a client
connects to a configured install, `unconfigured_start` when a client connects to a server
without credentials, `tool_call` with the tool **name**, and `startup_failed` with a
fixed-vocabulary reason code when the configuration is malformed) to count active installs
and tool demand. An event contains only impersonal technical fields: a random install id
(`~/.config/mcp-google-business/instance-id`), the package version, the AI client's name and
version from the MCP handshake, the Node.js version and the OS.

Credentials, account data, tool arguments and prompts are never sent or stored
(implementation: `src/telemetry.ts`). Sends run in the background with a 2 s timeout and are
silently skipped on any error. Disable for all Ask Ads MCP servers at once:
`ASKADS_TELEMETRY=0`.
