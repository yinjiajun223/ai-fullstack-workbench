# AGENTS.md

## 0. Purpose

This repository is a full-stack AI learning and production-quality demo project.

The goal is to help one developer learn and implement the complete AI application lifecycle end to end:

1. AI Chat UI
2. Streaming responses
3. Structured output
4. Tool Calling
5. RAG knowledge base
6. Agent workflow
7. MCP Server and MCP Client integration
8. Project-local Codex Skills
9. Evals and regression tests
10. Observability, logging, cost tracking
11. Deployment on the user's own server

Codex must treat this project as a production-grade full-stack engineering project, not a throwaway demo.

The expected engineering standard is comparable to a large internet company: clear architecture, typed contracts, layered modules, automated quality checks, security awareness, observability, maintainability, and scalable conventions.

---

## 1. Default Language and Communication

- Reply to the user in Chinese unless the user explicitly asks for English.
- Code, comments, file names, database columns, API names, and commit messages should use English.
- Explanations should be concise but complete.
- Before making large changes, summarize the intended plan.
- After making changes, summarize:
  - files changed
  - core logic changed
  - commands run
  - risks or follow-up work

---

## 2. Product Direction

This project is an AI full-stack learning workbench.

It should eventually support these product modules:

### 2.1 AI Chat

A general chat interface with:

- multi-session conversations
- streaming output
- markdown rendering
- code block rendering
- stop generation
- retry / regenerate
- model selector
- error handling
- token and cost display

### 2.2 Structured Output Demo

A page that demonstrates model-generated JSON based on schemas.

Example use cases:

- generate marketing content structure
- extract entities from text
- classify user intent
- generate task plans
- generate UI schema

### 2.3 Tool Calling Demo

A page where the model can call backend tools.

Example tools:

- get current user profile
- query product info
- query order status
- calculate cost
- generate campaign brief
- save generated content

The frontend must show tool-call state clearly:

- pending
- running
- success
- error
- skipped
- requires confirmation

### 2.4 RAG Knowledge Base

A knowledge-base module with:

- document upload
- text extraction
- chunking
- embedding
- vector storage
- retrieval
- cited answer generation
- source preview
- retrieval debugging panel

### 2.5 Agent Workflow Demo

A simple agent workflow module with:

- planning
- tool selection
- multi-step execution
- intermediate state display
- user confirmation for risky actions
- final answer generation

Do not introduce a complex multi-agent framework too early. Prefer a simple, understandable agent loop first.

### 2.6 MCP Demo

A local MCP server module that exposes project tools to AI clients.

Example MCP tools:

- `get_product_info`
- `search_campaign_templates`
- `generate_poster_brief`
- `query_knowledge_base`
- `create_content_plan`

The MCP code should be isolated from normal application routes.

### 2.7 Skills Demo

Project-local Codex Skills should be stored under:

```txt
.codex/skills/
```

Each skill must be scoped to one repeatable workflow and include a `SKILL.md` file.

### 2.8 Evals

The project must include evaluation datasets and scripts for:

- normal chat quality
- structured output correctness
- tool calling correctness
- RAG faithfulness
- RAG retrieval quality
- hallucination checks
- latency and cost checks

### 2.9 Observability

Every AI request should be traceable.

Record:

- user id if available
- session id
- request id
- model name
- prompt version
- input tokens
- output tokens
- total tokens
- estimated cost
- latency
- tool calls
- retrieved chunks
- errors
- final status

---

## 3. Recommended Tech Stack

Use this stack by default unless the user explicitly changes it.

### 3.1 Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for lightweight client state
- React Hook Form for forms
- Zod for schema validation
- TanStack Query only when server-state complexity becomes meaningful

### 3.2 Backend

- Next.js Route Handlers for the first version
- TypeScript end to end
- Zod for input/output validation
- Server-only model calls
- No model API key exposure in frontend code

If backend complexity grows, split into:

- Next.js web app
- Node.js API service or FastAPI service
- standalone MCP server
- standalone worker service

