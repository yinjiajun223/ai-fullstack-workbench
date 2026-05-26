"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type UiState = "empty" | "loading" | "success" | "error";

type RagChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  sourceName: string;
  text: string;
  score?: number;
};

type RagIngestResponse = {
  ok: true;
  data: {
    document: {
      id: string;
      sourceName: string;
      createdAt: string;
    };
    chunks: RagChunk[];
  };
  requestId: string;
} | {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

type RagQueryResponse = {
  ok: true;
  data: {
    answer: string;
    citations: Array<{
      chunkId: string;
      documentId: string;
      sourceName: string;
      chunkIndex: number;
    }>;
    retrievedChunks: RagChunk[];
    model?: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  };
  requestId: string;
} | {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

const copy = {
  back: "返回工作台",
  title: "RAG 知识库",
  description: "摄入一段知识库文本，检索相关片段，并让模型基于片段生成带引用的回答。",
  sourceName: "来源名称",
  sourcePlaceholder: "例如：产品说明文档",
  documentText: "文档文本",
  documentPlaceholder: "粘贴一段至少 20 个字符的知识库内容。",
  ingest: "摄入文档",
  ingesting: "摄入中...",
  question: "问题",
  questionPlaceholder: "例如：这个产品适合哪些用户？",
  query: "查询知识库",
  querying: "查询中...",
  answer: "回答",
  retrievedChunks: "检索片段",
  citations: "引用",
  requestId: "请求 ID",
  usage: "Token 用量",
  emptyAnswer: "摄入文档并提问后，这里会展示回答。",
  ingestSuccess: "文档已摄入",
  queryFailed: "请求失败，请检查 dev server 或模型配置。",
};

export function RagShell() {
  const [sourceName, setSourceName] = useState(copy.sourcePlaceholder);
  const [documentText, setDocumentText] = useState(
    "AI Fullstack Workbench 是一个用于学习和实现 AI 应用完整生命周期的项目。它包含 AI Chat、流式响应、结构化输出、工具调用、RAG 知识库、Agent 工作流、MCP 集成、评测和可观测性。项目要求模型调用只能发生在服务端，前端不能暴露模型密钥。",
  );
  const [question, setQuestion] = useState("这个项目包含哪些 AI 应用模块？");
  const [ingestState, setIngestState] = useState<UiState>("empty");
  const [queryState, setQueryState] = useState<UiState>("empty");
  const [ingestResult, setIngestResult] = useState<RagIngestResponse | null>(null);
  const [queryResult, setQueryResult] = useState<RagQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setIngestState("loading");
    setError(null);

    try {
      const response = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceName: sourceName.trim(),
          text: documentText.trim(),
        }),
      });
      const payload = (await response.json()) as RagIngestResponse;

      setIngestResult(payload);
      setIngestState(payload.ok ? "success" : "error");

      if (!payload.ok) {
        setError(payload.error.message);
      }
    } catch {
      setIngestState("error");
      setError(copy.queryFailed);
    }
  };

  const handleQuery = async () => {
    setQueryState("loading");
    setError(null);

    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          topK: 4,
        }),
      });
      const payload = (await response.json()) as RagQueryResponse;

      setQueryResult(payload);
      setQueryState(payload.ok ? "success" : "error");

      if (!payload.ok) {
        setError(payload.error.message);
      }
    } catch {
      setQueryState("error");
      setError(copy.queryFailed);
    }
  };

  const answer = queryResult?.ok ? queryResult.data.answer : "";
  const retrievedChunks = queryResult?.ok ? queryResult.data.retrievedChunks : [];
  const citations = queryResult?.ok ? queryResult.data.citations : [];

  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <Link className="text-sm font-medium text-zinc-500 hover:text-zinc-950" href="/">
            {copy.back}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{copy.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">{copy.description}</p>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-4">
            <form
              className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void handleIngest();
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950" htmlFor="source-name">
                  {copy.sourceName}
                </label>
                <input
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
                  id="source-name"
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder={copy.sourcePlaceholder}
                  value={sourceName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950" htmlFor="document-text">
                  {copy.documentText}
                </label>
                <Textarea
                  className="min-h-64"
                  id="document-text"
                  onChange={(event) => setDocumentText(event.target.value)}
                  placeholder={copy.documentPlaceholder}
                  value={documentText}
                />
              </div>
              <Button disabled={ingestState === "loading"} type="submit">
                {ingestState === "loading" ? copy.ingesting : copy.ingest}
              </Button>
              {ingestResult?.ok ? (
                <p className="text-xs text-emerald-700">
                  {copy.ingestSuccess}：{ingestResult.data.chunks.length} 个 chunk
                </p>
              ) : null}
            </form>

            <form
              className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void handleQuery();
              }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950" htmlFor="rag-question">
                  {copy.question}
                </label>
                <Textarea
                  className="min-h-28"
                  id="rag-question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={copy.questionPlaceholder}
                  value={question}
                />
              </div>
              <Button disabled={queryState === "loading"} type="submit">
                {queryState === "loading" ? copy.querying : copy.query}
              </Button>
            </form>
          </div>

          <section className="flex min-h-0 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <MetaTile label={copy.requestId} value={queryResult?.requestId ?? ingestResult?.requestId ?? "-"} />
              <MetaTile
                label={copy.usage}
                value={queryResult?.ok && queryResult.data.usage ? String(queryResult.data.usage.totalTokens) : "-"}
              />
              <MetaTile label={copy.citations} value={String(citations.length)} />
            </div>

            <article className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-sm font-semibold text-zinc-950">{copy.answer}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                {answer || copy.emptyAnswer}
              </p>
            </article>

            <section className="min-h-0 flex-1 rounded-md border border-zinc-200 p-4">
              <h2 className="text-sm font-semibold text-zinc-950">{copy.retrievedChunks}</h2>
              <div className="mt-3 space-y-3">
                {retrievedChunks.length > 0 ? (
                  retrievedChunks.map((chunk) => (
                    <article className="rounded-md border border-zinc-200 bg-white p-3" key={chunk.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                        <span>{chunk.sourceName}</span>
                        <span>score: {chunk.score?.toFixed(2) ?? "-"}</span>
                      </div>
                      <p className="mt-2 max-h-36 overflow-auto text-sm leading-6 text-zinc-700">{chunk.text}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">暂无检索片段。</p>
                )}
              </div>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</div>
    </div>
  );
}
