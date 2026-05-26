import type { RagChunk, RagDocument } from "../types";

type MemoryRagStoreState = {
  documents: RagDocument[];
  chunks: RagChunk[];
};

const globalForRag = globalThis as typeof globalThis & {
  __ragMemoryStore?: MemoryRagStoreState;
};

function getState(): MemoryRagStoreState {
  globalForRag.__ragMemoryStore ??= {
    documents: [],
    chunks: [],
  };

  return globalForRag.__ragMemoryStore;
}

export function saveDocument(input: {
  document: RagDocument;
  chunks: RagChunk[];
}): void {
  const state = getState();

  state.documents = [
    input.document,
    ...state.documents.filter((document) => document.id !== input.document.id),
  ];
  state.chunks = [
    ...state.chunks.filter((chunk) => chunk.documentId !== input.document.id),
    ...input.chunks,
  ];
}

export function listDocuments(): RagDocument[] {
  return [...getState().documents];
}

export function listChunks(): RagChunk[] {
  return [...getState().chunks];
}

export function clearMemoryRagStore(): void {
  globalForRag.__ragMemoryStore = {
    documents: [],
    chunks: [],
  };
}
