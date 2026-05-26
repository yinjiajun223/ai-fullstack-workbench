# MCP

MCP code lives under `src/server/mcp`.

## Design

- Treat MCP as a protocol adapter.
- Reuse tools from `src/server/tools` where possible.
- Keep MCP transport and schemas separate from user-facing API routes.
- Normalize errors and avoid exposing secrets.

## Candidate Tools

- `get_product_info`
- `search_campaign_templates`
- `generate_poster_brief`
- `query_knowledge_base`
- `create_content_plan`