Do not split services prematurely.

### 3.3 Database

- Use the user's existing Alibaba Cloud database.
- Prefer PostgreSQL if available.
- Use Drizzle ORM by default.
- All schema changes must go through migrations.
- Do not write raw SQL unless there is a clear reason.

### 3.4 Vector Store

- Use Qdrant for the first vector database demo.
- Run Qdrant with Docker during learning.
- Keep vector store logic isolated behind a repository/service interface.

### 3.5 Cache and Queue

- Use Redis only when needed.
- For early demos, avoid queue complexity unless file ingestion becomes slow.
- If using background jobs, prefer BullMQ.

### 3.6 Model Provider

- Use Alibaba Cloud Model Studio / DashScope-compatible model APIs for project runtime if configured.
- Keep model provider calls behind an adapter interface.
- Do not hard-code model provider logic throughout the app.
- Allow switching providers later.

### 3.7 Development Assistant

- The developer uses Codex for programming assistance.
- Do not recommend buying a separate coding plan unless the user asks again.

---

## 4. Repository Structure

Prefer this structure:

```txt
.
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── .env.example
├── .codex/
│   └── skills/
│       ├── frontend-page/
│       │   └── SKILL.md
│       ├── ai-route/
│       │   └── SKILL.md
│       ├── tool-calling/
│       │   └── SKILL.md
│       ├── rag-pipeline/
│       │   └── SKILL.md
│       ├── mcp-server/
│       │   └── SKILL.md
│       ├── evals/
│       │   └── SKILL.md
│       └── code-review/
│           └── SKILL.md
├── docs/
│   ├── architecture.md
│   ├── ai-flow.md
│   ├── api-contracts.md
│   ├── database.md
│   ├── rag.md
│   ├── mcp.md
│   ├── evals.md
│   └── deploy.md
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── api/
│   │   │   ├── chat/route.ts
│   │   │   ├── structured-output/route.ts
│   │   │   ├── tools/route.ts
│   │   │   ├── rag/query/route.ts
│   │   │   └── rag/ingest/route.ts
│   │   ├── chat/
│   │   ├── structured-output/
│   │   ├── tool-calling/
│   │   ├── rag/
│   │   ├── agent/
│   │   └── mcp-demo/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── chat/
│   │   ├── ai/
│   │   ├── rag/
│   │   └── tools/
│   ├── config/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── server/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   ├── prompts/
│   │   │   ├── schemas/
│   │   │   ├── streaming/
│   │   │   └── index.ts
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   ├── rag/
│   │   │   ├── loaders/
│   │   │   ├── chunking/
│   │   │   ├── embedding/
│   │   │   ├── retrieval/
│   │   │   └── generation/
│   │   ├── tools/
│   │   ├── agent/
│   │   ├── mcp/
│   │   ├── evals/
│   │   ├── observability/
│   │   └── security/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── evals/
├── scripts/
│   ├── db-migrate.ts
│   ├── rag-ingest.ts
│   ├── eval-chat.ts
│   ├── eval-rag.ts
│   └── smoke-test.ts
└── docker-compose.yml
```

If the existing project structure differs, adapt to the existing structure instead of blindly rewriting it.

---

## 5. Engineering Principles

### 5.1 General Principles

- Prefer clarity over cleverness.
- Prefer explicit types over implicit behavior.
- Prefer small modules with single responsibility.
- Prefer stable interfaces over quick hacks.
- Avoid global mutable state.
- Avoid duplicated business logic.
- Never leave dead code or unused files.
- Do not introduce a dependency unless it clearly reduces complexity.
- Do not implement enterprise complexity before it is needed.

### 5.2 Large-company Development Standard

All production-like code should satisfy:

- typed API contracts
- schema validation at boundaries
- clear error handling
- logs for critical paths
- basic tests for important logic
- security review for secrets and user input
- accessible UI states
- loading, empty, error, and success states
- consistent naming
- code formatted by project tooling
- no hidden model calls from the client

