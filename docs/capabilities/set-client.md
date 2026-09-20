# Google Business Profile: Save the OAuth client — MCP tool

**Google Business Profile MCP tool:** Reads the OAuth client JSON downloaded from Google Cloud Console and stores it for every mcp-google-* server to reuse.

Technical name: `set_client`

## What task it solves

> I want to register my Google OAuth client once, without pasting the secret into a chat.

Takes the **path** to the `client_secret_*.json` file that "Download JSON" produces on a Desktop-app client and stores it in the shared, owner-only `~/.config/mcp-google-auth/client.json`. The secret never travels through the conversation, and every other `mcp-google-*` server picks the same client up — tokens stay per server.

## When to use it

Use it right after the user creates a Desktop OAuth client with the steps from [`setup_instructions`](./setup-instructions.md), or when switching to a different Cloud project. Not needed when `GOOGLE_BUSINESS_CLIENT_ID` and `GOOGLE_BUSINESS_CLIENT_SECRET` are already set in the environment — those win.

## What to provide

- `path` — **required**. Absolute path to the `client_secret_*.json` file downloaded from Google Cloud Console.

## What it returns

Confirmation with the stored client id and the file it was written to. The secret is never returned.

## What changes in Google Business Profile

Nothing in Google Business Profile. Locally, the shared client file is created or overwritten with owner-only permissions.

## Example request

> I downloaded the OAuth client JSON to ~/Downloads/client_secret_123.json — register it.

## Errors and limitations

The file must exist and be readable, and it must be a Desktop-app client: a Web-application client cannot complete the loopback redirect. The credentials are not verified here — a wrong or mismatched pair only surfaces during [`finish_login`](./finish-login.md) as `invalid_client`. The secret is stored in plain text in an owner-only file because Google requires it on every token refresh.

## Related MCP tools

- [Setup instructions](./setup-instructions.md) — `setup_instructions`
- [Start the login](./start-login.md) — `start_login`
- [Connection status](./auth-status.md) — `auth_status`

## Technical details

- **Impact:** changes data
- **Group:** Connection
- **Source:** `set_client` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
