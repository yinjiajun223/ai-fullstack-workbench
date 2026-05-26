# API Contracts

API routes should use typed success and failure shapes.

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};
```

## Rules

- Validate request bodies with Zod.
- Do not leak stack traces, SQL errors, or provider secrets.
- Log unexpected errors with request id.
- Never expose `AI_API_KEY` or other non-public provider settings to client components.

## Chat API

`POST /api/chat`

Request body:

```json
{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "model": "optional-model-name",
  "stream": true
}
```

Rules:

- `messages` is required and must contain at least one message.
- `role` must be `system`, `user`, `assistant`, or `tool`.
- `model` is optional. When omitted, the server uses `AI_CHAT_MODEL`.
- `stream` defaults to `false`.
- The route creates or propagates `requestId` through the `X-Request-Id` response header.
- The route calls `src/server/ai` provider adapters only.
- `AI_API_KEY` is read server-side through AI config and is never exposed to the frontend.

Non-streaming success:

```json
{
  "ok": true,
  "data": {
    "message": {
      "role": "assistant",
      "content": "..."
    },
    "model": "model-name",
    "usage": {
      "inputTokens": 10,
      "outputTokens": 20,
      "totalTokens": 30
    }
  },
  "requestId": "..."
}
```

Streaming success uses `text/event-stream` with these event names:

- `content`
- `usage`
- `error`
- `done`

## Chat Models API

`GET /api/chat/models`

Returns model names configured on the server for the chat UI model selector.

Success response:

```json
{
  "ok": true,
  "data": {
    "defaultModel": "qwen-plus",
    "options": [
      { "id": "qwen-plus", "label": "通用模型", "role": "chat" },
      { "id": "qwen-turbo", "label": "快速模型", "role": "fast" },
      { "id": "qwen-max", "label": "推理模型", "role": "reasoning" }
    ]
  },
  "requestId": "..."
}
```

This route only returns model identifiers and labels. It must never return provider secrets.

## Tools API

`GET /api/tools`

Returns safe metadata for registered backend tools.

Success response:

```json
{
  "ok": true,
  "data": {
    "tools": [
      {
        "name": "calculate_cost",
        "description": "Calculate subtotal, discount, tax, and total for a simple pricing scenario.",
        "permissionLevel": "compute",
        "requiresConfirmation": false,
        "inputExample": {
          "quantity": 12,
          "unitPrice": 39.9,
          "discountRate": 0.1,
          "taxRate": 0.06,
          "currency": "CNY"
        }
      }
    ]
  },
  "requestId": "..."
}
```

`POST /api/tools`

Executes one registered backend tool.

Request body:

```json
{
  "toolName": "calculate_cost",
  "input": {
    "quantity": 12,
    "unitPrice": 39.9,
    "discountRate": 0.1,
    "taxRate": 0.06,
    "currency": "CNY"
  }
}
```

Success response:

```json
{
  "ok": true,
  "data": {
    "toolName": "calculate_cost",
    "status": "success",
    "output": {
      "quantity": 12,
      "unitPrice": 39.9,
      "subtotal": 478.8,
      "discount": 47.88,
      "tax": 25.86,
      "total": 456.78,
      "currency": "CNY"
    }
  },
  "requestId": "..."
}
```

Rules:

- Tools must be registered under `src/server/tools`.
- Tool input is validated with each tool's Zod schema.
- Tool execution logs include request id, tool name, latency, status, and error code.
- Tools must not execute arbitrary code, raw SQL, shell commands, or destructive actions.

## Tool-Calling Chat API

`POST /api/tool-calling/chat`

Lets the model choose from allowlisted backend tools, executes requested tools on the server, then asks the model to produce a final answer from tool results.

Request body:

```json
{
  "prompt": "帮我计算 12 件商品，单价 39.9 元，9 折并加 6% 税后的总价。",
  "model": "optional-model-name"
}
```

Success response:

```json
{
  "ok": true,
  "data": {
    "answer": "最终回答",
    "model": "qwen-plus",
    "usage": {
      "inputTokens": 100,
      "outputTokens": 60,
      "totalTokens": 160
    },
    "toolCalls": [
      {
        "id": "call_abc",
        "name": "calculate_cost",
        "arguments": {
          "quantity": 12,
          "unitPrice": 39.9,
          "discountRate": 0.1,
          "taxRate": 0.06
        },
        "status": "success",
        "output": {
          "total": 456.78,
          "currency": "CNY"
        }
      }
    ],
    "timeline": [
      {
        "id": "analyze",
        "title": "分析用户问题",
        "status": "success",
        "description": "模型已读取用户问题并判断是否需要工具。"
      },
      {
        "id": "tool-1",
        "title": "执行工具",
        "status": "success",
        "toolName": "calculate_cost",
        "input": {
          "quantity": 12,
          "unitPrice": 39.9
        },
        "output": {
          "total": 456.78,
          "currency": "CNY"
        }
      }
    ]
  },
  "requestId": "..."
}
```

Rules:

- The model only receives tool definitions from `listAiToolDefinitions`.
- The server executes only registered tools through `executeTool`.
- Tool calls are capped per request to keep execution bounded.
- Tool outputs are sent back to the model as tool messages; raw secrets are never included.
- `timeline` uses the status values `pending`, `running`, `success`, `error`, `skipped`, and `requires_confirmation`.

## Structured Output API

`POST /api/structured-output`

Request body:

```json
{
  "useCase": "marketing",
  "input": "为一款 AI 海报工具生成营销内容结构",
  "model": "optional-model-name"
}
```

Allowed `useCase` values:

- `marketing`
- `entities`
- `intent`
- `task-plan`
- `ui-schema`

Success response:

```json
{
  "ok": true,
  "data": {
    "output": {},
    "rawText": "{}",
    "model": "model-name",
    "usage": {
      "inputTokens": 10,
      "outputTokens": 20,
      "totalTokens": 30
    }
  },
  "requestId": "..."
}
```

The route validates both the request body and the model-generated JSON. Invalid model JSON returns `INVALID_MODEL_JSON`; schema mismatch returns `STRUCTURED_OUTPUT_VALIDATION_ERROR`.