### 5.3 Definition of Done

A task is not done until:

- implementation is complete
- TypeScript passes
- lint passes
- related tests are added or updated when meaningful
- error states are handled
- environment variables are documented if added
- README or docs are updated if behavior changes
- security risks are considered
- final response includes changed files and verification commands

---

## 6. TypeScript Rules

- Use strict TypeScript.
- Avoid `any` unless absolutely necessary.
- Prefer `unknown` with type narrowing over `any`.
- Export shared types from a dedicated `types` or module-local `types.ts` file.
- Use discriminated unions for state machines.
- Use Zod for runtime validation.
- Infer TypeScript types from Zod schemas when possible.

Example:

```ts
import { z } from "zod";

export const ToolCallStatusSchema = z.enum(["pending", "running", "success", "error", "requires_confirmation"]);

export type ToolCallStatus = z.infer<typeof ToolCallStatusSchema>;
```

---

## 7. Frontend Rules

### 7.1 Component Design

- Prefer functional components.
- Keep components small and composable.
- Separate container logic from presentational components when complexity grows.
- Use server components by default in Next.js App Router.
- Use client components only when interactivity is required.
- Keep AI streaming UI in client components.

### 7.2 UI State Requirements

Every user-facing module must handle:

- loading state
- empty state
- error state
- success state
- disabled state for in-flight actions

### 7.3 AI UI Requirements

Chat and agent UIs must display:

- user messages
- assistant messages
- streaming state
- tool calls
- tool call inputs when safe
- tool call outputs when useful
- errors
- retries
- token/cost metadata when available

### 7.4 Styling

- Use Tailwind CSS.
- Use shadcn/ui for base components.
- Keep spacing, radius, typography, and layout consistent.
- Do not hard-code random one-off colors unless needed.
- Use semantic component names.

### 7.5 Accessibility

- Use semantic HTML.
- Buttons must have accessible labels when icon-only.
- Form fields must have labels.
- Loading states should be visible.
- Keyboard interaction should not be broken.

---

## 8. Backend Rules

### 8.1 API Design

- Use Next.js Route Handlers for API routes.
- Validate all request bodies with Zod.
- Validate all environment variables at startup or first use.
- Return consistent error shapes.
- Do not leak internal errors to users.
- Use server-only modules for model calls.

Recommended API response shape:

```ts
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};
```

### 8.2 Error Handling

- Use typed domain errors for expected failures.
- Use generic 500 errors for unexpected failures.
- Always log unexpected server errors with request id.
- Never expose API keys, stack traces, SQL errors, or provider secrets.

### 8.3 Security

- Never expose model provider API keys in client code.
- Keep all secrets in environment variables.
- Add `.env.example` when adding environment variables.
- Validate upload file size and type.
- Sanitize user-provided text before rendering HTML.
- Treat model output as untrusted.
- Add confirmation steps before destructive tool calls.

---

## 9. AI Provider Abstraction

All model calls must go through:

```txt
src/server/ai/
```

Do not call provider SDKs directly from random routes or components.

Recommended structure:

```txt
src/server/ai/
├── providers/
│   ├── types.ts
│   ├── dashscope.ts
│   ├── openai-compatible.ts
│   └── index.ts
├── prompts/
├── schemas/
├── streaming/
├── cost.ts
└── index.ts
```

The provider interface should support:

- normal text generation
- streaming text generation
- structured output
- tool calling
- embeddings
- model metadata
- token usage
- error normalization

Do not lock the app into one model provider.

---

## 10. Prompt Engineering Rules

Prompts are source code and must be versioned.

Store reusable prompts in:

```txt
src/server/ai/prompts/
```

Each important prompt should include:

- purpose
- input variables
- expected output format
- safety constraints
- examples when helpful
- version string

Do not bury long prompts inside route handlers.

---

## 11. Tool Calling Rules

All tools must live under:

```txt
src/server/tools/
```

Each tool must define:

