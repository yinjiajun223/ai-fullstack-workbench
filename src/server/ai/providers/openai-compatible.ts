import type {
  AiProvider,
  ChatCompletionRequest,
  ChatCompletionResult,
  ChatMessage,
  ChatStreamChunk,
  ModelUsage,
} from "../types";
import type { AiConfig } from "../config";
import { AiProviderError, normalizeAiProviderError } from "../errors";

type FetchLike = typeof fetch;

type OpenAiCompatibleProviderOptions = {
  config: AiConfig;
  fetch?: FetchLike;
};

type OpenAiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type OpenAiChatCompletionResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
  usage?: OpenAiUsage;
};

type OpenAiToolCall = {
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
};

export function createOpenAiCompatibleProvider(
  options: OpenAiCompatibleProviderOptions,
): AiProvider {
  const fetchImpl = options.fetch ?? fetch;

  return {
    name: "openai-compatible",

    async chat(request) {
      const response = await fetchChatCompletion({
        config: options.config,
        fetchImpl,
        request,
        stream: false,
      });
      const payload = (await response.json()) as OpenAiChatCompletionResponse;

      return mapChatCompletionResult(payload);
    },

    async *streamChat(request) {
      try {
        const response = await fetchChatCompletion({
          config: options.config,
          fetchImpl,
          request,
          stream: true,
        });

        if (!response.body) {
          throw new AiProviderError({
            code: "AI_STREAM_ERROR",
            message: "AI provider returned an empty stream.",
            provider: "openai-compatible",
          });
        }

        yield* parseOpenAiCompatibleStream(response.body);
      } catch (error) {
        yield {
          type: "error",
          error: normalizeAiProviderError(error),
        };
      }
    },
  };
}

async function fetchChatCompletion(input: {
  config: AiConfig;
  fetchImpl: FetchLike;
  request: ChatCompletionRequest;
  stream: boolean;
}): Promise<Response> {
  const response = await input.fetchImpl(buildChatCompletionUrl(input.config.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toOpenAiChatCompletionBody(input.request, input.config, input.stream)),
  });

  if (!response.ok) {
    throw new AiProviderError({
      code: "AI_PROVIDER_HTTP_ERROR",
      message: `AI provider request failed with status ${response.status}.`,
      statusCode: response.status,
      provider: "openai-compatible",
      retryable: response.status === 429 || response.status >= 500,
    });
  }

  return response;
}

function buildChatCompletionUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function toOpenAiChatCompletionBody(
  request: ChatCompletionRequest,
  config: AiConfig,
  stream: boolean,
): Record<string, unknown> {
  return {
    model: request.model ?? config.chatModel,
    messages: request.messages.map(toOpenAiMessage),
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    tools: request.tools,
    tool_choice: request.toolChoice,
    stream,
    stream_options: stream ? { include_usage: true } : undefined,
  };
}

function toOpenAiMessage(message: ChatMessage): Record<string, unknown> {
  return {
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
    ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
    ...(message.toolCalls ? { tool_calls: message.toolCalls } : {}),
  };
}

function mapChatCompletionResult(payload: OpenAiChatCompletionResponse): ChatCompletionResult {
  const message = payload.choices?.[0]?.message;

  return {
    content: message?.content ?? "",
    model: payload.model,
    usage: mapUsage(payload.usage),
    toolCalls: mapToolCalls(message?.tool_calls),
    raw: payload,
  };
}

function mapToolCalls(toolCalls: OpenAiToolCall[] | undefined): ChatCompletionResult["toolCalls"] {
  if (!toolCalls?.length) {
    return undefined;
  }

  return toolCalls
    .filter((toolCall) => toolCall.id && toolCall.function?.name)
    .map((toolCall) => ({
      id: toolCall.id ?? "",
      type: "function" as const,
      function: {
        name: toolCall.function?.name ?? "",
        arguments: toolCall.function?.arguments ?? "{}",
      },
    }));
}

function mapUsage(usage: OpenAiUsage | undefined): ModelUsage | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
}

async function* parseOpenAiCompatibleStream(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<ChatStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      yield* parseSseEvent(event);
    }
  }

  if (buffer.trim()) {
    yield* parseSseEvent(buffer);
  }

  yield { type: "done" };
}

function* parseSseEvent(event: string): Iterable<ChatStreamChunk> {
  const lines = event.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();

    if (!data || data === "[DONE]") {
      continue;
    }

    const payload = JSON.parse(data) as {
      choices?: Array<{
        delta?: {
          content?: string;
        };
      }>;
      usage?: OpenAiUsage;
    };
    const content = payload.choices?.[0]?.delta?.content;
    const usage = mapUsage(payload.usage);

    if (content) {
      yield { type: "content", content };
    }

    if (usage) {
      yield { type: "usage", usage };
    }
  }
}
