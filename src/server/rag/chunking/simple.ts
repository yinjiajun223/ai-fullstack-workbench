import type { RagChunk, RagDocument } from "../types";

export type ChunkTextOptions = {
  chunkSize?: number;
  overlapSize?: number;
};

const defaultChunkSize = 900;
const defaultOverlapSize = 120;

export function chunkDocument(
  document: RagDocument,
  options: ChunkTextOptions = {},
): RagChunk[] {
  const chunkSize = options.chunkSize ?? defaultChunkSize;
  const overlapSize = options.overlapSize ?? defaultOverlapSize;
  const normalizedText = normalizeText(document.text);

  if (!normalizedText) {
    return [];
  }

  const chunks: RagChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  // 使用固定窗口 + overlap 切片，避免答案刚好落在两个 chunk 边界时被截断。
  // 这是一版容易理解的教学实现，后续可以替换为按标题、段落或 token 的切片策略。
  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    const text = normalizedText.slice(start, end).trim();

    if (text) {
      chunks.push({
        id: `${document.id}:chunk:${chunkIndex}`,
        documentId: document.id,
        chunkIndex,
        sourceName: document.sourceName,
        text,
        metadata: {
          ...document.metadata,
          start,
          end,
        },
      });
      chunkIndex += 1;
    }

    if (end >= normalizedText.length) {
      break;
    }

    start = Math.max(0, end - overlapSize);
  }

  return chunks;
}

function normalizeText(text: string): string {
  // 先做轻量归一化：统一换行并压缩空格，保留原始语义内容。
  // 不在这里做复杂清洗，避免把代码块、表格或中文段落破坏掉。
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}
