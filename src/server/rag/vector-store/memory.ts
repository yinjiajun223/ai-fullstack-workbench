import type { EmbeddedChunk, RetrievedChunk } from "../types";

type MemoryVectorStoreState = {
  embeddedChunks: EmbeddedChunk[];
};

const globalForVectorStore = globalThis as typeof globalThis & {
  __ragMemoryVectorStore?: MemoryVectorStoreState;
};

function getState(): MemoryVectorStoreState {
  globalForVectorStore.__ragMemoryVectorStore ??= {
    embeddedChunks: [],
  };

  return globalForVectorStore.__ragMemoryVectorStore;
}

export function upsertEmbeddedChunks(input: {
  documentId: string;
  chunks: EmbeddedChunk[];
}): void {
  const state = getState();

  state.embeddedChunks = [
    ...state.embeddedChunks.filter((item) => item.chunk.documentId !== input.documentId),
    ...input.chunks,
  ];
}

export function searchMemoryVectorStore(input: {
  queryEmbedding: number[];
  topK: number;
}): RetrievedChunk[] {
  // 这里是内存向量库的教学实现：用 cosine similarity 模拟向量数据库检索。
  // 接 Qdrant 时保持入参/出参不变，替换这一层即可。
  return getState().embeddedChunks
    .map((item) => ({
      ...item.chunk,
      score: cosineSimilarity(input.queryEmbedding, item.embedding),
    }))
    .filter((chunk) => Number.isFinite(chunk.score) && chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, input.topK);
}

export function listEmbeddedChunks(): EmbeddedChunk[] {
  return [...getState().embeddedChunks];
}

export function clearMemoryVectorStore(): void {
  globalForVectorStore.__ragMemoryVectorStore = {
    embeddedChunks: [],
  };
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
