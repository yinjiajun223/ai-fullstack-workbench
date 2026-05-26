---
name: mcp-server
description: 用于创建或修改 MCP server 代码、MCP tools、MCP resources、MCP prompts，或 MCP 与内部工具之间的 adapter。
---

# MCP Server Skill

## 目标

通过安全的 MCP server 暴露项目能力，同时避免重复业务逻辑。

## 规则

- MCP 代码放在 `src/server/mcp`。
- 尽量复用 `src/server/tools` 中的内部工具。
- MCP 层应该是协议 adapter，不是第二套业务逻辑。
- 定义清晰的工具 schema。
- 校验输入。
- 归一化错误。
- 不暴露 secret。
- 没有明确用户意图或确认时，不暴露破坏性工具。

## 完成前检查

- MCP tools 尽量映射到内部 tools。
- 工具描述清晰。
- 输入 schema 安全。
- 已记录本地测试方式。
