import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("workbench homepage links to chat and structured output modules", async () => {
  const source = await readFile("src/app/page.tsx", "utf8");

  assert.match(source, /copy\.title/);
  assert.match(source, /\/chat/);
  assert.match(source, /\/structured-output/);
});

test("structured output page calls the server route and never exposes provider secrets", async () => {
  const shell = await readFile("src/components/structured-output/StructuredOutputShell.tsx", "utf8");
  const route = await readFile("src/app/api/structured-output/route.ts", "utf8");

  assert.match(shell, /\/api\/structured-output/);
  assert.match(shell, /copy\.generate/);
  assert.doesNotMatch(shell, /AI_API_KEY/);
  assert.match(route, /StructuredOutputRequestSchema\.safeParse/);
  assert.match(route, /createAiProvider/);
  assert.match(route, /logAiRequest/);
});
