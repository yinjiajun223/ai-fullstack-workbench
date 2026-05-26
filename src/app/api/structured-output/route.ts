import {
  createAiProvider,
  getAiConfig,
  normalizeAiProviderError,
  type ModelUsage,
} from "@/server/ai";
import {
  getStructuredOutputSchema,
  getStructuredOutputSchemaDescription,
  StructuredOutputRequestSchema,
} from "@/server/ai/schemas/structured-output";
import { createRequestId, logAiRequest } from "@/server/observability";

export const runtime = "nodejs";

type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

type StructuredOutputResponseData = {
  output: unknown;
  rawText: string;
  model?: string;
  usage?: ModelUsage;
};

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const startedAt = Date.now();
  let model: string | undefined;

  try {
    const body = await readJsonBody(request);
    const parsed = StructuredOutputRequestSchema.safeParse(body);

    if (!parsed.success) {
      logStructuredOutputRequest({
        requestId,
        startedAt,
        status: "error",
        errorCode: "VALIDATION_ERROR",
      });

      return jsonFailure({
        requestId,
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid structured output request body.",
        details: parsed.error.flatten(),
      });
    }

    const config = getAiConfig();
    model = parsed.data.model ?? config.chatModel;
    const provider = createAiProvider({ config });
    const result = await provider.chat({
      model: parsed.data.model,
      messages: [
        {
          role: "system",
          content: buildStructuredOutputSystemPrompt(
            getStructuredOutputSchemaDescription(parsed.data.useCase),
          ),
        },
        {
          role: "user",
          content: parsed.data.input,
        },
      ],
      temperature: 0.2,
    });
    const output = parseJsonObject(result.content);
    const schema = getStructuredOutputSchema(parsed.data.useCase);
    const validation = schema.safeParse(output);

    if (!validation.success) {
      logStructuredOutputRequest({
        requestId,
        startedAt,
        model: result.model ?? model,
        status: "error",
        errorCode: "STRUCTURED_OUTPUT_VALIDATION_ERROR",
        usage: result.usage,
      });

      return jsonFailure({
        requestId,
        status: 422,
        code: "STRUCTURED_OUTPUT_VALIDATION_ERROR",
        message: "Model output did not match the expected schema.",
        details: validation.error.flatten(),
      });
    }

    logStructuredOutputRequest({
      requestId,
      startedAt,
      model: result.model ?? model,
      status: "success",
      usage: result.usage,
    });

    return jsonSuccess<StructuredOutputResponseData>({
      requestId,
      data: {
        output: validation.data,
        rawText: result.content,
        model: result.model ?? model,
        usage: result.usage,
      },
    });
  } catch (error) {
    if (error instanceof StructuredOutputRouteError) {
      logStructuredOutputRequest({
        requestId,
        startedAt,
        model,
        status: "error",
        errorCode: error.code,
      });

      return jsonFailure({
        requestId,
        status: error.statusCode,
        code: error.code,
        message: error.message,
      });
    }

    const normalizedError = normalizeAiProviderError(error);

    logStructuredOutputRequest({
      requestId,
      startedAt,
      model,
      status: "error",
      errorCode: normalizedError.code,
    });

    return jsonFailure({
      requestId,
      status: normalizedError.statusCode,
      code: normalizedError.code,
      message: normalizedError.message,
    });
  }
}

function buildStructuredOutputSystemPrompt(schemaDescription: string): string {
  return [
    "You generate JSON for a structured output demo.",
    "Return exactly one valid JSON object.",
    "Do not include markdown fences, commentary, or extra text.",
    `The JSON object must match this schema example: ${schemaDescription}`,
  ].join("\n");
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch (error) {
    throw new StructuredOutputRouteError({
      code: "INVALID_MODEL_JSON",
      message: "Model output was not valid JSON.",
      statusCode: 422,
      cause: error,
    });
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    throw new StructuredOutputRouteError({
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      statusCode: 400,
      cause: error,
    });
  }
}

function jsonSuccess<T>(input: {
  requestId: string;
  data: T;
}): Response {
  const body: ApiSuccess<T> = {
    ok: true,
    data: input.data,
    requestId: input.requestId,
  };

  return Response.json(body, {
    status: 200,
    headers: {
      "X-Request-Id": input.requestId,
    },
  });
}

function jsonFailure(input: {
  requestId: string;
  status: number;
  code: string;
  message: string;
  details?: unknown;
}): Response {
  const body: ApiFailure = {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      details: input.details,
    },
    requestId: input.requestId,
  };

  return Response.json(body, {
    status: input.status,
    headers: {
      "X-Request-Id": input.requestId,
    },
  });
}

function logStructuredOutputRequest(input: {
  requestId: string;
  startedAt: number;
  model?: string;
  status: "success" | "error";
  errorCode?: string;
  usage?: ModelUsage;
}): void {
  logAiRequest({
    requestId: input.requestId,
    route: "/api/structured-output",
    model: input.model,
    latencyMs: Date.now() - input.startedAt,
    status: input.status,
    errorCode: input.errorCode,
    usage: input.usage,
  });
}

class StructuredOutputRouteError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(input: {
    code: string;
    message: string;
    statusCode: number;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "StructuredOutputRouteError";
    this.code = input.code;
    this.statusCode = input.statusCode;

    if (input.cause !== undefined) {
      this.cause = input.cause;
    }
  }
}
