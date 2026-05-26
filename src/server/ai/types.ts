export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: AiToolCall[];
};

export type ModelUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AiToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AiToolDefinition[];
  toolChoice?: "auto" | "none";
};

export type ChatCompletionResult = {
  content: string;
  model?: string;
  usage?: ModelUsage;
  toolCalls?: AiToolCall[];
  raw?: unknown;
};

export type EmbeddingRequest = {
  input: string[];
  model?: string;
};

export type EmbeddingResult = {
  embeddings: number[][];
  model?: string;
  usage?: ModelUsage;
  raw?: unknown;
};

export type ChatStreamChunk =
  | {
      type: "content";
      content: string;
    }
  | {
      type: "usage";
      usage: ModelUsage;
    }
  | {
      type: "error";
      error: NormalizedAiProviderError;
    }
  | {
      type: "done";
    };

export type NormalizedAiProviderError = {
  code: string;
  message: string;
  statusCode: number;
  provider?: string;
  retryable: boolean;
  cause?: unknown;
};

export type AiProvider = {
  name: string;
  chat: (request: ChatCompletionRequest) => Promise<ChatCompletionResult>;
  streamChat: (request: ChatCompletionRequest) => AsyncIterable<ChatStreamChunk>;
  embed: (request: EmbeddingRequest) => Promise<EmbeddingResult>;
};
