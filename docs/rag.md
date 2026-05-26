# RAG 知识库

当前 RAG 已升级为 embedding + 内存向量库的预备版：文本摄入、切片、向量化、内存向量检索、引用回答生成和检索调试 UI。

## 当前范围

- `POST /api/rag/ingest` 摄入粘贴文本、切片、调用 embedding model，并写入内存向量库。
- `POST /api/rag/query` 对问题做 embedding，用 cosine similarity 检索 topK chunks，并通过服务端 AI provider 生成引用回答。
- `/rag` 提供文档摄入、提问、回答、引用数量、usage 和检索片段预览。
- 当前 vector store 是内存版，服务重启后数据会丢失。

## 当前流程

1. Loading：用户在 `/rag` 粘贴文本。
2. Parsing：第一版只处理纯文本。
3. Chunking：`src/server/rag/chunking/simple.ts` 生成重叠 chunk。
4. Embedding：`src/server/rag/embedding/provider.ts` 调用 `AI_EMBEDDING_MODEL`。
5. Vector Storage：`src/server/rag/vector-store/memory.ts` 将 chunk 向量存在内存中。
6. Retrieval：query 先做 embedding，再通过 cosine similarity 检索 topK chunks。
7. Generation：`src/server/rag/generation/answer.ts` 要求模型只基于检索片段回答。
8. Citation：query response 返回 citations 和 retrievedChunks。
9. Evaluation：当前只有 smoke test，向量检索策略变化后需要补真实 eval。

## Chunk 元数据

每个 chunk 包含：

- document id
- chunk id
- chunk index
- source name
- text
- metadata 中的文本偏移

## 当前限制

- 向量库仍是内存实现。
- 还没有接 Qdrant。
- 还没有 PDF、Word、网页解析。
- 还没有 reranking。
- 还没有持久化文档和 chunk。

## 下一步

把内存向量库替换为 Qdrant：

1. 新增 Qdrant adapter。
2. 使用 `QDRANT_URL`、`QDRANT_API_KEY`、`QDRANT_COLLECTION`。
3. ingest 时把 chunk vector 写入 Qdrant。
4. query 时用 query vector 搜 Qdrant。
5. 保留现有 API 和 UI 调试能力。
