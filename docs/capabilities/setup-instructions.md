# Google Business Profile: Setup instructions — MCP tool

**Google Business Profile MCP tool:** Returns the step-by-step text for creating a Google Cloud OAuth client and enabling Google Business Profile API, ready to show the user verbatim.

Technical name: `setup_instructions`

## What task it solves

> I want to know exactly what to click in Google Cloud before connecting.

Hands the calling model the wizard text instead of letting it improvise: create or pick a Cloud project, enable **Google Business Profile API**, configure the consent screen, create a **Desktop app** OAuth client and download its JSON — whose path then goes to [`set_client`](./set-client.md), so the secret never passes through the conversation.

## When to use it

Use it as the first step when nobody has an OAuth client yet, or whenever [`start_login`](./start-login.md) reports that no client is configured. It works with no credentials at all and makes no network call.

## What to provide

No parameters.

## What it returns

The ordered setup steps, the Google Cloud console links, the exact OAuth scopes this server asks for, and the note that the downloaded JSON path goes to [`set_client`](./set-client.md) next.

## What changes in Google Business Profile

Nothing — the tool only produces text. The Cloud project changes when the user follows the steps in their browser.

## Example request

> Walk me through setting up Google Business Profile access — what do I create in Google Cloud?

## Errors and limitations

The steps cannot be automated: creating a project, enabling the API and configuring the consent screen happen in Google's console under the user's own account. A consent screen left in Testing mode expires refresh tokens after seven days — publish the app or use an Internal Workspace app for long-lived access. Google Business Profile API must be enabled in the **same** project as the OAuth client, otherwise the first call fails with a 403 that looks like a permission problem.

## Related MCP tools

- [Save the OAuth client](./set-client.md) — `set_client`
- [Start the login](./start-login.md) — `start_login`
- [Connection status](./auth-status.md) — `auth_status`

## Technical details

- **Impact:** read-only
- **Group:** Connection
- **Source:** `setup_instructions` registered by `@a1-x-tech/mcp-google-auth` via `src/tools/auth.ts`
- [Full technical reference](../TOOLS.md)
- [All MCP capabilities](./index.md)
