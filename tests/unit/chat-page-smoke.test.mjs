import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("chat page is split into client components and calls the chat API", async () => {
  const page = await readFile("src/app/chat/page.tsx", "utf8");
  const shell = await readFile("src/components/chat/ChatShell.tsx", "utf8");
  const input = await readFile("src/components/chat/ChatInput.tsx", "utf8");
  const list = await readFile("src/components/chat/ChatMessageList.tsx", "utf8");

  assert.match(page, /ChatShell/);
  assert.match(shell, /fetch\("\/api\/chat"/);
  assert.match(shell, /fetch\("\/api\/chat\/models"/);
  assert.match(shell, /event\.event === "usage"/);
  assert.match(shell, /ChatRunMetaView/);
  assert.match(shell, /AbortController/);
  assert.match(shell, /readServerSentEvents/);
  assert.match(shell, /getRandomValues/);
  assert.match(input, /copy\.regenerate/);
  assert.match(list, /copy\.emptyTitle/);
  assert.doesNotMatch(shell, /AI_API_KEY/);
});
