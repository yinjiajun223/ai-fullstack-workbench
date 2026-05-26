# AI 调用流程

所有 AI 请求都必须走服务端模块，前端不能直接调用模型供应商。

## 标准流程

1. 使用 Zod 校验请求输入。
2. 创建或透传 `requestId`。
3. 选择模型和 prompt 版本。
4. 通过 `getAiConfig` 读取 AI 环境变量。
5. 通过 `createAiProvider` 创建 provider adapter。
6. 普通回答调用 `provider.chat`，流式回答调用 `provider.streamChat`，向量化调用 `provider.embed`。
7. 归一化错误和 token usage。
8. 通过 `src/server/observability` 记录日志。
9. 返回统一 JSON 或 SSE stream。

## Provider Adapter

当前第一版 provider 是 OpenAI-compatible，调用标准 `/chat/completions` 和 `/embeddings` endpoint。阿里云 DashScope compatible mode 也走同一个 adapter。

共享类型：

- `ChatMessage`：统一消息格式。
- `ModelUsage`：统一 token usage。
- `AiProvider`：统一 provider 接口。
- `EmbeddingRequest`：统一 embedding 请求。
- `EmbeddingResult`：统一 embedding 返回值。
- `AiToolDefinition`：模型工具定义。
- `AiToolCall`：模型返回的工具调用。

## RAG 流程

当前 RAG 已经使用 embedding + 内存向量库：

1. 用户在 `/rag` 粘贴文本。
2. 浏览器向 `POST /api/rag/ingest` 提交文档。
3. Route 将文档切成 chunk。
4. Route 调用 `embedTexts`，使用 `AI_EMBEDDING_MODEL` 生成 chunk vectors。
5. Route 将 document、chunks 和 vectors 写入内存 store。
6. 用户输入问题。
7. 浏览器向 `POST /api/rag/query` 提交问题。
8. Route 对问题做 embedding。
9. Route 用 cosine similarity 在内存向量库里检索 topK chunks。
10. Route 将检索片段发给模型生成引用回答。
11. UI 展示回答、引用数量、token usage 和检索片段。

当前 vector store 仍是内存实现，下一步替换为 Qdrant。

## Chat 流程

`/chat` 页面由服务端 `/api/chat` 支撑。

1. `ChatShell` 从 `GET /api/chat/models` 加载可选模型名。
2. 用户选择模型并通过 `ChatInput` 提交消息。
3. 前端追加用户消息和临时 assistant 消息。
4. 浏览器调用 `/api/chat`，请求体包含 `{ messages, model, stream: true }`。
5. API Route 在服务端读取 AI 配置并返回 `text/event-stream`。
6. 前端解析 `content`、`usage`、`error`、`done` 事件。
7. 内容 chunk 到达时逐步追加到 assistant 消息。
8. 有 usage 和 requestId 时展示到请求信息面板。
9. 用户点击停止时通过 `AbortController` 中断请求。
10. 重新生成会重放上一轮消息。

## 工具调用流程

模型不会直接执行工具，只能提出 tool call。服务端校验并执行 allowlist 工具。

1. 用户向 `POST /api/tool-calling/chat` 提交自然语言问题。
2. Route 把 allowlist 工具定义发给模型。
3. 模型返回 `tool_calls`。
4. 服务端通过 `executeTool` 校验并执行工具。
5. 工具结果作为 `tool` message 回填给模型。
6. Route 再次调用模型生成最终回答。
7. UI 展示 timeline、工具参数、工具结果和最终回答。

## 安全规则

- 不允许在客户端读取或暴露模型 API key。
- 不允许把 provider secret 写成 `NEXT_PUBLIC_`。
- 用户输入、检索文档、模型输出都视为不可信。
- 可复用 prompt 后续应放到 `src/server/ai/prompts`。
