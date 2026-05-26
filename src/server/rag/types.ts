export type RagDocument = {
  id: string;
  sourceName: string;
  text: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type RagChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  sourceName: string;
  pageNumber?: number;
  text: string;
  metadata: Record<string, unknown>;
};

export type RetrievedChunk = RagChunk & {
  score: number;
};

export type EmbeddedChunk = {
  chunk: RagChunk;
  embedding: number[];
  model?: string;
};

export type RagAnswer = {
  answer: string;
  citations: Array<{
    chunkId: string;
    documentId: string;
    sourceName: string;
    chunkIndex: number;
  }>;
  retrievedChunks: RetrievedChunk[];
};
