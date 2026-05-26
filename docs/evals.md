# Evals

评测数据和脚本应放在 `tests/evals` 或 `src/server/evals`。

## 覆盖范围

- Chat 回答质量。
- 结构化输出正确性。
- 工具选择正确性。
- 工具参数正确性。
- RAG 检索相关性。
- RAG 忠实度和引用正确性。
- 延迟和成本检查。

## 用例格式

每条 eval case 建议包含：

- `id`
- `category`
- `input`
- `expectedBehavior`
- `scoringNotes`
- `allowedVariability`

## 下一步

当前只有 smoke test。后续应新增：

- `tests/evals/chat.jsonl`
- `tests/evals/tool-calling.jsonl`
- `tests/evals/rag.jsonl`
- `scripts/eval-chat.ts`
- `scripts/eval-rag.ts`
