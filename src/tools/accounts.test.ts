import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAccountTools } from "./accounts.js";
import { harness } from "./harness.test-util.js";

test("registers list_accounts", () => {
  const { tools } = harness(registerAccountTools);
  assert.deepEqual(Object.keys(tools), ["list_accounts"]);
});

test("list_accounts forwards normalized params to client.listAccounts", async () => {
  const { calls, tools } = harness(registerAccountTools);
  await tools.list_accounts({ pageSize: 20, pageToken: "t", parentAccount: "9", filter: "type=USER_GROUP" });
  assert.equal(calls[0].method, "listAccounts");
  assert.deepEqual(calls[0].params, {
    pageSize: 20,
    pageToken: "t",
    parentAccount: "9",
    filter: "type=USER_GROUP",
  });
});

test("a client error is returned as an isError result, not thrown", async () => {
  const { tools } = harness(registerAccountTools, { throwOn: "listAccounts" });
  const res = await tools.list_accounts({});
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /boom/);
});
