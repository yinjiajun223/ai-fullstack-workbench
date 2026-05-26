import type { NormalizedAiProviderError } from "./types";
import { AiConfigError } from "./config";

export class AiProviderError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly provider?: string;
  readonly retryable: boolean;

  constructor(input: {
    code: string;
    message: string;
    statusCode?: number;
    provider?: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "AiProviderError";
    this.code = input.code;
    this.statusCode = input.statusCode ?? 500;
    this.provider = input.provider;
    this.retryable = input.retryable ?? false;

    if (input.cause !== undefined) {
      this.cause = input.cause;
    }
  }
}

export function normalizeAiProviderError(error: unknown): NormalizedAiProviderError {
  if (error instanceof AiProviderError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      provider: error.provider,
      retryable: error.retryable,
      cause: error.cause,
    };
  }

  if (error instanceof AiConfigError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: 500,
      retryable: false,
      cause: error,
    };
  }

  return {
    code: "AI_PROVIDER_ERROR",
    message: "AI provider request failed.",
    statusCode: 500,
    retryable: false,
    cause: error,
  };
}
