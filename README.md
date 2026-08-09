# Google Business Profile MCP

[![npm](https://img.shields.io/npm/v/mcp-google-business)](https://www.npmjs.com/package/mcp-google-business)
[![CI](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

MCP server for **Google Business Profile** (formerly Google My Business): manage locations,
answer reviews, publish local posts and read performance metrics — from Claude, Cursor, Codex
and other AI clients, in natural language.

The assistant lists your business locations, replies to fresh reviews, checks how many calls
and direction requests you got last month, and posts updates — everything you would otherwise
click through in the Business Profile Manager.

## Quick start

1. [Get OAuth credentials](#getting-credentials) and make sure your Google Cloud project has
   [approved API access](#api-access-application) — without it every call fails.
2. Add the server — e.g. in Claude Code ([other clients](#installation)):

   ```bash
   claude mcp add google-business \
     -e GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
     -e GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
     -e GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
     -- npx -y mcp-google-business
   ```

3. Ask the assistant: *"List my business locations and show the newest unanswered reviews."*

## What it can do

| Group | Tools |
|---|---|
| **Accounts** | `list_accounts` |
| **Locations** (Business Information API) | `list_locations`, `get_location`, `update_location`, `list_categories`, `list_attribute_metadata`, `update_location_attributes`, `search_chains` |
| **Performance** | `get_daily_metrics`, `fetch_multi_daily_metrics`, `list_search_keyword_impressions` |
| **Reviews** (legacy v4 API) | `list_reviews`, `get_review`, `reply_to_review`, `delete_review_reply` |
| **Local posts** (legacy v4 API) | `list_local_posts`, `create_local_post`, `update_local_post`, `delete_local_post` |
| **Escape hatch** | `raw_request` — any endpoint on any of the four GBP hosts |

Under the hood the server talks to all **four** Google Business Profile hosts behind one OAuth
scope (`business.manage`): Account Management, Business Information and Performance (v1) plus
the legacy v4 API, where reviews and local posts still live — they were never migrated to v1.
Resilience built in: automatic token refresh, retries with backoff on 429/5xx (writes are
never replayed), request timeouts and an SSRF guard.

## Example prompts

- *"Reply to the latest 3-star review of my coffee shop — apologize and offer a discount."*
- *"How many calls and direction requests did location X get in July, day by day?"*
- *"Which search keywords surfaced my business this quarter?"*
- *"Publish a post about our new summer menu with a link to the site."*
- *"Update the website URL of my downtown location."*

## API access application

> ⚠️ **Enabling the APIs in Google Cloud Console is NOT enough.** Business Profile APIs ship
> with a **default quota of 0 QPM** — every call fails (usually `429 RESOURCE_EXHAUSTED`)
> until Google approves your project's **"Application for Basic API Access"**.

To get approved:

1. Prerequisites: you manage a Business Profile that is **verified and active for 60+ days**;
   you apply from an email address that is an **owner or manager** of that profile; the
   business has a website matching your application.
2. Create a Google Cloud project and note its **Project Number** (Console → Dashboard).
3. Submit the [GBP API contact form](https://support.google.com/business/contact/api_default) —
   choose **"Application for Basic API Access"** and fill it in using the authorized
   business email.
4. Check approval in Cloud Console → Quotas: **0 QPM = not approved, 300 QPM = approved**.
   Google also sends a follow-up email (no documented SLA).

The server surfaces this on quota errors: if every call fails with a quota message, the error
text points back at this form.

## Installation

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add google-business \
  -e GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
  -e GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
  -e GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
  -- npx -y mcp-google-business
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

`claude_desktop_config.json` — macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`

```json
{
  "mcpServers": {
    "google-business": {
      "command": "npx",
      "args": ["-y", "mcp-google-business"],
      "env": {
        "GOOGLE_BUSINESS_CLIENT_ID": "your_client_id",
        "GOOGLE_BUSINESS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_BUSINESS_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in the project)

```json
{
  "mcpServers": {
    "google-business": {
      "command": "npx",
      "args": ["-y", "mcp-google-business"],
      "env": {
        "GOOGLE_BUSINESS_CLIENT_ID": "your_client_id",
        "GOOGLE_BUSINESS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_BUSINESS_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` — note the `servers` key (not `mcpServers`)

```json
{
  "servers": {
    "google-business": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-google-business"],
      "env": {
        "GOOGLE_BUSINESS_CLIENT_ID": "your_client_id",
        "GOOGLE_BUSINESS_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_BUSINESS_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

</details>

## Getting credentials

The server uses standard Google OAuth 2.0 with a long-lived **refresh token** (scope
`https://www.googleapis.com/auth/business.manage`):

1. **Create a Google Cloud project** (or reuse one) at
   [console.cloud.google.com](https://console.cloud.google.com/) and **enable** the APIs:
   *My Business Account Management API*, *My Business Business Information API*,
   *Business Profile Performance API* and *Google My Business API* (the legacy v4 — needed
   for reviews and posts).
2. **Apply for API access** — see [API access application](#api-access-application). Without
   approval the quota stays at 0 and every call fails.
3. **Configure the OAuth consent screen** (External is fine; add your Google account as a
   test user while the app is unpublished).
4. **Create an OAuth client id** (Credentials → Create credentials → OAuth client ID, type
   "Web application"; add `https://developers.google.com/oauthplayground` as an authorized
   redirect URI if you plan to use the playground below). Save the **client id** and
   **client secret**.
5. **Mint a refresh token** with the account that owns/manages the Business Profile.
   The quickest way is the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):
   - gear icon → check *"Use your own OAuth credentials"* → paste your client id/secret;
   - in step 1 enter the scope `https://www.googleapis.com/auth/business.manage` and
     authorize with the business owner/manager account;
   - in step 2 press *"Exchange authorization code for tokens"* and copy the
     **refresh token**.
6. Put the three values into `GOOGLE_BUSINESS_CLIENT_ID`, `GOOGLE_BUSINESS_CLIENT_SECRET`
   and `GOOGLE_BUSINESS_REFRESH_TOKEN`.

⚠️ The credentials are stored **in plain text** in your MCP client config — treat them like
passwords. For a quick one-hour test you can instead set `GOOGLE_BUSINESS_ACCESS_TOKEN` to a
token from the playground's step 2 (it expires in ~1 hour and is not refreshed).

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_BUSINESS_CLIENT_ID` | yes¹ | — | OAuth2 client id (Google Cloud Console). |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | yes¹ | — | OAuth2 client secret. |
| `GOOGLE_BUSINESS_REFRESH_TOKEN` | yes¹ | — | OAuth2 refresh token, scope `business.manage`. |
| `GOOGLE_BUSINESS_ACCESS_TOKEN` | no¹ | — | Ready-made access token (~1 h) instead of the trio above. |
| `GOOGLE_BUSINESS_TIMEOUT_MS` | no | `60000` | Per-request timeout, ms. |
| `GOOGLE_BUSINESS_MAX_RETRIES` | no | `3` | Retries on 429 (and 5xx/network for idempotent calls). |
| `GOOGLE_BUSINESS_ACCOUNTS_API_BASE` | no | `https://mybusinessaccountmanagement.googleapis.com` | Account Management host override. |
| `GOOGLE_BUSINESS_INFO_API_BASE` | no | `https://mybusinessbusinessinformation.googleapis.com` | Business Information host override. |
| `GOOGLE_BUSINESS_PERFORMANCE_API_BASE` | no | `https://businessprofileperformance.googleapis.com` | Performance host override. |
| `GOOGLE_BUSINESS_V4_API_BASE` | no | `https://mybusiness.googleapis.com` | Legacy v4 host override (reviews, posts). |

¹ Either the `CLIENT_ID` + `CLIENT_SECRET` + `REFRESH_TOKEN` trio **or** `ACCESS_TOKEN` must be set.

## Requirements

- Node.js 20+ (runs via `npx`, no separate install needed).
- A Google Cloud project with the GBP APIs enabled **and an approved Basic API Access
  application** — see above.

## Limits

- **300 QPM per API** for approved projects; **10 edits per minute per Business Profile**
  (a hard cap Google does not raise) — the write tools note this in their descriptions.
- `accounts.list` pages are capped at 20 items, reviews at 50 — the tools paginate with
  `pageToken`.
- Performance metrics lag by a few days; empty values near today are normal.
- Review replies only work on **verified** locations.

## Documentation

- [All tools](https://github.com/A1-x-Tech/mcp-google-business/blob/main/docs/TOOLS.md) — the full list with descriptions.
- [Development](https://github.com/A1-x-Tech/mcp-google-business/blob/main/docs/DEVELOPMENT.md) — build, tests, smoke check.
- [Publishing](https://github.com/A1-x-Tech/mcp-google-business/blob/main/docs/PUBLISHING.md) — releasing and MCP catalog listings.

## Support

Questions, ideas and contributions — Telegram: [@gistrec](http://t.me/gistrec) or
[GitHub issues](https://github.com/A1-x-Tech/mcp-google-business/issues).

## License

MIT — see [LICENSE](./LICENSE).
