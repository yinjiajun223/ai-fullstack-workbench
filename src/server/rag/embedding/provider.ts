import { createAiProvider, getAiConfig, type ModelUsage } from "@/server/ai";

export type EmbedTextsResult = {
  embeddings: number[][];
  model?: string;
  usage?: ModelUsage;
};

export async function embedTexts(input: {
  texts: string[];
  model?: string;
}): Promise<EmbedTextsResult> {
  // RAG 只依赖这个 embedding 边界，不直接关心底层是 DashScope、OpenAI-compatible 还是别的供应商。
  // 后续如果要做批量重试、限流或缓存，也应该优先放在这一层。
  const config = getAiConfig();
  const provider = createAiProvider({ config });
  const result = await provider.embed({
    input: input.texts,
    model: input.model ?? config.embeddingModel,
  });

  return {
    embeddings: result.embeddings,
    model: result.model,
    usage: result.usage,
  };
}
