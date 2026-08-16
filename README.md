# <img src="./assets/a1-logo.svg" alt="A1" width="40"> Google Business Profile MCP

**English** | [Русский](./README.ru.md)

[![npm](https://img.shields.io/npm/v/mcp-google-business)](https://www.npmjs.com/package/mcp-google-business)
[![CI](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml/badge.svg)](https://github.com/A1-x-Tech/mcp-google-business/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business/badges/score.svg)](https://glama.ai/mcp/servers/A1-x-Tech/mcp-google-business)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**A1 Google Business Profile MCP** lets an AI app work with your Google Business Profile locations in natural language. Inspect locations and performance, respond to reviews, prepare local posts and update profile information deliberately.

It connects to Google’s current Business Profile APIs and the legacy API where reviews and posts still live. A Google account and OAuth credentials alone are not enough: Google must approve Basic API Access for the Cloud project.

- **20 tools.** Location and account data, performance, reviews, local posts, categories and attributes.
- **Real approval gate.** Projects start at 0 QPM; every API call fails until Google approves the Basic API Access application.
- **Separate release boundary.** A prepared reply, post or location update changes public business information only after the client confirms the write operation.
- **Four API surfaces.** Account Management, Business Information, Performance and legacy v4 work through one `business.manage` OAuth scope.

Start with a read-only question:

> List my locations and show the newest reviews that do not have a reply.

[Connect the server](#quick-start) · [Explore use cases](#what-you-can-ask-it-to-do) · [Open technical documentation](#technical-documentation)

---

## See it work in a minute

> **You:** List my locations and show the newest reviews that do not have a reply.
>
> **Assistant:** Shows the locations and recent reviews. Nothing changes.
>
> **You:** Draft a reply to the newest three-star review at the downtown location. Apologize and offer to help.
>
> **Assistant:** Shows the location, review and proposed reply, then asks for confirmation before publishing it.
>
> **You:** Confirm.
>
> **Assistant:** Publishes the reply. It does not alter the review, other locations or posts.

## Contents

- [Quick start](#quick-start)
- [What you can ask it to do](#what-you-can-ask-it-to-do)
- [What can change](#what-can-change)
- [Getting access](#getting-access)
- [Configuration](#configuration)
- [Data, limits and background work](#data-limits-and-background-work)
- [Technical documentation](#technical-documentation)
- [Support](#support)

## Quick start

You need Node.js 20+, a verified Google Business Profile, a Google Cloud OAuth client and an approved Basic API Access application.

1. [Get approved access](#getting-access).
2. Add the server to your AI app.
3. Start with the read-only question above.

<details open><summary><strong>Codex</strong></summary>

<br>

In **Settings → Plugins → MCP servers**, choose **Add server**, then add `npx -y mcp-google-business@latest` with `GOOGLE_BUSINESS_CLIENT_ID`, `GOOGLE_BUSINESS_CLIENT_SECRET` and `GOOGLE_BUSINESS_REFRESH_TOKEN`.

```bash
codex mcp add google-business \
  --env GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
  --env GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
  -- npx -y mcp-google-business@latest
codex mcp list
```

[Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)

</details>

<details><summary><strong>Claude Code</strong></summary>

<br>

```bash
claude mcp add \
  --env GOOGLE_BUSINESS_CLIENT_ID=your_client_id \
  --env GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret \
  --env GOOGLE_BUSINESS_REFRESH_TOKEN=your_refresh_token \
  --transport stdio --scope user google-business \
  -- npx -y mcp-google-business@latest
claude mcp list
```

[Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)

</details>

<details><summary><strong>Claude Desktop</strong></summary>

<br>

Open **Settings → Developer → Edit Config** and add:

```json
{"mcpServers":{"google-business":{"command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"your_client_id","GOOGLE_BUSINESS_CLIENT_SECRET":"your_client_secret","GOOGLE_BUSINESS_REFRESH_TOKEN":"your_refresh_token"}}}}
```

If **Edit Config** is unavailable, edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows. [Claude Desktop MCP documentation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

</details>

<details><summary><strong>Cursor</strong></summary>

<br>

Add `{"mcpServers":{"google-business":{"type":"stdio","command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"your_client_id","GOOGLE_BUSINESS_CLIENT_SECRET":"your_client_secret","GOOGLE_BUSINESS_REFRESH_TOKEN":"your_refresh_token"}}}}` to `~/.cursor/mcp.json` on macOS/Linux or `%USERPROFILE%\.cursor\mcp.json` on Windows. [Cursor MCP documentation](https://cursor.com/docs/mcp)

</details>

<details><summary><strong>VS Code</strong></summary>

<br>

Run **MCP: Open User Configuration** and add:

```json
{"servers":{"google-business":{"type":"stdio","command":"npx","args":["-y","mcp-google-business@latest"],"env":{"GOOGLE_BUSINESS_CLIENT_ID":"${input:gbp_client_id}","GOOGLE_BUSINESS_CLIENT_SECRET":"${input:gbp_client_secret}","GOOGLE_BUSINESS_REFRESH_TOKEN":"${input:gbp_refresh_token}"}}},"inputs":[{"type":"promptString","id":"gbp_client_id","description":"Google OAuth client ID"},{"type":"promptString","id":"gbp_client_secret","description":"Google OAuth client secret","password":true},{"type":"promptString","id":"gbp_refresh_token","description":"Google OAuth refresh token","password":true}]}
```

Check it with **MCP: List Servers**. [VS Code MCP documentation](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

</details>

## What you can ask it to do

- List locations, categories, attributes and current profile information.
- Show calls, direction requests and search keyword impressions for a chosen period.
- Find fresh reviews, draft a reply and publish it after confirmation.
- Prepare, update or remove a local post.
- Update a selected location field or attribute after showing the exact change.

## What can change

| Operation | What happens | Confirmation boundary |
|---|---|---|
| Accounts, locations, categories, attributes, performance, reviews and posts | Reads existing profile data | No change |
| Update a location or its attributes | Changes public business profile data | Changes a location |
| Reply to a review | Publishes a public owner reply | Changes public content |
| Create or update a local post | Publishes or changes public local content | Changes public content |
| Delete a review reply or local post | Removes public content | Destructive |
| Raw API request | May call any write or delete endpoint | Potentially destructive |

The AI client controls confirmations; the server marks tools so the client can distinguish inspection from a live change.

## Getting access

Google requires **both** OAuth and Basic API Access approval.

1. Use a verified and active Business Profile that has existed for at least 60 days; apply from an owner or manager account and have a business website that matches the application.
2. Create a Google Cloud project, enable My Business Account Management API, Business Information API, Business Profile Performance API and Google My Business API (legacy v4).
3. Submit the [GBP API contact form](https://support.google.com/business/contact/api_default) as **Application for Basic API Access**. Before approval, quota is 0 QPM; approved projects receive 300 QPM per API.
4. Create an OAuth client, obtain a refresh token for `https://www.googleapis.com/auth/business.manage`, and set the three `GOOGLE_BUSINESS_*` variables.

Treat the client secret and refresh token as passwords. An access token is a short-lived alternative for one-off use.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_BUSINESS_CLIENT_ID` | Yes* | OAuth client ID. |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | Yes* | OAuth client secret. |
| `GOOGLE_BUSINESS_REFRESH_TOKEN` | Yes* | OAuth refresh token with `business.manage`. |
| `GOOGLE_BUSINESS_ACCESS_TOKEN` | Yes* | Short-lived alternative to the OAuth trio. |
| `GOOGLE_BUSINESS_TIMEOUT_MS` | No | Per-request timeout; default `60000` ms. |
| `GOOGLE_BUSINESS_MAX_RETRIES` | No | Temporary-error retries; default `3`. |

\* Provide either the OAuth trio or an access token. API host overrides are documented in [the tool reference](./docs/TOOLS.md).

## Data, limits and background work

- **Google receives the profile requests.** Anonymous telemetry includes installation and version data plus tool names, never OAuth secrets, profile data, arguments or prompts. Set `ASKADS_TELEMETRY=0` to opt out.
- **Real edit caps.** Approved projects receive 300 QPM per API; Google also limits each Business Profile to 10 edits per minute. Performance metrics can lag by a few days, and review replies require verified locations.
- **No background monitoring.** The server runs only while called. If your AI app supports scheduled tasks, it can periodically review new feedback or metrics.

## Technical documentation

- [All tools and inputs](./docs/TOOLS.md)
- [Development documentation](./docs/DEVELOPMENT.md)
- [Publishing documentation](./docs/PUBLISHING.md)
- [Google Business Profile API documentation](https://developers.google.com/my-business)

## Support

Found a bug or need a scenario? [Create an issue](https://github.com/A1-x-Tech/mcp-google-business/issues) or write in [Telegram](https://t.me/a1_mcp).

<br>

<p align="center">
  <img src="https://github.com/ztemerbekov/a1-yandex-kit-skills/raw/main/assets/images/mona-hifive-yandex-kit-warm.gif" alt="Две Моны дают пять" width="256">
</p>

<p align="center">
  Вы дочитали до конца!
</p>
