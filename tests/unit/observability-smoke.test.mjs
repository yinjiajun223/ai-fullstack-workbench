import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("observability module exposes request id, logger, and AI request logging", async () => {
  const indexSource = await readFile("src/server/observability/index.ts", "utf8");
  const loggerSource = await readFile("src/server/observability/logger.ts", "utf8");
  const aiSource = await readFile("src/server/observability/ai.ts", "utf8");
  const routeSource = await readFile("src/app/api/chat/route.ts", "utf8");

  assert.match(indexSource, /createRequestId/);
  assert.match(indexSource, /createLogger/);
  assert.match(indexSource, /logAiRequest/);
  assert.match(loggerSource, /LoggerSink/);
  assert.match(aiSource, /usage\?: ModelUsage/);
  assert.match(routeSource, /createRequestId/);
  assert.match(routeSource, /usage: result\.usage/);
  assert.match(routeSource, /usage = chunk\.usage/);
});
