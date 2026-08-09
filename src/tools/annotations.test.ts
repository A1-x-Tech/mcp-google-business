import { test } from "node:test";
import assert from "node:assert/strict";
import { registerAccountTools } from "./accounts.js";
import { registerLocationTools } from "./locations.js";
import { registerPerformanceTools } from "./performance.js";
import { registerReviewTools } from "./reviews.js";
import { registerPostTools } from "./posts.js";
import { registerRawTool } from "./raw.js";
import { CREATE, DESTRUCTIVE, RAW, READ_ONLY, WRITE } from "./util.js";

interface Annotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/** Registers every tool against a fake server, capturing each tool's annotations. */
function collectAnnotations(): Record<string, Annotations | undefined> {
  const annotations: Record<string, Annotations | undefined> = {};
  const server = {
    registerTool: (name: string, cfg: { annotations?: Annotations }) => {
      annotations[name] = cfg.annotations;
    },
  };
  // Registration reads the client only inside handlers, so a stub is fine here.
  registerAccountTools(server as never, {} as never);
  registerLocationTools(server as never, {} as never);
  registerPerformanceTools(server as never, {} as never);
  registerReviewTools(server as never, {} as never);
  registerPostTools(server as never, {} as never);
  registerRawTool(server as never, {} as never);
  return annotations;
}

const ANN = collectAnnotations();

/**
 * Google Business Profile is a read/write API, so the invariant is a pinned map
 * of tool → expected hints, not "everything is read-only". Adding a tool without
 * thinking about its annotations breaks this test on purpose.
 */
const EXPECTED: Record<string, Annotations> = {
  list_accounts: READ_ONLY,
  list_locations: READ_ONLY,
  get_location: READ_ONLY,
  update_location: WRITE,
  list_categories: READ_ONLY,
  list_attribute_metadata: READ_ONLY,
  update_location_attributes: WRITE,
  search_chains: READ_ONLY,
  get_daily_metrics: READ_ONLY,
  fetch_multi_daily_metrics: READ_ONLY,
  list_search_keyword_impressions: READ_ONLY,
  list_reviews: READ_ONLY,
  get_review: READ_ONLY,
  reply_to_review: WRITE,
  delete_review_reply: DESTRUCTIVE,
  list_local_posts: READ_ONLY,
  create_local_post: CREATE,
  update_local_post: WRITE,
  delete_local_post: DESTRUCTIVE,
  raw_request: RAW,
};

test("registers all twenty tools", () => {
  assert.deepEqual(Object.keys(ANN).sort(), Object.keys(EXPECTED).sort());
});

test("every tool carries exactly its expected annotations, all four hints set", () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    assert.deepEqual(ANN[name], expected, `${name} annotations`);
    for (const hint of ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"] as const) {
      assert.notEqual(ANN[name]?.[hint], undefined, `${name} must set ${hint}`);
    }
  }
});

test("destructive tools are exactly the deletes plus raw_request", () => {
  const destructive = Object.entries(ANN)
    .filter(([, a]) => a?.destructiveHint)
    .map(([name]) => name)
    .sort();
  assert.deepEqual(destructive, ["delete_local_post", "delete_review_reply", "raw_request"]);
});
