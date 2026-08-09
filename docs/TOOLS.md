# Tools

Google Business Profile is a read/write API served by **four hosts under one OAuth scope**
(`business.manage`). The client routes each tool to its host; tools accept bare numeric ids
(or full resource names) and the client builds whichever name scheme the endpoint wants —
v1 uses bare `locations/{id}`, legacy v4 needs `accounts/{a}/locations/{l}`.

## Accounts (Account Management API, v1)

| Tool | Description |
|---|---|
| `list_accounts` | All Business Profile accounts the authenticated user can access: `name` (accounts/{id}), `accountName`, `type`, `role`, `verificationState`. pageSize caps at **20** — paginate with `pageToken`. |

## Locations (Business Information API, v1)

| Tool | Description |
|---|---|
| `list_locations` | Locations under an account. `readMask` picks the fields (a default is injected — the API 400s without one); `totalSize` appears only when `filter` is set. |
| `get_location` | One location by id (bare v1 `locations/{id}` name). `metadata` carries `mapsUri`, `newReviewUri`, `placeId`. |
| `update_location` | PATCH with a required `updateMask`; `validateOnly` for dry runs. Subject to the 10 edits/min per-profile cap. |
| `list_categories` | The category taxonomy (`categories/gcid:...`), searchable by `displayName`; `view=FULL` adds serviceTypes/moreHoursTypes. |
| `list_attribute_metadata` | Which attributes are legal for a location (or category+region): value types, display names, legal values. |
| `update_location_attributes` | PATCH attributes; `attributeMask` defaults to the names of the attributes passed. |
| `search_chains` | Chain search by name (`chains/{chain_id}`, websites, locationCount). |

## Performance (Business Profile Performance API, v1)

| Tool | Description |
|---|---|
| `get_daily_metrics` | Daily time series for ONE metric (`timeSeries.datedValues[]`). Values are int64 **strings**. |
| `fetch_multi_daily_metrics` | Several metrics in one call — prefer it to save quota. |
| `list_search_keyword_impressions` | Monthly search keywords; `insightsValue` is a union of exact `value` OR `threshold` (low volume) — never sum thresholds. |

DailyMetric vocabulary (complete): `BUSINESS_IMPRESSIONS_DESKTOP_MAPS`,
`BUSINESS_IMPRESSIONS_DESKTOP_SEARCH`, `BUSINESS_IMPRESSIONS_MOBILE_MAPS`,
`BUSINESS_IMPRESSIONS_MOBILE_SEARCH`, `BUSINESS_CONVERSATIONS`,
`BUSINESS_DIRECTION_REQUESTS`, `CALL_CLICKS`, `WEBSITE_CLICKS`, `BUSINESS_BOOKINGS`,
`BUSINESS_FOOD_ORDERS`, `BUSINESS_FOOD_MENU_CLICKS`.

## Reviews (LEGACY v4 API — never migrated to v1)

| Tool | Description |
|---|---|
| `list_reviews` | Reviews of a location + `averageRating`, `totalReviewCount`. `starRating` is an enum ONE..FIVE, not a number. pageSize caps at **50**. |
| `get_review` | One review by id. |
| `reply_to_review` | PUT **upsert**: creates or replaces the public reply. Verified locations only. |
| `delete_review_reply` | Deletes the business's reply (the review itself cannot be deleted). |

## Local posts (LEGACY v4 API)

| Tool | Description |
|---|---|
| `list_local_posts` | Posts of a location with `state` (LIVE / PROCESSING / REJECTED) and `searchUrl`. |
| `create_local_post` | Publishes a post: `topicType` STANDARD / EVENT / OFFER (EVENT and OFFER need `event.schedule`); optional `callToAction`, `offer`, `media`. ALERT is restricted to Google-initiated campaigns. |
| `update_local_post` | PATCH with a required `updateMask`. |
| `delete_local_post` | Deletes a post. |

Notes:
- **Quota 0 until approved.** New projects fail every call with quota errors until the
  "Application for Basic API Access" is approved; the error message carries the form link.
- **10 edits/min per profile** is a hard, non-raisable cap on all writes to one profile.
- **Performance lag:** metrics for the last few days are empty — that is normal.
- Ids: tools accept `123`, `locations/123` or `accounts/1/locations/123` interchangeably.

## Escape hatch

| Tool | Description |
|---|---|
| `raw_request` | Call any endpoint directly: `service` picks the host (`accounts` / `businessinfo` / `performance` / `v4`), `path` is relative to it (e.g. `v1/accounts`, `v4/accounts/1/locations/2/media`). Arrays in `query` become repeated params. A `path` that resolves to a foreign origin is rejected (SSRF guard). |

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_BUSINESS_CLIENT_ID` | yes¹ | — | OAuth2 client id. |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | yes¹ | — | OAuth2 client secret. Treat as a secret. |
| `GOOGLE_BUSINESS_REFRESH_TOKEN` | yes¹ | — | OAuth2 refresh token (`business.manage` scope). Treat as a secret. |
| `GOOGLE_BUSINESS_ACCESS_TOKEN` | no¹ | — | Static access token (~1 h) instead of the trio. |
| `GOOGLE_BUSINESS_TIMEOUT_MS` | no | `60000` | Per-request timeout, ms. |
| `GOOGLE_BUSINESS_MAX_RETRIES` | no | `3` | Retries on transient errors. |
| `GOOGLE_BUSINESS_ACCOUNTS_API_BASE` | no | `https://mybusinessaccountmanagement.googleapis.com` | Host override. |
| `GOOGLE_BUSINESS_INFO_API_BASE` | no | `https://mybusinessbusinessinformation.googleapis.com` | Host override. |
| `GOOGLE_BUSINESS_PERFORMANCE_API_BASE` | no | `https://businessprofileperformance.googleapis.com` | Host override. |
| `GOOGLE_BUSINESS_V4_API_BASE` | no | `https://mybusiness.googleapis.com` | Host override. |

¹ Either the OAuth trio or `GOOGLE_BUSINESS_ACCESS_TOKEN`.