- name
- description
- input schema
- output schema if possible
- handler
- permission level
- whether it requires user confirmation
- error behavior

Recommended shape:

```ts
export type AppTool<TInput, TOutput> = {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  requiresConfirmation?: boolean;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
};
```

Tool calls must be observable and testable.

Do not allow the model to directly execute arbitrary code, SQL, shell commands, or destructive actions.

---

## 12. RAG Rules

RAG code must be split into clear stages:

1. loading
2. parsing
3. chunking
4. embedding
5. storage
6. retrieval
7. reranking if used
8. answer generation
9. citation rendering
10. evaluation

Recommended structure:

```txt
src/server/rag/
├── loaders/
├── chunking/
├── embedding/
├── vector-store/
├── retrieval/
├── generation/
├── citations/
└── index.ts
```

### 12.1 Chunking

- Keep chunking strategy configurable.
- Store chunk metadata.
- Preserve document id, source name, page number if available, and chunk index.

### 12.2 Retrieval

- Retrieval should return both content and metadata.
- The UI should be able to show retrieved chunks.
- Support topK configuration.
- Support metadata filters later.

### 12.3 Answer Generation

RAG answers must:

- use retrieved context
- avoid unsupported claims
- say when the answer is not found in the knowledge base
- include citations or source references when available

---

## 13. Agent Workflow Rules

Start with a simple agent loop before introducing frameworks.

A basic agent step should have:

- thought summary for developer logs only
- selected action
- tool call if needed
- observation
- next step decision
- final answer

Do not expose hidden chain-of-thought to users. Instead, show concise progress summaries such as:

- 正在分析需求
- 正在查询知识库
- 正在调用工具
- 正在整理结果

Agent workflows must have:

- max step limit
- timeout
- tool allowlist
- confirmation for risky actions
- clear failure mode

---

## 14. MCP Rules

MCP-related code should live under:

```txt
src/server/mcp/
```

MCP server code must be separated from normal user-facing API routes.

Each MCP tool should map to an internal app tool where possible.

Do not duplicate business logic between:

```txt
src/server/tools/
src/server/mcp/
```

The MCP layer should mainly adapt transport/protocol shape to internal tools.

Recommended structure:

```txt
src/server/mcp/
├── server.ts
├── tools.ts
├── resources.ts
├── prompts.ts
└── adapters.ts
```

---

## 15. Project-local Codex Skills

This repository should include reusable Codex skills under:

```txt
.codex/skills/
```

Codex should use these skills when the user explicitly invokes them or when the task matches the skill description.

Each skill should be narrow and practical.

### 15.1 Required Skills

Create or maintain these skills:

```txt
.codex/skills/frontend-page/SKILL.md
.codex/skills/ai-route/SKILL.md
.codex/skills/tool-calling/SKILL.md
.codex/skills/rag-pipeline/SKILL.md
.codex/skills/mcp-server/SKILL.md
.codex/skills/evals/SKILL.md
.codex/skills/code-review/SKILL.md
```

### 15.2 Skill: frontend-page

Use this skill when creating or refactoring a frontend page, dashboard, chat UI, form page, table page, or AI interaction UI.

The skill should enforce:

- Next.js App Router conventions
- TypeScript
- shadcn/ui
- Tailwind CSS
- loading / empty / error / success states
- responsive layout
- accessible form controls
- no direct model API calls from client code

### 15.3 Skill: ai-route

Use this skill when creating a backend route that calls an AI model.

The skill should enforce:

- server-only model calls
- Zod request validation
- provider abstraction
- request id
- normalized errors
- token usage logging
- cost estimation
- streaming support when needed

### 15.4 Skill: tool-calling

Use this skill when adding a model-callable tool.

The skill should enforce:

- tool name and description
- input schema
- output schema
- permission level
- confirmation requirement
- execution context
- tool call logging
- frontend rendering of tool status

### 15.5 Skill: rag-pipeline

