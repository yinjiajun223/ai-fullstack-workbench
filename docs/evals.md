# Evals

Evaluation assets should live under `tests/evals` or `src/server/evals`.

## Coverage

- Chat quality.
- Structured output correctness.
- Tool-calling correctness.
- RAG retrieval quality.
- RAG faithfulness and citation correctness.
- Latency and cost checks.

## Case Shape

Eval cases should include id, category, input, expected behavior, scoring notes, and allowed variability.
