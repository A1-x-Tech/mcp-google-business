# Google Business Profile: Disconnect — MCP tool

**Google Business Profile MCP tool:** Revokes the stored token at Google and deletes the local login; environment credentials are left untouched.

Technical name: `logout`

## What task it solves

> I want to disconnect this server from my Google account.

Removes the locally stored tokens so the server stops acting as that account, and tells Google to drop the grant.

## When to use it

Use it when handing the machine to someone else, when switching Google accounts, or when a secret may have leaked. Check [`auth_status`](./auth-status.md) first to see what is about to be removed.

## What to provide

No parameters.

## What it returns

Whether the token was revoked at Google, whether stored data was removed, and whether environment credentials remain in effect afterwards.

## What changes in Google Business Profile

No Google Business Profile data changes. The stored token is revoked at Google's revoke endpoint and the local credentials are deleted irreversibly. If the revoke call fails, the deletion still happens and the grant can be removed at https://myaccount.google.com/permissions.

## Example request

> Disconnect Google Business Profile and delete the saved credentials.

## Errors and limitations

Marked destructive because deletion cannot be undone — reconnecting means walking through [`start_login`](./start-login.md) and [`finish_login`](./finish-login.md) again. Credentials supplied through `GOOGLE_BUSINESS_*` environment variables keep working: those live in the MCP client's configuration and must be removed there.

## Related MCP tools

- [Connection status](./auth-status.md) — `auth_status`
- [Start the login](./start-login.md) — `start_login`
- [Finish the login](./finish-login.md) — `finish_login`

## Technical details

- **Impact:** destructive operation
- **Group:** Connection
- **Source:** `logout` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
