import test from "node:test";
import assert from "node:assert/strict";
import { loadAiModule } from "./load-ai-module.mjs";

test("loads AI config from server-only environment variables", async () => {
  const { getAiConfig } = await loadAiModule("config.ts");

  const config = getAiConfig({
    AI_PROVIDER: "openai-compatible",
    AI_BASE_URL: "https://example.test/v1",
    AI_API_KEY: "secret-key",
    AI_CHAT_MODEL: "chat-model",
    AI_FAST_MODEL: "fast-model",
    AI_REASONING_MODEL: "reasoning-model",
    AI_EMBEDDING_MODEL: "embedding-model",
  });

  assert.deepEqual(config, {
    provider: "openai-compatible",
    baseUrl: "https://example.test/v1",
    apiKey: "secret-key",
    chatModel: "chat-model",
    fastModel: "fast-model",
    reasoningModel: "reasoning-model",
    embeddingModel: "embedding-model",
  });
});

test("normalizes missing AI config without exposing secrets", async () => {
  const { getAiConfig } = await loadAiModule("config.ts");
  const { normalizeAiProviderError } = await loadAiModule("errors.ts");

  assert.throws(
    () => getAiConfig({ AI_PROVIDER: "openai-compatible", AI_API_KEY: "secret-key" }),
    (error) => {
      const normalized = normalizeAiProviderError(error);

      assert.equal(normalized.code, "AI_CONFIG_ERROR");
      assert.equal(normalized.statusCode, 500);
      assert.equal(normalized.message.includes("secret-key"), false);
      return true;
    },
  );
});

test("OpenAI-compatible provider sends chat completion requests and maps usage", async () => {
  const { createOpenAiCompatibleProvider } = await loadAiModule("providers/openai-compatible.ts");
  const calls = [];

  const provider = createOpenAiCompatibleProvider({
    config: {
      provider: "openai-compatible",
      baseUrl: "https://example.test/v1/",
      apiKey: "secret-key",
      chatModel: "chat-model",
      fastModel: "",
      reasoningModel: "",
      embeddingModel: "",
    },
    fetch: async (url, init) => {
      calls.push({ url, init });

      return new Response(JSON.stringify({
        id: "chatcmpl_1",
        choices: [{ message: { role: "assistant", content: "Hello" } }],
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
          total_tokens: 7,
        },
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const result = await provider.chat({
    messages: [{ role: "user", content: "Hi" }],
  });

  assert.equal(result.content, "Hello");
  assert.deepEqual(result.usage, {
    inputTokens: 3,
    outputTokens: 4,
    totalTokens: 7,
  });
  assert.equal(calls[0].url, "https://example.test/v1/chat/completions");
  assert.equal(calls[0].init.headers.Authorization, "Bearer secret-key");
  assert.equal(JSON.parse(calls[0].init.body).model, "chat-model");
});

test("OpenAI-compatible provider streams content deltas and final usage", async () => {
  const { createOpenAiCompatibleProvider } = await loadAiModule("providers/openai-compatible.ts");
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: {\"choices\":[{\"delta\":{\"content\":\"Hel\"}}]}\n\n"));
      controller.enqueue(encoder.encode("data: {\"choices\":[{\"delta\":{\"content\":\"lo\"}}],\"usage\":{\"prompt_tokens\":1,\"completion_tokens\":2,\"total_tokens\":3}}\n\n"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  const provider = createOpenAiCompatibleProvider({
    config: {
      provider: "openai-compatible",
      baseUrl: "https://example.test/v1",
      apiKey: "secret-key",
      chatModel: "chat-model",
      fastModel: "",
      reasoningModel: "",
      embeddingModel: "",
    },
    fetch: async () => new Response(stream, { status: 200 }),
  });

  const chunks = [];

  for await (const chunk of provider.streamChat({
    messages: [{ role: "user", content: "Hi" }],
  })) {
    chunks.push(chunk);
  }

  assert.deepEqual(chunks, [
    { type: "content", content: "Hel" },
    { type: "content", content: "lo" },
    { type: "usage", usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
    { type: "done" },
  ]);
});