Use this skill when implementing or modifying knowledge-base ingestion, embedding, retrieval, or RAG answer generation.

The skill should enforce:

- chunk metadata
- embedding abstraction
- vector-store abstraction
- retrieval debugging
- cited answers
- evaluation cases

### 15.6 Skill: mcp-server

Use this skill when creating or modifying MCP server code.

The skill should enforce:

- protocol adapter pattern
- internal tool reuse
- no duplicate business logic
- clear tool schemas
- safe error handling
- local testing instructions

### 15.7 Skill: evals

Use this skill when adding evaluation datasets or quality checks.

The skill should enforce:

- JSON/JSONL test cases
- deterministic test inputs
- scoring function
- regression command
- failure analysis output

### 15.8 Skill: code-review

Use this skill before finishing a non-trivial task.

The skill should check:

- architecture consistency
- type safety
- security
- AI key exposure
- prompt placement
- error handling
- UI states
- tests
- docs
- observability

---

## 16. Suggested Skill File Templates

When asked to initialize skills, create the following files.

### 16.1 `.codex/skills/frontend-page/SKILL.md`

```md
---
name: frontend-page
description: Use when creating or refactoring Next.js frontend pages, AI chat UI, dashboards, forms, tables, or user-facing interaction components. Ensures large-company frontend standards, shadcn/ui, Tailwind, accessibility, and complete UI states.
---

# Frontend Page Skill

## Goal

Create production-quality frontend pages and components for the AI full-stack workbench.

## Rules

- Use Next.js App Router.
- Use TypeScript.
- Use React functional components.
- Use server components by default.
- Use client components only when interactivity is required.
- Use Tailwind CSS and shadcn/ui.
- Never call model provider APIs from client components.
- All user-facing async modules must include loading, empty, error, and success states.
- Keep components small and composable.
- Use semantic HTML and accessible labels.
- Avoid hard-coded business data in components.

## Output Checklist

Before finishing:

- Page renders without TypeScript errors.
- Empty state exists.
- Loading state exists.
- Error state exists.
- Responsive layout is acceptable.
- Interactive controls are accessible.
- API calls are isolated in services or hooks.
```

### 16.2 `.codex/skills/ai-route/SKILL.md`

```md
---
name: ai-route
description: Use when creating or modifying a backend API route that calls an AI model, streams model output, generates structured output, or uses embeddings. Ensures server-only calls, validation, logging, and provider abstraction.
---

# AI Route Skill

## Goal

Create safe, observable, provider-agnostic AI backend routes.

## Rules

- AI provider calls must happen server-side only.
- Validate request bodies with Zod.
- Validate environment variables before using them.
- Use the central provider adapter under `src/server/ai`.
- Do not hard-code provider-specific logic in route handlers.
- Add request id for tracing.
- Normalize provider errors.
- Log token usage, latency, model name, and status when available.
- Support streaming when the UI requires it.
- Never return secrets or raw provider stack traces.

## Output Checklist

Before finishing:

- Route input is validated.
- Error response shape is consistent.
- Model key is not exposed to frontend.
- Token/cost logging is added when possible.
- `.env.example` is updated if new env vars are introduced.
```

### 16.3 `.codex/skills/tool-calling/SKILL.md`

```md
---
name: tool-calling
description: Use when adding, modifying, or debugging model-callable tools, function calling flows, tool schemas, tool execution handlers, or frontend tool-call state rendering.
---

# Tool Calling Skill

## Goal

Implement safe and observable model-callable tools.

## Rules

Each tool must have:

- stable name
- clear description
- Zod input schema
- output shape
- permission level
- confirmation requirement when risky
- execution handler
- tests or examples when meaningful

Tool execution must:

- validate input
- log request id and tool name
- handle expected errors
- avoid arbitrary code execution
- avoid raw SQL from model-generated input
- never expose secrets

Frontend rendering must show:

- pending state
- running state
- success state
- error state
- confirmation state when required

## Output Checklist

Before finishing:

- Tool is registered in the central tool registry.
- Tool schema is typed.
- Tool execution is observable.
- UI can display tool call progress if user-facing.
```

