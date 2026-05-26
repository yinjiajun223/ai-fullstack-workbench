import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("chat route uses the AI provider adapter with validation and streaming", async () => {
  const source = await readFile("src/app/api/chat/route.ts", "utf8");

  assert.match(source, /from "zod"/);
  assert.match(source, /createAiProvider/);
  assert.match(source, /createRequestId/);
  assert.match(source, /ChatRequestSchema\.safeParse/);
  assert.match(source, /text\/event-stream/);
  assert.match(source, /X-Request-Id/);
  assert.match(source, /usage: result\.usage/);
  assert.doesNotMatch(source, /AI_API_KEY/);
});
