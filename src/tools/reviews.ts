import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GoogleBusinessClient } from "../client.js";
import { DESTRUCTIVE, fail, ok, READ_ONLY, WRITE } from "./util.js";

/** FACTORIES (see util.ts): a fresh schema per field avoids `$ref` dedup in the JSON schema. */
const accountId = () => z.string().min(1).describe('Account id — bare "123" or "accounts/123".');
const locationId = () =>
  z.string().min(1).describe('Location id — bare "456", "locations/456" or "accounts/1/locations/456".');
const reviewId = () => z.string().min(1).describe("Review id (from list_reviews `reviewId` or `name`).");

const V4_NOTE =
  "Reviews live only on the legacy v4 API (mybusiness.googleapis.com) — they were never migrated to v1.";

export function registerReviewTools(server: McpServer, client: GoogleBusinessClient): void {
  server.registerTool(
    "list_reviews",
    {
      title: "List reviews",
      annotations: READ_ONLY,
      description:
        "Lists reviews of a location, newest-updated first by default. Response: reviews[] of {name, reviewId, " +
        "reviewer{displayName, isAnonymous}, starRating (ONE..FIVE enum, not a number), comment, createTime, " +
        "updateTime, reviewReply{comment, updateTime} if answered}, plus averageRating (1–5) and " +
        "totalReviewCount. pageSize caps at 50. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        pageSize: z.number().int().min(1).max(50).optional().describe("Reviews per page (1..50 — API cap; default 50)."),
        pageToken: z.string().optional().describe("nextPageToken from the previous page."),
        orderBy: z
          .enum(["updateTime desc", "rating", "rating desc"])
          .optional()
          .describe('Sort order; default "updateTime desc".'),
      },
    },
    async ({ accountId, locationId, pageSize, pageToken, orderBy }) => {
      try {
        return ok(await client.listReviews({ accountId, locationId, pageSize, pageToken, orderBy }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_review",
    {
      title: "Get a review",
      annotations: READ_ONLY,
      description:
        "Returns one review by id — same shape as a list_reviews entry (starRating is an enum ONE..FIVE, " +
        "reviewReply present only if the business already answered). " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        reviewId: reviewId(),
      },
    },
    async ({ accountId, locationId, reviewId }) => {
      try {
        return ok(await client.getReview({ accountId, locationId, reviewId }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "reply_to_review",
    {
      title: "Reply to a review",
      annotations: WRITE,
      description:
        "Creates OR replaces the business's public reply to a review (PUT upsert — there is no separate create, " +
        "and calling it again overwrites the previous reply). Only works on verified locations. Returns the " +
        "ReviewReply {comment, updateTime}. Counts against the 10 edits/min per-profile cap. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        reviewId: reviewId(),
        comment: z
          .string()
          .min(1)
          .max(4096)
          .describe("The public reply text (plain text; keep it concise — very long replies may be rejected)."),
      },
    },
    async ({ accountId, locationId, reviewId, comment }) => {
      try {
        return ok(await client.replyToReview({ accountId, locationId, reviewId, comment }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "delete_review_reply",
    {
      title: "Delete a review reply",
      annotations: DESTRUCTIVE,
      description:
        "Deletes the business's reply to a review (the review itself is the customer's and cannot be deleted). " +
        "Empty response on success. " +
        V4_NOTE,
      inputSchema: {
        accountId: accountId(),
        locationId: locationId(),
        reviewId: reviewId(),
      },
    },
    async ({ accountId, locationId, reviewId }) => {
      try {
        return ok(await client.deleteReviewReply({ accountId, locationId, reviewId }));
      } catch (e) {
        return fail(e);
      }
    },
  );
}
