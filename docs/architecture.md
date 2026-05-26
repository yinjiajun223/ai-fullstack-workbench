# 架构说明

这个项目是一个面向生产实践的 AI 全栈学习工作台，技术栈以 Next.js App Router、React、TypeScript、Tailwind CSS 为主。

## 分层

- `src/app`：页面和 API Route。
- `src/components`：前端组件，按业务模块拆分。
- `src/server/ai`：AI Provider 抽象、模型调用、embedding、流式解析、结构化输出 schema。
- `src/server/tools`：模型可调用的内部工具、工具注册表、工具执行边界。
- `src/server/rag`：文档摄入、切片、embedding、向量存储、检索、回答生成和引用。
- `src/server/mcp`：MCP 协议适配层，后续复用内部工具。
- `src/server/evals`：评测脚本和评分逻辑。
- `src/server/observability`：requestId、日志、AI 请求记录、后续数据库落库边界。

## 原则

- 密钥只能留在服务端。
- API 边界必须做 Zod 校验。
- 模型调用必须经过 `src/server/ai`。
- 工具调用必须经过 `src/server/tools`。
- RAG 各阶段要保持可替换：chunking、embedding、vector store、retrieval、generation 分层。
- 数据库、队列、向量库、worker 只在模块需要时引入。

## AI Provider

`AiProvider` 当前支持：

- `chat`：普通 chat completion。
- `streamChat`：流式 chat completion。
- `embed`：embedding 生成。

OpenAI-compatible provider 会调用：

- `/chat/completions`
- `/embeddings`

## RAG

当前 RAG 已经有向量检索预备版：

- `src/server/rag/chunking`：文本切片。
- `src/server/rag/embedding`：embedding provider 边界。
- `src/server/rag/vector-store`：当前是内存向量库。
- `src/server/rag/retrieval`：保留关键词检索作为教学/备用实现。
- `src/server/rag/generation`：基于检索片段生成引用回答。
- `src/app/api/rag/ingest/route.ts`：摄入文档、切片、embedding、写入向量库。
- `src/app/api/rag/query/route.ts`：问题 embedding、向量检索、生成回答。
- `src/components/rag/RagShell.tsx`：摄入、提问、回答、引用和检索调试 UI。

下一步应把内存向量库替换为 Qdrant。

## Tool Calling

工具调用模块包含：

- `src/server/tools/types.ts`：内部 `AppTool` 契约。
- `src/server/tools/registry.ts`：工具注册和统一执行。
- `src/app/api/tools/route.ts`：手动工具执行 API。
- `src/app/api/tool-calling/chat/route.ts`：模型自动选择工具的 API。
- `src/components/tools/ToolCallingShell.tsx`：工具选择、输入、状态、timeline 和输出。

模型不会直接执行工具。模型只提出 tool call，服务端校验并执行 allowlist 工具。

## 可观测性

当前可观测性模块是第一版：

- `createRequestId` 生成可追踪请求 ID。
- `createLogger` 通过 `LoggerSink` 写结构化日志。
- `logger` 是默认 console logger。
- `logAiRequest` 记录 AI 请求的模型、延迟、状态、错误码和 token usage。

后续接数据库时，可以扩展 logger sink，而不是改每个 route。
