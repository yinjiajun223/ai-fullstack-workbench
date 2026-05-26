import { z } from "zod";
import {
  createAiProvider,
  getAiConfig,
  normalizeAiProviderError,
  type AiToolCall,
  type ChatMessage,
  type ModelUsage,
} from "@/server/ai";
import { createRequestId, logger } from "@/server/observability";
import { executeTool, listAiToolDefinitions, ToolNotFoundError, ToolValidationError } from "@/server/tools";

export const runtime = "nodejs";

const ToolCallingChatRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().min(1).optional(),
});

type ToolCallRecord = {
  id: string;
  name: string;
  arguments: unknown;
  status: "success" | "error";
  output?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ToolTimelineStep = {
  id: string;
  title: string;
  status: "pending" | "running" | "success" | "error" | "skipped" | "requires_confirmation";
  description?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ToolCallingChatData = {
  answer: string;
  model?: string;
  usage?: ModelUsage;
  toolCalls: ToolCallRecord[];
  timeline: ToolTimelineStep[];
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
  let toolCalls: ToolCallRecord[] = [];

  try {
    const body = await readJsonBody(request);
    const parsed = ToolCallingChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      logToolCallingChat({
        requestId,
        startedAt,
        model,
        status: "error",
        errorCode: "VALIDATION_ERROR",
        toolCalls,
      });

      return jsonFailure({
        requestId,
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid tool-calling chat request body.",
        details: parsed.error.flatten(),
      });
    }

    const config = getAiConfig();
    model = parsed.data.model ?? config.chatModel;
    const provider = createAiProvider({ config });
    const initialMessages = buildInitialMessages(parsed.data.prompt);
    const firstResult = await provider.chat({
      messages: initialMessages,
      model,
      tools: listAiToolDefinitions(),
      toolChoice: "auto",
    });
    const requestedToolCalls = firstResult.toolCalls ?? [];

    if (requestedToolCalls.length === 0) {
      logToolCallingChat({
        requestId,
        startedAt,
        model: firstResult.model ?? model,
        status: "success",
        usage: firstResult.usage,
        toolCalls,
      });

      return jsonSuccess<ToolCallingChatData>({
        requestId,
        data: {
          answer: firstResult.content,
          model: firstResult.model ?? model,
          usage: firstResult.usage,
          toolCalls,
          timeline: buildTimeline({
            toolCalls,
            hasFinalAnswer: true,
          }),
        },
      });
    }

    const limitedToolCalls = requestedToolCalls.slice(0, 3);

    toolCalls = await executeRequestedToolCalls({
      requestId,
      toolCalls: limitedToolCalls,
    });

    const finalResult = await provider.chat({
      messages: [
        ...initialMessages,
        {
          role: "assistant",
          content: firstResult.content,
          toolCalls: limitedToolCalls,
        },
        ...toolCalls.map(toToolResultMessage),
      ],
      model,
    });
    const usage = mergeUsage(firstResult.usage, finalResult.usage);

    logToolCallingChat({
      requestId,
      startedAt,
      model: finalResult.model ?? firstResult.model ?? model,
      status: "success",
      usage,
      toolCalls,
    });

    return jsonSuccess<ToolCallingChatData>({
      requestId,
      data: {
        answer: finalResult.content,
        model: finalResult.model ?? firstResult.model ?? model,
        usage,
        toolCalls,
        timeline: buildTimeline({
          toolCalls,
          hasFinalAnswer: true,
        }),
      },
    });
  } catch (error) {
    const normalizedError = normalizeAiProviderError(error);

    logToolCallingChat({
      requestId,
      startedAt,
      model,
      status: "error",
      errorCode: normalizedError.code,
      toolCalls,
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
  } catch {
    return {};
  }
}

function buildInitialMessages(prompt: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a safe tool-calling assistant. Use the provided tools only when they are clearly useful. Do not invent tool results. Explain final answers in Chinese.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}

async function executeRequestedToolCalls(input: {
  requestId: string;
  toolCalls: AiToolCall[];
}): Promise<ToolCallRecord[]> {
  const records: ToolCallRecord[] = [];

  for (const toolCall of input.toolCalls) {
    const args = parseToolArguments(toolCall.function.arguments);

    try {
      const output = await executeTool({
        toolName: toolCall.function.name,
        rawInput: args,
        context: {
          requestId: input.requestId,
        },
      });

      records.push({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: args,
        status: "success",
        output,
      });
    } catch (error) {
      records.push({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: args,
        status: "error",
        error: normalizeToolExecutionError(error),
      });
    }
  }

  return records;
}

function parseToolArguments(rawArguments: string): unknown {
  try {
    return JSON.parse(rawArguments || "{}");
  } catch {
    return {};
  }
}

function normalizeToolExecutionError(error: unknown): ToolCallRecord["error"] {
  if (error instanceof ToolNotFoundError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof ToolValidationError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  return {
    code: "TOOL_EXECUTION_ERROR",
    message: "Tool execution failed.",
  };
}

function toToolResultMessage(record: ToolCallRecord): ChatMessage {
  return {
    role: "tool",
    toolCallId: record.id,
    content: JSON.stringify({
      ok: record.status === "success",
      output: record.output,
      error: record.error,
    }),
  };
}

function buildTimeline(input: {
  toolCalls: ToolCallRecord[];
  hasFinalAnswer: boolean;
}): ToolTimelineStep[] {
  const steps: ToolTimelineStep[] = [
    {
      id: "analyze",
      title: "分析用户问题",
      status: "success",
      description: "模型已读取用户问题并判断是否需要工具。",
    },
  ];

  if (input.toolCalls.length === 0) {
    steps.push({
      id: "select-tool",
      title: "选择工具",
      status: "skipped",
      description: "模型判断无需调用工具，直接生成回答。",
    });
  } else {
    steps.push({
      id: "select-tool",
      title: "选择工具",
      status: "success",
      description: `模型选择了 ${input.toolCalls.length} 个工具调用。`,
    });

    input.toolCalls.forEach((toolCall, index) => {
      steps.push({
        id: `tool-${index + 1}`,
        title: "执行工具",
        status: toolCall.status,
        description: toolCall.status === "success" ? "工具执行完成。" : "工具执行失败。",
        toolName: toolCall.name,
        input: toolCall.arguments,
        output: toolCall.output,
        error: toolCall.error,
      });
    });
  }

  steps.push({
    id: "final-answer",
    title: "生成最终回答",
    status: input.hasFinalAnswer ? "success" : "pending",
    description: input.hasFinalAnswer ? "模型已基于工具结果生成最终回答。" : "等待模型生成最终回答。",
  });

  return steps;
}

function mergeUsage(first: ModelUsage | undefined, second: ModelUsage | undefined): ModelUsage | undefined {
  if (!first && !second) {
    return undefined;
  }

  return {
    inputTokens: (first?.inputTokens ?? 0) + (second?.inputTokens ?? 0),
    outputTokens: (first?.outputTokens ?? 0) + (second?.outputTokens ?? 0),
    totalTokens: (first?.totalTokens ?? 0) + (second?.totalTokens ?? 0),
  };
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

function logToolCallingChat(input: {
  requestId: string;
  startedAt: number;
  model?: string;
  status: "success" | "error";
  errorCode?: string;
  usage?: ModelUsage;
  toolCalls: ToolCallRecord[];
}): void {
  logger.info("tool_calling.chat", "Tool-calling chat completed.", {
    requestId: input.requestId,
    model: input.model,
    status: input.status,
    errorCode: input.errorCode,
    latencyMs: Date.now() - input.startedAt,
    usage: input.usage,
    toolCalls: input.toolCalls.map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.name,
      status: toolCall.status,
      errorCode: toolCall.error?.code,
    })),
  });
}
