# Google Business Profile: Finish the login — MCP tool

**Google Business Profile MCP tool:** Exchanges the approved consent for tokens, stores them owner-only and verifies that the connection really works.

Technical name: `finish_login`

## What task it solves

> I want to finish connecting Google Business Profile now that I approved the Google consent screen.

Completes the flow started by [`start_login`](./start-login.md): takes the code delivered to the loopback listener, exchanges it for an access and refresh token, writes them to `~/.config/mcp-google-business/credentials.json` with `0600`, and then verifies them before reporting success.

## When to use it

Use it immediately after the user approves the consent screen, while the pending login is still alive. Once it succeeds, every Google Business Profile tool works in the same session — no restart of the AI client is needed.

## What to provide

No parameters in the normal flow: the code arrives at the local listener. Servers behind manual redirects may pass the code explicitly.

## What it returns

The connected account email, token expiry, whether automatic renewal is available and the stored file path. If the verification call fails, the login is still saved and the reason is reported instead of a false "all good".

## What changes in Google Business Profile

No Google Business Profile data changes. A new OAuth grant appears in the user's Google Account, and the credentials file is created locally.

## Example request

> I clicked Allow — finish the Google Business Profile login.

## Errors and limitations

`invalid_client` means the client id and secret do not belong to the same OAuth client. `invalid_grant` means the pending login expired — start again. A 403 whose body says the API is disabled is translated into the real fix: enable Google Business Profile API in the **same** Cloud project as the OAuth client. Verification goes against Google Business Profile API on purpose — Google's identity endpoint answers even when the product API is switched off, which would make a broken setup look connected.

## Related MCP tools

- [Start the login](./start-login.md) — `start_login`
- [Connection status](./auth-status.md) — `auth_status`
- [Disconnect](./logout.md) — `logout`

## Technical details

- **Impact:** changes data
- **Group:** Connection
- **Source:** `finish_login` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