### 16.4 `.codex/skills/rag-pipeline/SKILL.md`

```md
---
name: rag-pipeline
description: Use when building or modifying document upload, text extraction, chunking, embedding, vector storage, retrieval, cited answer generation, or RAG evaluation logic.
---

# RAG Pipeline Skill

## Goal

Build reliable knowledge-base ingestion and retrieval-augmented generation.

## Rules

Split RAG into these stages:

1. loading
2. parsing
3. chunking
4. embedding
5. storage
6. retrieval
7. generation
8. citation rendering
9. evaluation

Chunk records must include:

- document id
- chunk id
- chunk index
- source name
- page number if available
- text
- metadata

Retrieval must:

- return content and metadata
- support topK
- support future filters
- expose retrieved chunks to debug UI

Generation must:

- answer only from retrieved context when the mode requires it
- say when information is not found
- include citations or source references when available

## Output Checklist

Before finishing:

- Ingestion path is separated from query path.
- Embedding provider is abstracted.
- Vector store logic is abstracted.
- Retrieval can be debugged.
- At least one eval case is added for meaningful changes.
```

### 16.5 `.codex/skills/mcp-server/SKILL.md`

```md
---
name: mcp-server
description: Use when creating or modifying MCP server code, MCP tools, MCP resources, MCP prompts, or adapters between MCP and internal app tools.
---

# MCP Server Skill

## Goal

Expose selected project capabilities through a safe MCP server without duplicating business logic.

## Rules

- Keep MCP code under `src/server/mcp`.
- Reuse internal tools from `src/server/tools` where possible.
- MCP should be an adapter layer, not a second business-logic layer.
- Define clear tool schemas.
- Validate inputs.
- Normalize errors.
- Do not expose secrets.
- Do not expose destructive tools without confirmation or explicit user intent.

## Output Checklist

Before finishing:

- MCP tools map to internal tools where possible.
- Tool descriptions are clear.
- Input schemas are safe.
- Local test instructions are documented.
```

### 16.6 `.codex/skills/evals/SKILL.md`

```md
---
name: evals
description: Use when adding or improving AI evaluation datasets, regression tests, RAG faithfulness checks, tool-calling correctness checks, or prompt-quality measurement scripts.
---

# Evals Skill

## Goal

Add repeatable quality checks for AI behavior.

## Rules

Eval cases should include:

- id
- category
- input
- expected behavior
- scoring notes
- allowed variability

For RAG evals, check:

- retrieval relevance
- faithfulness
- citation correctness
- refusal when information is missing

For tool-calling evals, check:

- correct tool selected
- correct arguments
- no unsafe tool call
- final answer uses tool result

## Output Checklist

Before finishing:

- Eval data is stored under `tests/evals` or `src/server/evals`.
- A script or command can run the eval.
- Failures produce readable output.
- README/docs mention how to run it.
```

### 16.7 `.codex/skills/code-review/SKILL.md`

```md
---
name: code-review
description: Use before finishing a non-trivial task or when reviewing changes. Checks architecture, type safety, security, AI-specific risks, UI states, tests, docs, and maintainability.
---

# Code Review Skill

## Goal

Review changes against production-grade full-stack AI engineering standards.

## Review Checklist

Check:

- Does the change follow the repository structure?
- Are types strict and meaningful?
- Are boundary inputs validated with Zod?
- Are secrets kept server-side?
- Are model calls routed through `src/server/ai`?
- Are prompts stored in prompt modules if reusable?
- Are tool calls safe and observable?
- Are RAG chunks and retrieval results traceable?
- Are loading, empty, error, and success UI states handled?
- Are errors normalized?
- Are tests or evals added when meaningful?
- Are docs updated if behavior changed?
- Are there unnecessary dependencies?
- Is there duplicated logic?

## Output Format

Return:

1. Critical issues
2. Suggested improvements
3. Verified checks
4. Commands run
5. Remaining risks
```

