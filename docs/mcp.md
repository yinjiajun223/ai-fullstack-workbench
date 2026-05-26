# MCP

MCP 相关代码放在 `src/server/mcp`。

## 设计原则

- MCP 是协议适配层，不是第二套业务逻辑。
- MCP tool 应尽量复用 `src/server/tools` 中的内部工具。
- MCP transport、schema、resources 和普通用户 API Route 分开。
- 错误要归一化。
- 不暴露密钥。
- 不提供任意 shell、任意 SQL 或破坏性工具。

## 候选 MCP Tools

- `get_product_info`
- `search_campaign_templates`
- `generate_poster_brief`
- `query_knowledge_base`
- `create_content_plan`

## 下一步

在工具调用和 RAG 稳定后，实现本地 MCP server：

- `src/server/mcp/server.ts`
- `src/server/mcp/tools.ts`
- `src/server/mcp/resources.ts`
- `src/server/mcp/prompts.ts`
- `src/server/mcp/adapters.ts`
