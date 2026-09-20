# Google Business Profile: Start the login — MCP tool

**Google Business Profile MCP tool:** Opens a loopback + PKCE login and returns the Google consent URL for the user to approve in their browser.

Technical name: `start_login`

## What task it solves

> I want to connect my Google account to Google Business Profile from inside this conversation.

Starts the browser half of the login: it listens on `127.0.0.1`, builds the Google consent URL with PKCE and the scopes this server needs, and hands that URL back so the user can approve it. The authorization code returns to the local listener and never travels through the chat.

## When to use it

Use it once an OAuth client exists — from the environment or from [`set_client`](./set-client.md). After the user approves, call [`finish_login`](./finish-login.md) to complete the exchange.

## What to provide

No parameters.

## What it returns

The authorization URL to show the user as a clickable link, plus the pending-login lifetime — ten minutes. The tool does not open a browser itself: the user must open the link **on this machine**, pick the Google account and approve.

## What changes in Google Business Profile

Nothing yet — consent is granted in the browser, and the token appears only at [`finish_login`](./finish-login.md). Locally a short-lived pending login is held in memory.

## Example request

> Connect my Google account to Google Business Profile — give me the link to approve.

## Errors and limitations

Deliberately not marked read-only: it opens a local listener, holds pending state and initiates an OAuth flow — a read-only hint would let a client run it without confirmation, so a prompt injection could start a login silently. The attempt expires after ten minutes — start again if the user takes longer. A blocked or busy loopback port breaks the redirect; pin one with `GOOGLE_BUSINESS_OAUTH_PORT` when the client runs over SSH forwarding. Without an OAuth client the call fails actionably, naming `set_client` and the environment variables.

## Related MCP tools

- [Finish the login](./finish-login.md) — `finish_login`
- [Save the OAuth client](./set-client.md) — `set_client`
- [Setup instructions](./setup-instructions.md) — `setup_instructions`

## Technical details

- **Impact:** changes data
- **Group:** Connection
- **Source:** `start_login` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
