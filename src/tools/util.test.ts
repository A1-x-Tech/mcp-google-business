import { test } from "node:test";
import assert from "node:assert/strict";
import { CREATE, DESTRUCTIVE, fail, isoDate, isoMonth, ok, RAW, READ_ONLY, WRITE } from "./util.js";

test("isoDate accepts calendar dates and rejects timestamps/junk", () => {
  const d = isoDate(); // factory → fresh schema
  assert.equal(d.safeParse("2026-07-01").success, true);
  assert.equal(d.safeParse("2026-07-01T00:00:00Z").success, false);
  assert.equal(d.safeParse("today").success, false);
});

test("isoMonth accepts calendar months and rejects full dates", () => {
  const m = isoMonth();
  assert.equal(m.safeParse("2026-07").success, true);
  assert.equal(m.safeParse("2026-07-01").success, false);
  assert.equal(m.safeParse("July").success, false);
});

test("schema factories return independent schemas (no $ref dedup)", () => {
  assert.notEqual(isoDate(), isoDate());
  assert.notEqual(isoMonth(), isoMonth());
});

test("ok emits compact JSON; fail flags isError", () => {
  assert.equal((ok({ a: 1 }).content[0] as { text: string }).text, '{"a":1}');
  const f = fail(new Error("boom"));
  assert.equal(f.isError, true);
  assert.match((f.content[0] as { text: string }).text, /boom/);
});

test("fail appends the underlying cause when present", () => {
  const err = new Error("timeout", { cause: new Error("ECONNRESET") });
  const f = fail(err);
  assert.match((f.content[0] as { text: string }).text, /timeout \(ECONNRESET\)/);
});

test("the annotation constants set all four hints each", () => {
  for (const [name, ann] of Object.entries({ READ_ONLY, WRITE, CREATE, DESTRUCTIVE, RAW })) {
    assert.deepEqual(
      Object.keys(ann).sort(),
      ["destructiveHint", "idempotentHint", "openWorldHint", "readOnlyHint"],
      name,
    );
  }
  assert.equal(READ_ONLY.readOnlyHint, true);
  assert.equal(WRITE.idempotentHint, true);
  assert.equal(CREATE.idempotentHint, false);
  assert.equal(DESTRUCTIVE.destructiveHint, true);
  assert.equal(RAW.destructiveHint, true);
});
