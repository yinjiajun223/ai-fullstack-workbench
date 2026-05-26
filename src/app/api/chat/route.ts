import { z } from "zod";
import {
  createAiProvider,
  getAiConfig,
  normalizeAiProviderError,
  type ChatMessage,
  type ModelUsage,
} from "@/server/ai";
import { createRequestId, logAiRequest } from "@/server/observability";

export const runtime = "nodejs";

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1),
  name: z.string().min(1).optional(),
  toolCallId: z.string().min(1).optional(),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().min(1).optional(),
  stream: z.boolean().optional().default(false),
});

type ChatRequestBody = z.infer<typeof ChatRequestSchema>;

type ChatResponseData = {
  message: {
    role: "assistant";
    content: string;
  };
  model?: string;
  usage?: ModelUsage;
};

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

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const startedAt = Date.now();
  let model: string | undefined;

  try {
    const body = await readJsonBody(request);
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      logChatRequest({
        requestId,
        startedAt,
        status: "error",
        errorCode: "VALIDATION_ERROR",
      });

      return jsonFailure({
        requestId,
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid chat request body.",
        details: parsed.error.flatten(),
      });
    }

    const config = getAiConfig();
    model = parsed.data.model ?? config.chatModel;
    const provider = createAiProvider({ config });

    if (parsed.data.stream) {
      return createStreamingChatResponse({
        requestId,
        startedAt,
        model,
        body: parsed.data,
        provider,
      });
    }

    const result = await provider.chat({
      messages: parsed.data.messages,
      model: parsed.data.model,
    });

    logChatRequest({
      requestId,
      startedAt,
      model: result.model ?? model,
      status: "success",
      usage: result.usage,
    });

    return jsonSuccess<ChatResponseData>({
      requestId,
      data: {
        message: {
          role: "assistant",
          content: result.content,
        },
        model: result.model ?? model,
        usage: result.usage,
      },
    });
  } catch (error) {
    if (error instanceof ChatRouteError) {
      logChatRequest({
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

    logChatRequest({
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

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    throw new ChatRouteError({
      code: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      statusCode: 400,
      cause: error,
    });
  }
}

function createStreamingChatResponse(input: {
  requestId: string;
  startedAt: number;
  model: string;
  body: ChatRequestBody;
  provider: {
    streamChat: (request: { messages: ChatMessage[]; model?: string }) => AsyncIterable<
      | { type: "content"; content: string }
      | { type: "usage"; usage: ModelUsage }
      | { type: "error"; error: { code: string; message: string } }
      | { type: "done" }
    >;
  };
}): Response {
  const encoder = new TextEncoder();
  let completed = false;
  let usage: ModelUsage | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const chunk of input.provider.streamChat({
          messages: input.body.messages,
          model: input.body.model,
        })) {
          if (chunk.type === "content") {
            send("content", { content: chunk.content, requestId: input.requestId });
          }

          if (chunk.type === "usage") {
            usage = chunk.usage;
            send("usage", { usage: chunk.usage, requestId: input.requestId });
          }

          if (chunk.type === "error") {
            send("error", {
              error: {
                code: chunk.error.code,
                message: chunk.error.message,
              },
              requestId: input.requestId,
            });
            logChatRequest({
              requestId: input.requestId,
              startedAt: input.startedAt,
              model: input.model,
              status: "error",
              errorCode: chunk.error.code,
              usage,
            });
            return;
          }

          if (chunk.type === "done") {
            completed = true;
            send("done", { requestId: input.requestId });
          }
        }

        if (!completed) {
          send("done", { requestId: input.requestId });
        }

        logChatRequest({
          requestId: input.requestId,
          startedAt: input.startedAt,
          model: input.model,
          status: "success",
          usage,
        });
      } catch (error) {
        const normalizedError = normalizeAiProviderError(error);

        send("error", {
          error: {
            code: normalizedError.code,
            message: normalizedError.message,
          },
          requestId: input.requestId,
        });
        logChatRequest({
          requestId: input.requestId,
          startedAt: input.startedAt,
          model: input.model,
          status: "error",
          errorCode: normalizedError.code,
          usage,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      "X-Request-Id": input.requestId,
    },
  });
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

function logChatRequest(input: {
  requestId: string;
  startedAt: number;
  model?: string;
  status: "success" | "error";
  errorCode?: string;
  usage?: ModelUsage;
}): void {
  logAiRequest({
    requestId: input.requestId,
    route: "/api/chat",
    model: input.model,
    latencyMs: Date.now() - input.startedAt,
    status: input.status,
    errorCode: input.errorCode,
    usage: input.usage,
  });
}

class ChatRouteError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(input: {
    code: string;
    message: string;
    statusCode: number;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "ChatRouteError";
    this.code = input.code;
    this.statusCode = input.statusCode;

    if (input.cause !== undefined) {
      this.cause = input.cause;
    }
  }
}
