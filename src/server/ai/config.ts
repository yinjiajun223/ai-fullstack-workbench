export type AiProviderName = "openai-compatible" | "dashscope";

export type AiConfig = {
  provider: AiProviderName;
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  fastModel: string;
  reasoningModel: string;
  embeddingModel: string;
};

type AiEnv = Partial<Record<
  | "AI_PROVIDER"
  | "AI_BASE_URL"
  | "AI_API_KEY"
  | "AI_CHAT_MODEL"
  | "AI_FAST_MODEL"
  | "AI_REASONING_MODEL"
  | "AI_EMBEDDING_MODEL",
  string
>>;

export class AiConfigError extends Error {
  readonly code = "AI_CONFIG_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

export function getAiConfig(env: AiEnv = process.env): AiConfig {
  const provider = normalizeProvider(env.AI_PROVIDER);
  const baseUrl = readRequiredEnv(env, "AI_BASE_URL");
  const apiKey = readRequiredEnv(env, "AI_API_KEY");
  const chatModel = readRequiredEnv(env, "AI_CHAT_MODEL");

  return {
    provider,
    baseUrl,
    apiKey,
    chatModel,
    fastModel: env.AI_FAST_MODEL ?? "",
    reasoningModel: env.AI_REASONING_MODEL ?? "",
    embeddingModel: env.AI_EMBEDDING_MODEL ?? "",
  };
}

function normalizeProvider(provider: string | undefined): AiProviderName {
  if (!provider || provider === "openai-compatible" || provider === "dashscope") {
    return provider === "dashscope" ? "dashscope" : "openai-compatible";
  }

  throw new AiConfigError(`Unsupported AI_PROVIDER "${provider}".`);
}

function readRequiredEnv(env: AiEnv, key: keyof AiEnv): string {
  const value = env[key];

  if (!value) {
    throw new AiConfigError(`Missing required environment variable ${key}.`);
  }

  return value;
}
