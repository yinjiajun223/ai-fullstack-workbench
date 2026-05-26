---
name: evals
description: 用于新增或改进 AI 评估数据集、回归测试、RAG faithful 检查、tool-calling 正确性检查或 prompt 质量度量脚本。
---

# Evals Skill

## 目标

为 AI 行为添加可重复执行的质量检查。

## Eval case 应包含

- id
- category
- input
- expected behavior
- scoring notes
- allowed variability

## RAG evals 应检查

- retrieval relevance
- faithfulness
- citation correctness
- 信息缺失时是否拒答或说明找不到

## Tool-calling evals 应检查

- 是否选择正确工具。
- 参数是否正确。
- 是否避免不安全工具调用。
- 最终回答是否使用工具结果。

## 完成前检查

- Eval 数据放在 `tests/evals` 或 `src/server/evals`。
- 有脚本或命令可以运行 eval。
- 失败输出可读。
- README 或 docs 说明了运行方式。
