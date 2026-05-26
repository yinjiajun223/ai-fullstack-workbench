import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("chat models route exposes model names without provider secrets", async () => {
  const source = await readFile("src/app/api/chat/models/route.ts", "utf8");

  assert.match(source, /getAiConfig/);
  assert.match(source, /defaultModel/);
  assert.match(source, /uniqueModelOptions/);
  assert.match(source, /X-Request-Id/);
  assert.doesNotMatch(source, /AI_API_KEY/);
});
