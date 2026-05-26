# Architecture

This project is a production-oriented AI full-stack workbench built with Next.js App Router and TypeScript.

## Layers

- `src/app`: user-facing pages and route handlers.
- `src/server/ai`: model provider abstraction, prompts, schemas, streaming helpers, and cost logic.
- `src/server/tools`: model-callable internal tools and their registry.
- `src/server/rag`: document ingestion, chunking, embedding, vector storage, retrieval, generation, and citations.
- `src/server/mcp`: MCP protocol adapters that reuse internal tools.
- `src/server/evals`: evaluation runners and scoring helpers.
- `src/server/observability`: request ids, structured logger, AI request logs, latency, token usage, and future persistence sinks.
- `src/server/ai/schemas`: reusable Zod schemas for structured AI outputs.

## Principles

- Keep secrets server-side.
- Validate inputs at boundaries.
- Keep AI provider code behind adapters.
- Introduce database, queue, vector store, and worker complexity only when a module needs it.

## Observability

The observability module is intentionally small for the first milestone:

- `createRequestId` creates traceable request ids.
- `createLogger` writes structured log records through a `LoggerSink`.
- `logger` is the default console-backed logger.
- `logAiRequest` records AI request metadata.

Current AI request logs include route, request id, model, latency, status, error code, and token usage when available. The logger sink boundary lets the project add database writes later without changing API routes.

## Workbench UI

The root page is a Chinese workbench home that links to implemented modules. Each module should remain a vertical slice with a page, route, provider abstraction usage, validation, observability, and smoke tests.

## Tool Calling

The first tool-calling slice is intentionally model-independent:

- `src/server/tools/types.ts` defines the internal `AppTool` contract.
- `src/server/tools/registry.ts` lists registered tools and centralizes execution.
- `src/app/api/tools/route.ts` exposes safe tool metadata and execution.
- `src/components/tools/ToolCallingShell.tsx` renders tool selection, JSON input, status, and output.

This gives the project a safe tool boundary before adding model-driven function calling.
