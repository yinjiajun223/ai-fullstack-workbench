# Database

The project should use the user's existing Alibaba Cloud database.

## Direction

- Prefer PostgreSQL when available.
- Use Drizzle ORM by default.
- Apply schema changes through migrations.
- Keep AI logs and user content separated when practical.

## Initial Tables

Introduce tables only when needed. Likely tables include users, conversations, messages, ai_requests, tool_calls, documents, document_chunks, eval_runs, eval_cases, and eval_results.
