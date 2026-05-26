# RAG

RAG code should stay under `src/server/rag` and be split by lifecycle stage.

## Pipeline

1. Load documents.
2. Parse text.
3. Chunk content with metadata.
4. Generate embeddings through the AI adapter.
5. Store vectors behind a repository interface.
6. Retrieve topK chunks.
7. Generate cited answers from retrieved context.
8. Run retrieval and faithfulness evals.

## Metadata

Chunks should preserve document id, chunk id, chunk index, source name, optional page number, text, and metadata.
