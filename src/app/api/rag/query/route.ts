import { z } from "zod";
import {
  embedTexts,
  generateRagAnswer,
  searchMemoryVectorStore,
  type RetrievedChunk,
} from "@/server/rag";
import { createRequestId, logger } from "@/server/observability";
import { normalizeAiProviderError, type ModelUsage } from "@/server/ai";

export const runtime = "nodejs";

const RagQueryRequestSchema = z.object({
  question: z.string().min(1),
  topK: z.number().int().min(1).max(8).optional().default(4),
  model: z.string().min(1).optional(),
});

type RagQueryData = {
  answer: string;
  citations: Array<{
    chunkId: string;
    documentId: string;
    sourceName: string;
    chunkIndex: number;
  }>;
  retrievedChunks: RetrievedChunk[];
  model?: string;
  usage?: ModelUsage;
  embedding?: {
    model?: string;
    usage?: ModelUsage;
  };
};

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const startedAt = Date.now();
  let retrievedChunks: RetrievedChunk[] = [];

  try {
    const body = await readJsonBody(request);
    const parsed = RagQueryRequestSchema.safeParse(body);

    if (!parsed.success) {
      logRagQuery({
        requestId,
        startedAt,
        status: "error",
        errorCode: "VALIDATION_ERROR",
        retrievedChunks,
      });

      return Response.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid RAG query request body.",
            details: parsed.error.flatten(),
          },
          requestId,
        },
        {
          status: 400,
          headers: {
            "X-Request-Id": requestId,
          },
        },
      );
    }

    // 查询阶段也先把问题转成 embedding，再用向量相似度检索 topK chunks。
    // 这样 query 流程已经接近真实 RAG，只是 vector store 仍是内存实现。
    const embeddingResult = await embedTexts({
      texts: [parsed.data.question],
    });
    const queryEmbedding = embeddingResult.embeddings[0] ?? [];

    retrievedChunks = searchMemoryVectorStore({
      queryEmbedding,
      topK: parsed.data.topK,
    });
    const result = await generateRagAnswer({
      question: parsed.data.question,
      chunks: retrievedChunks,
      model: parsed.data.model,
    });
    const citations = retrievedChunks.map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      sourceName: chunk.sourceName,
      chunkIndex: chunk.chunkIndex,
    }));

    logRagQuery({
      requestId,
      startedAt,
      status: "success",
      retrievedChunks,
      model: result.model,
      usage: mergeUsage(embeddingResult.usage, result.usage),
      embeddingModel: embeddingResult.model,
    });

    return Response.json(
      {
        ok: true,
        data: {
          answer: result.answer,
          citations,
          retrievedChunks,
          model: result.model,
          usage: mergeUsage(embeddingResult.usage, result.usage),
          embedding: {
            model: embeddingResult.model,
            usage: embeddingResult.usage,
          },
        } satisfies RagQueryData,
        requestId,
      },
      {
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    const normalizedError = normalizeAiProviderError(error);

    logRagQuery({
      requestId,
      startedAt,
      status: "error",
      errorCode: normalizedError.code,
      retrievedChunks,
    });

    return Response.json(
      {
        ok: false,
        error: {
          code: normalizedError.code,
          message: normalizedError.message,
        },
        requestId,
      },
      {
        status: normalizedError.statusCode,
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function logRagQuery(input: {
  requestId: string;
  startedAt: number;
  status: "success" | "error";
  errorCode?: string;
  retrievedChunks: RetrievedChunk[];
  model?: string;
  usage?: ModelUsage;
  embeddingModel?: string;
}): void {
  logger.info("rag.query", "RAG query completed.", {
    requestId: input.requestId,
    status: input.status,
    errorCode: input.errorCode,
    model: input.model,
    usage: input.usage,
    embeddingModel: input.embeddingModel,
    retrievedChunkIds: input.retrievedChunks.map((chunk) => chunk.id),
    latencyMs: Date.now() - input.startedAt,
  });
}

function mergeUsage(first: ModelUsage | undefined, second: ModelUsage | undefined): ModelUsage | undefined {
  if (!first && !second) {
    return undefined;
  }

  return {
    inputTokens: (first?.inputTokens ?? 0) + (second?.inputTokens ?? 0),
    outputTokens: (first?.outputTokens ?? 0) + (second?.outputTokens ?? 0),
    totalTokens: (first?.totalTokens ?? 0) + (second?.totalTokens ?? 0),
  };
}