---

## 17. Database Rules

### 17.1 General

- Use migrations for schema changes.
- Keep schema definitions typed.
- Add indexes for frequently queried fields.
- Do not store raw secrets in the database.
- Keep AI logs and user content separated when reasonable.

### 17.2 Suggested Tables

Start with these conceptual tables:

- users
- conversations
- messages
- ai_requests
- tool_calls
- documents
- document_chunks
- eval_runs
- eval_cases
- eval_results

Do not create all tables at once unless needed. Introduce them as modules are built.

---

## 18. Logging and Observability Rules

Every AI request should have a request id.

Log at least:

- request id
- route
- model
- latency
- status
- error code if failed

For AI-specific logs, also capture when available:

- input tokens
- output tokens
- total tokens
- estimated cost
- tool calls
- retrieval ids

Do not log raw secrets.

Be careful when logging user content. For local learning it is acceptable, but structure code so sensitive logging can be disabled later.

---

## 19. Testing Rules

Use a layered testing strategy:

### 19.1 Unit Tests

Use for:

- utility functions
- schema validation
- cost calculation
- chunking
- retrieval formatting
- tool input validation

### 19.2 Integration Tests

Use for:

- API route behavior
- database repositories
- tool execution
- RAG retrieval

### 19.3 E2E Tests

Use for:

- chat page smoke test
- upload and query flow
- tool calling UI flow

### 19.4 AI Evals

Use for:

- prompt regression
- RAG faithfulness
- tool selection correctness
- structured output validity

If a feature changes AI behavior significantly, add or update eval cases.

---

## 20. Environment Variables

All environment variables must be documented in `.env.example`.

Suggested variables:

```txt
# App
NEXT_PUBLIC_APP_NAME="AI Fullstack Workbench"
APP_ENV="development"
APP_URL="http://localhost:3000"

# Database
DATABASE_URL=""

# AI Provider
AI_PROVIDER="dashscope"
AI_BASE_URL=""
AI_API_KEY=""
AI_CHAT_MODEL=""
AI_FAST_MODEL=""
AI_REASONING_MODEL=""
AI_EMBEDDING_MODEL=""

# Vector Store
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY=""
QDRANT_COLLECTION="ai_workbench_chunks"

# Redis, optional
REDIS_URL=""

# Observability, optional
LOG_LEVEL="info"
```

Rules:

- Never commit `.env`.
- Never print API keys.
- Never expose non-public env vars through `NEXT_PUBLIC_`.

---

## 21. Commands

Use `pnpm` by default.

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "rag:ingest": "tsx scripts/rag-ingest.ts",
    "eval:chat": "tsx scripts/eval-chat.ts",
    "eval:rag": "tsx scripts/eval-rag.ts",
    "smoke": "tsx scripts/smoke-test.ts"
  }
}
```

Before finalizing meaningful changes, run:

```txt
pnpm typecheck
pnpm lint
pnpm test
```

If a command cannot be run, explain why.

---

## 22. Documentation Rules

Update docs when adding major modules.

Use:

```txt
docs/architecture.md
docs/ai-flow.md
docs/api-contracts.md
docs/rag.md
docs/mcp.md
docs/evals.md
docs/deploy.md
```

Each doc should be practical and short. Do not write long theoretical essays unless requested.

---

## 23. Deployment Rules

The user already has:

- server
- domain
- Alibaba Cloud database

Assume deployment target is the user's own server unless changed.

Preferred deployment path:

- build Next.js app
- run with Node.js process manager or Docker
- reverse proxy with Nginx
- HTTPS with free certificate
- database on Alibaba Cloud RDS
- Qdrant and Redis via Docker if needed

Deployment docs must include:

- required env vars
- build command
- start command
- database migration command
- health check route
- rollback notes

---

## 24. Security Rules for AI Applications

AI-specific security risks must be considered.

### 24.1 Prompt Injection

- Treat retrieved documents as untrusted.
- Treat user prompts as untrusted.
- Do not let retrieved content override system or developer instructions.
- Do not execute commands from model output.

### 24.2 Tool Abuse

- Use tool allowlists.
- Validate tool input.
- Add confirmation for destructive actions.
- Avoid tools that run arbitrary shell commands.
- Avoid tools that directly execute model-generated SQL.

### 24.3 Data Leakage

- Do not expose API keys.
- Do not return internal logs to users.
- Do not include unrelated private context in prompts.
- Minimize what is sent to the model.

---

## 25. Cost Control Rules

Model cost must be visible and controllable.

Implement cost control gradually:

1. log model name and token usage
2. estimate cost per request
3. show cost in developer/debug panel
4. add monthly budget warning later
5. add per-user rate limits later

Use cheaper models for simple tasks and stronger models only when needed.

Suggested routing:

- simple chat: fast/cheap model
- structured output: plus model
- RAG answer: plus model
- complex reasoning: reasoning model
- embedding: embedding model

---

## 26. Git and Review Rules

- Keep commits focused.
- Do not mix unrelated refactors with feature work.
- Do not rename large directories unless necessary.
- Do not change formatting across the whole repo unless the task is formatting.
- Avoid noisy diffs.

Before final response, provide:

```txt
Changed files:
- path: summary

