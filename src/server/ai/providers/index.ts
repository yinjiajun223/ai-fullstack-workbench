import type { AiProvider } from "../types";
import type { AiConfig } from "../config";
import { createOpenAiCompatibleProvider } from "./openai-compatible";
import { AiProviderError } from "../errors";

type CreateAiProviderOptions = {
  config: AiConfig;
  fetch?: typeof fetch;
};

export function createAiProvider(options: CreateAiProviderOptions): AiProvider {
  if (options.config.provider === "openai-compatible" || options.config.provider === "dashscope") {
    return createOpenAiCompatibleProvider(options);
  }

  throw new AiProviderError({
    code: "AI_PROVIDER_UNSUPPORTED",
    message: `Unsupported AI provider "${options.config.provider}".`,
    provider: options.config.provider,
  });
}

export { createOpenAiCompatibleProvider };
