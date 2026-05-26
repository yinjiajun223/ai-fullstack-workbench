import { z } from "zod";
import {
  executeTool,
  listTools,
  ToolNotFoundError,
  ToolValidationError,
} from "@/server/tools";
import { createRequestId, logger } from "@/server/observability";

export const runtime = "nodejs";

const ToolExecutionRequestSchema = z.object({
  toolName: z.string().min(1),
  input: z.unknown(),
});

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

export function GET(request: Request): Response {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();

  return jsonSuccess({
    requestId,
    data: {
      tools: listTools(),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const startedAt = Date.now();
  let toolName: string | undefined;

  try {
    const body = await readJsonBody(request);
    const parsed = ToolExecutionRequestSchema.safeParse(body);

    if (!parsed.success) {
      logToolExecution({
        requestId,
        startedAt,
        toolName,
        status: "error",
        errorCode: "VALIDATION_ERROR",
      });

      return jsonFailure({
        requestId,
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid tool execution request body.",
        details: parsed.error.flatten(),
      });
    }

    toolName = parsed.data.toolName;
    const output = await executeTool({
      toolName,
      rawInput: parsed.data.input,
      context: {
        requestId,
      },
    });

    logToolExecution({
      requestId,
      startedAt,
      toolName,
      status: "success",
    });

    return jsonSuccess({
      requestId,
      data: {
        toolName,
        status: "success",
        output,
      },
    });
  } catch (error) {
    if (error instanceof ToolNotFoundError) {
      logToolExecution({
        requestId,
        startedAt,
        toolName,
        status: "error",
        errorCode: error.code,
      });

      return jsonFailure({
        requestId,
        status: 404,
        code: error.code,
        message: error.message,
      });
    }

    if (error instanceof ToolValidationError) {
      logToolExecution({
        requestId,
        startedAt,
        toolName,
        status: "error",
        errorCode: error.code,
      });

      return jsonFailure({
        requestId,
        status: 400,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    logToolExecution({
      requestId,
      startedAt,
      toolName,
      status: "error",
      errorCode: "TOOL_EXECUTION_ERROR",
    });

    return jsonFailure({
      requestId,
      status: 500,
      code: "TOOL_EXECUTION_ERROR",
      message: "Tool execution failed.",
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

function logToolExecution(input: {
  requestId: string;
  startedAt: number;
  toolName?: string;
  status: "success" | "error";
  errorCode?: string;
}): void {
  logger.info("tool.execution", "Tool execution completed.", {
    requestId: input.requestId,
    toolName: input.toolName,
    status: input.status,
    errorCode: input.errorCode,
    latencyMs: Date.now() - input.startedAt,
  });
}