Verification:
- command: result

Notes:
- risks or follow-up
```

---

## 27. How Codex Should Work in This Repo

When asked to implement a feature:

1. Inspect the existing structure first.
2. Identify the relevant module.
3. Use the appropriate project-local skill if available.
4. Make the smallest coherent change.
5. Add types and validation.
6. Add UI states if frontend is affected.
7. Add tests or eval cases when meaningful.
8. Run verification commands if possible.
9. Summarize clearly.

When uncertain:

- make reasonable assumptions
- state the assumptions
- do not stop for minor clarifications
- prefer a working vertical slice over an incomplete abstraction

---

## 28. Implementation Milestones

Use these milestones for project development.

### Milestone 1: Project Foundation

- Next.js app initialized
- Tailwind and shadcn/ui configured
- env validation
- database connection
- base layout
- README
- AGENTS.md
- project-local skills

### Milestone 2: AI Chat

- chat page
- chat route
- streaming response
- markdown rendering
- stop generation
- error handling
- basic AI request logging

### Milestone 3: Structured Output

- schema demo page
- structured output route
- Zod validation
- JSON preview UI
- invalid output handling

### Milestone 4: Tool Calling

- internal tool registry
- sample product/order tools
- model tool calling route
- frontend tool-call timeline
- confirmation state

### Milestone 5: RAG

- document upload
- chunking
- embedding
- Qdrant storage
- retrieval route
- RAG answer route
- source display
- RAG eval cases

### Milestone 6: Agent

- simple agent loop
- step display UI
- tool allowlist
- max step limit
- final answer

### Milestone 7: MCP

- local MCP server
- MCP tool adapter
- expose selected internal tools
- local test instructions

### Milestone 8: Evals and Observability

- eval datasets
- eval scripts
- request logs
- cost tracking
- debug dashboard

### Milestone 9: Deployment

- production build
- server deployment guide
- Nginx config example
- health check
- rollback guide

---

## 29. Non-goals for Early Versions

Do not implement these unless explicitly requested:

- Kubernetes
- complex microservices
- self-hosted large model inference
- model fine-tuning
- multi-tenant enterprise auth
- advanced billing system
- complex multi-agent orchestration framework
- premature distributed tracing stack

These can be added later after the core learning path is complete.

---

## 30. Final Rule

This project is both a learning project and a production-standard engineering practice project.

Codex should help the user learn by building complete vertical slices:

```txt
UI → API → model/tool/RAG/MCP → database/vector store → logs/evals → deployment
```

For every feature, prefer a working, understandable, well-typed vertical slice over a large unfinished architecture.
