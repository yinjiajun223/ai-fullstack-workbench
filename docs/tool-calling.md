# 工具调用

工具调用模块包含两层：

- 内部工具执行层。
- 模型自动选择工具的最小 function calling loop。

## 当前范围

- 工具定义在 `src/server/tools`。
- `GET /api/tools` 返回安全的工具元信息和示例输入。
- `POST /api/tools` 校验输入并执行指定工具。
- `POST /api/tool-calling/chat` 允许模型从 allowlist 中选择工具，再基于工具结果生成最终回答。
- `/tool-calling` 支持手动执行和 AI 自动调用。
- UI 展示 timeline：分析问题、选择工具、执行工具、跳过步骤、确认占位、生成最终回答。

## 已注册工具

- `calculate_cost`：计算小计、折扣、税费和总价。
- `generate_campaign_brief`：根据产品、受众、目标和渠道生成营销 brief。

## 安全规则

- 工具输入必须用 Zod 校验。
- 有输出 schema 时也要校验工具输出。
- 工具执行日志要包含 requestId、toolName、latency、status、errorCode。
- 当前工具都是 compute-only，不需要用户确认。
- 不允许添加任意代码执行、shell 命令、原始 SQL 或破坏性操作。

## 模型自动调用流程

1. 通过 `listAiToolDefinitions` 把工具定义发给模型。
2. 解析模型返回的 `tool_calls`。
3. 只通过 `executeTool` 执行 allowlist 工具。
4. 把工具结果作为 `tool` message 回填给模型。
5. 返回最终回答、工具调用记录、timeline、requestId 和 usage。

## UI Timeline

timeline step 支持这些状态：

- `pending`
- `running`
- `success`
- `error`
- `skipped`
- `requires_confirmation`

每个工具步骤可以展示：

- 工具名
- 输入参数
- 输出结果
- 归一化错误

## 下一步

给模型自动工具调用增加 streaming，让模型选择工具、工具执行完成、最终回答生成这些步骤可以实时更新。
