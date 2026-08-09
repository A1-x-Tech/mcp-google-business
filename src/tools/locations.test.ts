import { test } from "node:test";
import assert from "node:assert/strict";
import { registerLocationTools } from "./locations.js";
import { harness } from "./harness.test-util.js";

test("registers the seven Business Information tools", () => {
  const { tools } = harness(registerLocationTools);
  assert.deepEqual(Object.keys(tools).sort(), [
    "get_location",
    "list_attribute_metadata",
    "list_categories",
    "list_locations",
    "search_chains",
    "update_location",
    "update_location_attributes",
  ]);
});

test("list_locations forwards params to client.listLocations", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.list_locations({ accountId: "12", readMask: "name,title", pageSize: 10, filter: 'title="X"' });
  assert.equal(calls[0].method, "listLocations");
  assert.deepEqual(calls[0].params, {
    accountId: "12",
    readMask: "name,title",
    pageSize: 10,
    pageToken: undefined,
    filter: 'title="X"',
    orderBy: undefined,
  });
});

test("get_location forwards locationId + readMask", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.get_location({ locationId: "locations/7" });
  assert.equal(calls[0].method, "getLocation");
  assert.deepEqual(calls[0].params, { locationId: "locations/7", readMask: undefined });
});

test("update_location forwards the mask, body and validateOnly", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.update_location({
    locationId: "7",
    updateMask: "title",
    location: { title: "New" },
    validateOnly: true,
  });
  assert.equal(calls[0].method, "updateLocation");
  assert.deepEqual(calls[0].params, {
    locationId: "7",
    updateMask: "title",
    location: { title: "New" },
    validateOnly: true,
  });
});

test("list_categories defaults the view to BASIC", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.list_categories({ regionCode: "US", languageCode: "en" });
  assert.equal(calls[0].method, "listCategories");
  assert.deepEqual(calls[0].params, {
    regionCode: "US",
    languageCode: "en",
    view: "BASIC",
    filter: undefined,
    pageSize: undefined,
    pageToken: undefined,
  });
});

test("list_attribute_metadata forwards either locationId or category+region", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.list_attribute_metadata({ categoryName: "gcid:cafe", regionCode: "DE", languageCode: "de" });
  assert.equal(calls[0].method, "listAttributeMetadata");
  assert.deepEqual(calls[0].params, {
    locationId: undefined,
    categoryName: "gcid:cafe",
    regionCode: "DE",
    languageCode: "de",
    showAll: undefined,
    pageSize: undefined,
    pageToken: undefined,
  });
});

test("update_location_attributes forwards attributes and the optional mask", async () => {
  const { calls, tools } = harness(registerLocationTools);
  const attributes = [{ name: "attributes/wi_fi", repeatedEnumValue: { setValues: ["free_wi_fi"] } }];
  await tools.update_location_attributes({ locationId: "7", attributes });
  assert.equal(calls[0].method, "updateLocationAttributes");
  assert.deepEqual(calls[0].params, { locationId: "7", attributes, attributeMask: undefined });
});

test("search_chains forwards chainName + pageSize", async () => {
  const { calls, tools } = harness(registerLocationTools);
  await tools.search_chains({ chainName: "walmart", pageSize: 5 });
  assert.equal(calls[0].method, "searchChains");
  assert.deepEqual(calls[0].params, { chainName: "walmart", pageSize: 5 });
});

test("a client error is returned as an isError result, not thrown", async () => {
  const { tools } = harness(registerLocationTools, { throwOn: "updateLocation" });
  const res = await tools.update_location({ locationId: "7", updateMask: "title", location: {} });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /boom/);
});
