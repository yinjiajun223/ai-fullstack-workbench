# AI Flow

AI requests should flow through server-only modules.

## Standard Flow

1. Validate request input with Zod.
2. Create or propagate a request id.
3. Select model and prompt version.
4. Read provider settings with `getAiConfig` from `src/server/ai/config`.
5. Create the adapter with `createAiProvider` from `src/server/ai`.
6. Call `provider.chat` for normal chat completion or `provider.streamChat` for streaming.
7. Normalize errors and usage metadata.
8. Log request id, model, latency, status, error code, and token usage through `src/server/observability`.
9. Return a typed API response or stream.

## Provider Adapter

The first adapter is OpenAI-compatible and uses the standard `/chat/completions` endpoint. DashScope-compatible deployments can use the same adapter when `AI_BASE_URL` points to a compatible endpoint.

Shared server-side types:

- `ChatMessage`: normalized chat messages with `system`, `user`, `assistant`, and `tool` roles.
- `ModelUsage`: normalized token usage with `inputTokens`, `outputTokens`, and `totalTokens`.
- `AiProvider`: interface with `chat` and `streamChat`.

Required environment variables:

- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_CHAT_MODEL`
- `AI_FAST_MODEL`
- `AI_REASONING_MODEL`
- `AI_EMBEDDING_MODEL`

## Safety

- Do not expose provider API keys to client components.
- Do not use `NEXT_PUBLIC_` for provider secrets.
- Treat user input, retrieved documents, and model output as untrusted.
- Keep reusable prompts under `src/server/ai/prompts`.

## Chat UI Flow

The `/chat` page is a client-side streaming UI backed by the server-only `/api/chat` route.

1. `ChatShell` loads available model names from `GET /api/chat/models`.
2. The user selects a model and submits a message through `ChatInput`.
3. `ChatShell` appends the user message and a temporary assistant message.
4. The browser calls `/api/chat` with `{ messages, model, stream: true }`.
5. The API route reads AI provider config on the server and returns `text/event-stream`.
6. The client parses `content`, `usage`, `error`, and `done` SSE events.
7. Assistant content is appended as chunks arrive.
8. `usage` and `requestId` are shown in the request information panel when available.
9. `AbortController` stops an in-flight request when the user clicks stop.
10. Regenerate removes the last assistant answer and replays the prior messages. If the last request failed before an assistant answer was created, regenerate retries the last user message.

The chat UI never reads `AI_API_KEY` or any non-public AI environment variable.

## Structured Output Flow

The `/structured-output` page demonstrates model-generated JSON based on predefined schemas.

1. The user selects a use case such as marketing structure, entity extraction, intent classification, task plan, or UI schema.
2. The browser posts `{ useCase, input }` to `/api/structured-output`.
3. The route validates the request with Zod.
4. The route builds a schema-specific system prompt and calls the AI provider adapter.
5. The model response is parsed as JSON.
6. The parsed object is validated against the selected Zod schema.
7. The route returns either `{ ok: true, data }` or a normalized error response.
8. The UI shows loading, empty, success, and error states.

The structured output UI never reads `AI_API_KEY`; provider config remains server-side.

## Tool-Calling Flow

The `/tool-calling` page supports both manual tool execution and model-selected tool calling.

Manual execution:

1. The browser loads tool metadata from `GET /api/tools`.
2. The user selects a tool and edits JSON input.
3. The browser posts `{ toolName, input }` to `POST /api/tools`.
4. The route validates input with the selected tool's Zod schema.
5. The route executes the tool through `executeTool` and returns structured output.

Model-selected execution:

1. The user enters a natural-language prompt.
2. The browser posts `{ prompt }` to `POST /api/tool-calling/chat`.
3. The route sends allowlisted tool definitions to the AI provider through `tools` and `toolChoice: "auto"`.
4. If the model requests tool calls, the server validates and executes those tools through `executeTool`.
5. Tool results are appended as `tool` messages.
6. The route calls the model again to generate the final answer.
7. The route returns final answer, tool call records, and a normalized timeline.
8. The UI shows each timeline step with `pending`, `running`, `success`, `error`, `skipped`, or `requires_confirmation`.
9. The UI also shows final answer, tool call arguments, tool output, request id, and usage when available.

The model never executes tools directly. It only proposes tool calls; the server validates and executes allowlisted tools.

## AI Request Logs

`/api/chat` records one structured AI request log per request outcome.

Logged fields:

- `requestId`
- `route`
- `model`
- `latencyMs`
- `status`
- `errorCode`
- `usage` when the provider returns token usage

Logs currently go to console through the default logger. Later, the `LoggerSink` interface can be extended with a database sink without changing route code.
