import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient } from "../client.js";
import { CREATE, DESTRUCTIVE, fail, ok, READ_ONLY, WRITE } from "./util.js";

/** FACTORIES (see util.ts): a fresh schema per field avoids `$ref` dedup in the JSON schema. */
const accountId = () => z.string().min(1).describe('Account id — bare "123" or "accounts/123".');
const locationId = () =>
  z.string().min(1).describe('Location id — bare "456", "locations/456" or "accounts/1/locations/456".');
const postId = () => z.string().min(1).describe("Local post id (last segment of the post's `name`).");

const V4_NOTE =
  "Local posts live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.";

const POST_SHAPE =
  "LocalPost fields: languageCode; summary (the post text); topicType (STANDARD | EVENT | OFFER | ALERT); " +
  "callToAction {actionType: BOOK | ORDER | SHOP | LEARN_MORE | SIGN_UP | CALL, url}; " +
  "event {title, schedule{startDate{year,month,day}, startTime{hours,minutes}, endDate, endTime}} — required for " +
  "EVENT and OFFER; offer {couponCode, redeemOnlineUrl, termsConditions}; media [{mediaFormat: \"PHOTO\", " +
  "sourceUrl}]. ALERT posts are restricted to Google-initiated campaigns and are typically rejected.";

export function registerPostTools(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "list_local_posts",
    {
      title: "List local posts",
      annotations: READ_ONLY,
      description:
        "Lists the local posts (What's New / Event / Offer updates shown on the Business Profile) of a location. " +
        "Each post has name (accounts/*/locations/*/localPosts/{post_id}), summary, topicType, state " +
        "(LIVE / PROCESSING / REJECTED), searchUrl, createTime and updateTime. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        pageSize: z.number().int().min(1).max(100).optional().describe("Posts per page (default 20)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
      },
    },
    async ({ accountId, locationId, pageSize, pageToken }) => {
      try {
        return ok(await client.listLocalPosts({ accountId, locationId, pageSize, pageToken }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "create_local_post",
    {
      title: "Create a local post",
      annotations: CREATE,
      description:
        "Publishes a new local post on the Business Profile. Pass the LocalPost as `post`. " +
        POST_SHAPE +
        " Returns the created post with its name and state (a fresh post is usually PROCESSING before it goes " +
        "LIVE). Counts against the 10 edits/min per-profile cap. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        post: z
          .record(z.any())
          .describe(
            'The LocalPost to create, e.g. {"languageCode": "en", "topicType": "STANDARD", ' +
              '"summary": "Fresh croissants every morning!", ' +
              '"callToAction": {"actionType": "LEARN_MORE", "url": "https://example.com"}}.',
          ),
      },
    },
    async ({ accountId, locationId, post }) => {
      try {
        return ok(await client.createLocalPost({ accountId, locationId, post }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "update_local_post",
    {
      title: "Update a local post",
      annotations: WRITE,
      description:
        "Updates fields of an existing local post (PATCH with a required updateMask — only masked fields change, " +
        'e.g. updateMask "summary" with post {"summary": "New text"}). ' +
        POST_SHAPE +
        " Returns the updated post. Counts against the 10 edits/min per-profile cap. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        postId: postId(),
        updateMask: z
          .string()
          .min(1)
          .describe('Comma-separated FieldMask of post fields to overwrite, e.g. "summary,callToAction".'),
        post: z.record(z.any()).describe("Partial LocalPost with the new field values."),
      },
    },
    async ({ accountId, locationId, postId, updateMask, post }) => {
      try {
        return ok(await client.updateLocalPost({ accountId, locationId, postId, updateMask, post }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "delete_local_post",
    {
      title: "Delete a local post",
      annotations: DESTRUCTIVE,
      description:
        "Deletes a local post from the Business Profile. Empty response on success. " + V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        postId: postId(),
      },
    },
    async ({ accountId, locationId, postId }) => {
      try {
        return ok(await client.deleteLocalPost({ accountId, locationId, postId }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
