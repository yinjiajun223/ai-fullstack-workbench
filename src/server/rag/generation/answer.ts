import { createAiProvider, getAiConfig, type ModelUsage } from "@/server/ai";
import type { RetrievedChunk } from "../types";

export type GenerateRagAnswerResult = {
  answer: string;
  model?: string;
  usage?: ModelUsage;
};

export async function generateRagAnswer(input: {
  question: string;
  chunks: RetrievedChunk[];
  model?: string;
}): Promise<GenerateRagAnswerResult> {
  if (input.chunks.length === 0) {
    return {
      answer: "知识库中没有检索到足够相关的内容，因此无法基于知识库回答这个问题。",
    };
  }

  const config = getAiConfig();
  const provider = createAiProvider({ config });
  const result = await provider.chat({
    model: input.model,
    messages: [
      {
        role: "system",
        content:
          "你是一个严谨的 RAG 问答助手。只能基于提供的检索片段回答。不要编造来源。回答中用 [来源1]、[来源2] 这样的格式引用依据。如果检索片段不足以回答，就明确说明知识库中没有找到答案。",
      },
      {
        role: "user",
        content: buildPrompt(input.question, input.chunks),
      },
    ],
  });

  return {
    answer: result.content,
    model: result.model,
    usage: result.usage,
  };
}

function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, index) => {
      return [
        `[来源${index + 1}]`,
        `sourceName: ${chunk.sourceName}`,
        `documentId: ${chunk.documentId}`,
        `chunkId: ${chunk.id}`,
        chunk.text,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    `问题：${question}`,
    "",
    "检索片段：",
    context,
    "",
    "请给出中文回答，并在关键结论后标注来源。",
  ].join("\n");
}
