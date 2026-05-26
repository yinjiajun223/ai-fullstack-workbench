---
name: tool-calling
description: 用于新增、修改或调试模型可调用工具、function calling 流程、工具 schema、工具执行器或前端工具调用状态展示。
---

# Tool Calling Skill

## 目标

实现安全、可观测、可测试的模型可调用工具。

## 工具定义必须包含

- 稳定的工具名。
- 清晰的工具描述。
- Zod 输入 schema。
- 输出结构，能定义 schema 时应定义。
- 权限级别。
- 高风险操作是否需要用户确认。
- 执行 handler。
- 有意义时添加测试或示例。

## 工具执行必须做到

- 校验输入。
- 记录 request id 和 tool name。
- 处理可预期错误。
- 避免任意代码执行。
- 避免执行模型生成的原始 SQL。
- 不暴露 secret。

## 前端展示必须包含

- pending 状态。
- running 状态。
- success 状态。
- error 状态。
- 需要确认时展示 confirmation 状态。

## 完成前检查

- 工具已注册到中心 registry。
- 工具 schema 有类型。
- 工具执行可观测。
- 如果用户可见，UI 能展示工具调用进度。
