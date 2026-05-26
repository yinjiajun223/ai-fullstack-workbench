# Tool Calling

The first tool-calling milestone implements an internal tool execution layer and a minimal model-driven function-calling loop.

## Current Scope

- Tools live under `src/server/tools`.
- `GET /api/tools` returns safe tool metadata and example input.
- `POST /api/tools` validates input and executes one selected tool.
- `POST /api/tool-calling/chat` lets the model choose allowlisted tools, then generates a final answer from tool results.
- `/tool-calling` supports manual execution and AI automatic tool calling.
- The UI renders a timeline for analysis, tool selection, tool execution, skipped steps, confirmation placeholders, and final answer generation.

## Registered Tools

- `calculate_cost`: computes subtotal, discount, tax, and total.
- `generate_campaign_brief`: creates a deterministic campaign brief from product, audience, goal, and channels.

## Safety Rules

- Tool inputs are validated with Zod.
- Tool output is validated when an output schema exists.
- Tool execution logs request id, tool name, latency, status, and error code.
- Current tools are compute-only and do not require confirmation.
- Do not add tools that execute arbitrary code, shell commands, raw SQL, or destructive actions.

## Model-Driven Flow

1. Send tool definitions from `listAiToolDefinitions` to the model.
2. Detect model-requested `tool_calls`.
3. Validate and execute allowlisted tools through `executeTool`.
4. Feed tool results back to the model as `tool` messages.
5. Return final answer, tool call records, timeline, request id, and usage.

## UI Timeline

Timeline step status values:

- `pending`
- `running`
- `success`
- `error`
- `skipped`
- `requires_confirmation`

Each tool step can show the tool name, input arguments, output, and normalized error.

## Next Step

Add streaming for model-selected tool calling so timeline steps can update as soon as the model selects a tool and as soon as the server finishes executing it.
