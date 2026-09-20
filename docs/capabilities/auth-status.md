# Google Business Profile: Connection status — MCP tool

**Google Business Profile MCP tool:** Reports whether Google Business Profile is connected, where the token comes from, when it expires and which account it belongs to.

Technical name: `auth_status`

## What task it solves

> I want to check whether this server is connected to Google Business Profile and as whom.

Answers the "why does every tool fail" question before anyone starts editing configuration files: token present or not, its source (the `GOOGLE_BUSINESS_*` environment variables or a stored in-chat login), its expiry, the account email and the paths of the stored client and credentials.

## When to use it

Use it when a data tool answers that credentials are missing, before [`logout`](./logout.md) to see what will be deleted, or after switching accounts to confirm which one is live. It makes no network call — the answer comes from local state.

## What to provide

No parameters.

## What it returns

Connection flag, token source, expiry, whether a refresh token is available, the account email when known, the granted scopes and the file paths involved. Neither the token nor the client secret is ever returned.

## What changes in Google Business Profile

Nothing. The tool reads local connection state and does not touch Google Business Profile.

## Example request

> Show the Google Business Profile connection status — are we connected, and as which account?

## Errors and limitations

Local state only: a token revoked in the Google Account still looks valid here until the first real call returns 401. Expiry is absent when Google omitted `expires_in` — the token is then renewed on demand instead of on a clock. Environment credentials always win over a stored login, and the status says which one is in effect.

## Related MCP tools

- [Setup instructions](./setup-instructions.md) — `setup_instructions`
- [Start the login](./start-login.md) — `start_login`
- [Disconnect](./logout.md) — `logout`

## Technical details

- **Impact:** read-only
- **Group:** Connection
- **Source:** `auth_status` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
