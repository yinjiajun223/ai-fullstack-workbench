import type { RagChunk, RetrievedChunk } from "../types";

export function retrieveChunks(input: {
  question: string;
  chunks: RagChunk[];
  topK: number;
}): RetrievedChunk[] {
  const queryTerms = tokenize(input.question);

  if (queryTerms.length === 0) {
    return [];
  }

  // 当前不是向量检索，而是关键词打分的 MVP。
  // 后续接入 embedding + Qdrant 后，只需要替换这一层的实现，API 和 UI 可以保持不变。
  return input.chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(queryTerms, chunk.text),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, input.topK);
}

function scoreChunk(queryTerms: string[], text: string): number {
  const textTerms = new Set(tokenize(text));
  let score = 0;

  // 简单统计 query term 是否出现在 chunk 中。
  // 英文/数字词给更高权重，单个中文字符只作为粗粒度召回信号。
  for (const term of queryTerms) {
    if (textTerms.has(term)) {
      score += term.length > 1 ? 2 : 1;
    }
  }

  return score / Math.max(queryTerms.length, 1);
}

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const latinTerms = normalized.match(/[a-z0-9_]+/g) ?? [];
  // 用 Unicode Script 匹配中文字符，避免源码里出现 \uXXXX 形式的中文范围转义。
  const cjkTerms = normalized.match(/\p{Script=Han}/gu) ?? [];

  return [...latinTerms, ...cjkTerms].filter((term) => term.length > 0);
}
