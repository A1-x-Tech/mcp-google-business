import { test } from "node:test";
import assert from "node:assert/strict";
import { registerPostTools } from "./posts.js";
import { harness } from "./harness.test-util.js";

test("registers the four local-post tools", () => {
  const { tools } = harness(registerPostTools);
  assert.deepEqual(Object.keys(tools).sort(), [
    "create_local_post",
    "delete_local_post",
    "list_local_posts",
    "update_local_post",
  ]);
});

test("list_local_posts forwards ids and paging", async () => {
  const { calls, tools } = harness(registerPostTools);
  await tools.list_local_posts({ accountId: "1", locationId: "2", pageSize: 20 });
  assert.equal(calls[0].method, "listLocalPosts");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", pageSize: 20, pageToken: undefined });
});

test("create_local_post forwards the post body", async () => {
  const { calls, tools } = harness(registerPostTools);
  const post = { topicType: "STANDARD", summary: "Fresh croissants!" };
  await tools.create_local_post({ accountId: "1", locationId: "2", post });
  assert.equal(calls[0].method, "createLocalPost");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", post });
});

test("update_local_post forwards the mask and partial post", async () => {
  const { calls, tools } = harness(registerPostTools);
  await tools.update_local_post({
    accountId: "1",
    locationId: "2",
    postId: "p3",
    updateMask: "summary",
    post: { summary: "New text" },
  });
  assert.equal(calls[0].method, "updateLocalPost");
  assert.deepEqual(calls[0].params, {
    accountId: "1",
    locationId: "2",
    postId: "p3",
    updateMask: "summary",
    post: { summary: "New text" },
  });
});

test("delete_local_post forwards the post reference", async () => {
  const { calls, tools } = harness(registerPostTools);
  await tools.delete_local_post({ accountId: "1", locationId: "2", postId: "p3" });
  assert.equal(calls[0].method, "deleteLocalPost");
  assert.deepEqual(calls[0].params, { accountId: "1", locationId: "2", postId: "p3" });
});

test("a client error is returned as an isError result, not thrown", async () => {
  const { tools } = harness(registerPostTools, { throwOn: "createLocalPost" });
  const res = await tools.create_local_post({ accountId: "1", locationId: "2", post: {} });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /boom/);
});
