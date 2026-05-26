# API 契约

所有 API Route 都应该使用统一成功/失败结构。

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

## 通用规则

- 请求体必须用 Zod 校验。
- 不返回 stack trace、SQL 错误、provider secret。
- 意外错误必须带 requestId 记录日志。
- 前端组件不能读取或暴露 `AI_API_KEY`。

## Chat API

`POST /api/chat`

请求体：

```json
{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "model": "optional-model-name",
  "stream": true
}
```

流式响应使用 `text/event-stream`，事件名：

- `content`
- `usage`
- `error`
- `done`

## Chat Models API

`GET /api/chat/models`

返回服务端配置的模型名，供前端模型选择器使用。

## Tools API

`GET /api/tools`

返回已注册后端工具的安全元信息。

`POST /api/tools`

执行一个已注册工具。

请求体：

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

规则：

- 工具必须注册在 `src/server/tools`。
- 每个工具用自己的 Zod schema 校验输入。
- 工具不能执行任意代码、原始 SQL、shell 命令或破坏性操作。

## Tool-Calling Chat API

`POST /api/tool-calling/chat`

让模型从 allowlist 中选择工具，服务端执行工具，再让模型基于工具结果生成最终回答。

请求体：

```json
{
  "prompt": "帮我计算 12 件商品，单价 39.9 元，9 折并加 6% 税后的总价。",
  "model": "optional-model-name"
}
```

成功响应包含：

- `answer`：最终回答。
- `model`：实际模型。
- `usage`：token 用量。
- `toolCalls`：工具调用记录。
- `timeline`：前端展示流程用的步骤列表。

## Structured Output API

`POST /api/structured-output`

请求体：

```json
{
  "useCase": "marketing",
  "input": "为一款 AI 海报工具生成营销内容结构",
  "model": "optional-model-name"
}
```

允许的 `useCase`：

- `marketing`
- `entities`
- `intent`
- `task-plan`
- `ui-schema`

## RAG Ingest API

`POST /api/rag/ingest`

摄入文档、切片、生成 chunk embeddings，并写入内存向量库。

请求体：

```json
{
  "sourceName": "产品说明文档",
  "text": "至少 20 个字符的知识库文本",
  "metadata": {
    "category": "demo"
  }
}
```

成功响应包含：

- `document`：文档记录。
- `chunks`：切片结果。
- `embedding`：embedding 模型和 usage。
- `requestId`：请求 ID。

## RAG Query API

`POST /api/rag/query`

对问题做 embedding，通过向量相似度检索 topK chunks，并生成引用回答。

请求体：

```json
{
  "question": "这个产品适合哪些用户？",
  "topK": 4,
  "model": "optional-model-name"
}
```

成功响应包含：

- `answer`：基于知识库的回答。
- `citations`：引用来源。
- `retrievedChunks`：检索片段，供调试 UI 展示。
- `embedding`：query embedding 的模型和 usage。
- `model`：生成回答使用的模型。
- `usage`：embedding + answer generation 的合并 token 用量。

规则：

- 回答生成只发生在服务端。
- 检索片段会返回给前端用于调试。
- 如果没有相关片段，应返回“知识库中没有找到答案”，不能编造。
