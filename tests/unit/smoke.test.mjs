import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";

test("project smoke files exist", async () => {
  await access("package.json");
  await access(".env.example");

  assert.ok(true);
});
