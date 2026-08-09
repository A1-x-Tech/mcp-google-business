import { test } from "node:test";
import assert from "node:assert/strict";
import { registerReviewTools } from "./reviews.js";
import { harness } from "./harness.test-util.js";

test("registers the four review tools", () => {
  const { tools } = harness(registerReviewTools);
  assert.deepEqual(Object.keys(tools).sort(), [
    "delete_review_reply",
    "get_review",
    "list_reviews",
    "reply_to_review",
  ]);
});

test("list_reviews forwards ids, paging and order", async () => {
  const { calls, tools } = harness(registerReviewTools);
  await tools.list_reviews({ accountId: "1", locationId: "2", pageSize: 50, orderBy: "rating desc" });
  assert.equal(calls[0].method, "listReviews");
  assert.deepEqual(calls[0].params, {
    accountId: "1",
    locationId: "2",
    pageSize: 50,
    pageToken: undefined,
    orderBy: "rating desc",
  });
});

test("get_review forwards the review reference", async () => {
  const { calls, tools } = harness(registerReviewTools);
  await tools.get_review({ accountId: "1", locationId: "2", reviewId: "r9" });
  assert.equal(calls[0].method, "getReview");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", reviewId: "r9" });
});

test("reply_to_review forwards the comment", async () => {
  const { calls, tools } = harness(registerReviewTools);
  await tools.reply_to_review({ accountId: "1", locationId: "2", reviewId: "r9", comment: "Thanks!" });
  assert.equal(calls[0].method, "replyToReview");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", reviewId: "r9", comment: "Thanks!" });
});

test("delete_review_reply forwards the review reference", async () => {
  const { calls, tools } = harness(registerReviewTools);
  await tools.delete_review_reply({ accountId: "1", locationId: "2", reviewId: "r9" });
  assert.equal(calls[0].method, "deleteReviewReply");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", reviewId: "r9" });
});

test("a client error is returned as an isError result, not thrown", async () => {
  const { tools } = harness(registerReviewTools, { throwOn: "replyToReview" });
  const res = await tools.reply_to_review({ accountId: "1", locationId: "2", reviewId: "r9", comment: "x" });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /boom/);
});
