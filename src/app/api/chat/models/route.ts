import { getAiConfig } from "@/server/ai";
import { createRequestId } from "@/server/observability";

export const runtime = "nodejs";

type ChatModelOption = {
  id: string;
  label: string;
  role: "chat" | "fast" | "reasoning";
};

export function GET(request: Request): Response {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();

  try {
    const config = getAiConfig();
    const options = uniqueModelOptions([
      {
        id: config.chatModel,
        label: "通用模型",
        role: "chat",
      },
      {
        id: config.fastModel,
        label: "快速模型",
        role: "fast",
      },
      {
        id: config.reasoningModel,
        label: "推理模型",
        role: "reasoning",
      },
    ]);

    return Response.json(
      {
        ok: true,
        data: {
          defaultModel: config.chatModel,
          options,
        },
        requestId,
      },
      {
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "AI_CONFIG_ERROR",
          message: "Chat model configuration is invalid.",
        },
        requestId,
      },
      {
        status: 500,
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  }
}

function uniqueModelOptions(options: ChatModelOption[]): ChatModelOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (!option.id) {
      return false;
    }

    if (seen.has(option.id)) {
      return false;
    }

    seen.add(option.id);
    return true;
  });
}
