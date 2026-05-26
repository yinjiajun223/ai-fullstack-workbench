import { z } from "zod";
import {
  chunkDocument,
  embedTexts,
  listDocuments,
  saveDocument,
  upsertEmbeddedChunks,
  type RagDocument,
} from "@/server/rag";
import { createRequestId, logger } from "@/server/observability";

export const runtime = "nodejs";

const RagIngestRequestSchema = z.object({
  sourceName: z.string().min(1).max(160),
  text: z.string().min(20),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function GET(request: Request): Response {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();

  return Response.json(
    {
      ok: true,
      data: {
        documents: listDocuments(),
      },
      requestId,
    },
    {
      headers: {
        "X-Request-Id": requestId,
      },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  const requestId = request.headers.get("x-request-id") ?? createRequestId();
  const startedAt = Date.now();

  try {
    const body = await readJsonBody(request);
    const parsed = RagIngestRequestSchema.safeParse(body);

    if (!parsed.success) {
      logRagIngest({
        requestId,
        startedAt,
        status: "error",
        errorCode: "VALIDATION_ERROR",
      });

      return Response.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid RAG ingest request body.",
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

    const document: RagDocument = {
      id: createDocumentId(),
      sourceName: parsed.data.sourceName,
      text: parsed.data.text,
      createdAt: new Date().toISOString(),
      metadata: parsed.data.metadata,
    };
    const chunks = chunkDocument(document);

    // 摄入阶段先对每个 chunk 做 embedding，再写入内存向量库。
    // 当前是 memory vector store，后续替换成 Qdrant 时 route 流程保持一致。
    const embeddingResult = await embedTexts({
      texts: chunks.map((chunk) => chunk.text),
    });

    saveDocument({
      document,
      chunks,
    });
    upsertEmbeddedChunks({
      documentId: document.id,
      chunks: chunks.map((chunk, index) => ({
        chunk,
        embedding: embeddingResult.embeddings[index] ?? [],
        model: embeddingResult.model,
      })),
    });

    logRagIngest({
      requestId,
      startedAt,
      status: "success",
      documentId: document.id,
      chunkCount: chunks.length,
      embeddingModel: embeddingResult.model,
    });

    return Response.json(
      {
        ok: true,
        data: {
          document,
          chunks,
          embedding: {
            model: embeddingResult.model,
            usage: embeddingResult.usage,
          },
        },
        requestId,
      },
      {
        headers: {
          "X-Request-Id": requestId,
        },
      },
    );
  } catch {
    logRagIngest({
      requestId,
      startedAt,
      status: "error",
      errorCode: "RAG_INGEST_ERROR",
    });

    return Response.json(
      {
        ok: false,
        error: {
          code: "RAG_INGEST_ERROR",
          message: "Failed to ingest document.",
        },
        requestId,
      },
      {
        status: 500,
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

function createDocumentId(): string {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function logRagIngest(input: {
  requestId: string;
  startedAt: number;
  status: "success" | "error";
  errorCode?: string;
  documentId?: string;
  chunkCount?: number;
  embeddingModel?: string;
}): void {
  logger.info("rag.ingest", "RAG ingest completed.", {
    requestId: input.requestId,
    status: input.status,
    errorCode: input.errorCode,
    documentId: input.documentId,
    chunkCount: input.chunkCount,
    embeddingModel: input.embeddingModel,
    latencyMs: Date.now() - input.startedAt,
  });
}
