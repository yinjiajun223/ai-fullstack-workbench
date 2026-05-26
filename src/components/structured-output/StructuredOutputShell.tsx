"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type UseCase = "marketing" | "entities" | "intent" | "task-plan" | "ui-schema";

type UiState = "empty" | "loading" | "success" | "error";

type StructuredOutputResponse = {
  ok: true;
  data: {
    output: unknown;
    rawText: string;
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
  title: "结构化输出 Demo",
  description:
    "选择 schema 场景，输入业务文本，服务端会调用模型生成 JSON，并用 Zod 校验结构。",
  useCase: "场景",
  input: "输入",
  state: "状态",
  generate: "生成 JSON",
  generating: "生成中...",
  preview: "JSON 预览",
  previewHint: "成功时展示校验后的 JSON；失败时展示统一错误信息。",
  empty: "选择场景并点击“生成 JSON”。",
  loading: "正在调用服务端模型...",
  clientError: "请求失败，请检查 dev server 或网络连接。",
};

const useCases: Array<{
  value: UseCase;
  label: string;
  description: string;
  placeholder: string;
}> = [
  {
    value: "marketing",
    label: "营销内容结构",
    description: "生成标题、受众、核心卖点、渠道和行动号召。",
    placeholder: "为一款面向中小商家的 AI 海报生成工具设计营销内容结构。",
  },
  {
    value: "entities",
    label: "实体抽取",
    description: "抽取人名、组织、地点、日期和关键词。",
    placeholder: "阿里云在杭州发布了新的通义千问模型，面向企业客户提供服务。",
  },
  {
    value: "intent",
    label: "意图分类",
    description: "判断用户意图、置信度、原因摘要和下一步动作。",
    placeholder: "用户说：我想知道上个月订单为什么没有退款成功。",
  },
  {
    value: "task-plan",
    label: "任务计划",
    description: "把目标拆成步骤、优先级和风险。",
    placeholder: "帮我规划一个两周内完成 AI Chat MVP 的任务计划。",
  },
  {
    value: "ui-schema",
    label: "界面 Schema",
    description: "生成页面标题、区块、组件和字段定义。",
    placeholder: "设计一个 RAG 文档上传和检索调试页面的 UI schema。",
  },
];

export function StructuredOutputShell() {
  const [useCase, setUseCase] = useState<UseCase>("marketing");
  const [input, setInput] = useState(useCases[0].placeholder);
  const [state, setState] = useState<UiState>("empty");
  const [result, setResult] = useState<StructuredOutputResponse | null>(null);

  const selectedUseCase = useMemo(
    () => useCases.find((item) => item.value === useCase) ?? useCases[0],
    [useCase],
  );
  const outputText = result?.ok ? JSON.stringify(result.data.output, null, 2) : "";

  const handleUseCaseChange = (nextUseCase: UseCase) => {
    const next = useCases.find((item) => item.value === nextUseCase) ?? useCases[0];

    setUseCase(next.value);
    setInput(next.placeholder);
    setState("empty");
    setResult(null);
  };

  const handleSubmit = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || state === "loading") {
      return;
    }

    setState("loading");
    setResult(null);

    try {
      const response = await fetch("/api/structured-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          useCase,
          input: trimmedInput,
        }),
      });
      const payload = (await response.json()) as StructuredOutputResponse;

      setResult(payload);
      setState(payload.ok ? "success" : "error");
    } catch {
      setResult({
        ok: false,
        error: {
          code: "CLIENT_REQUEST_ERROR",
          message: copy.clientError,
        },
        requestId: "client",
      });
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <a className="text-sm font-medium text-zinc-500 hover:text-zinc-950" href="/">
            {copy.back}
          </a>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{copy.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">{copy.description}</p>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[420px_1fr]">
          <form
            className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950" htmlFor="use-case">
                {copy.useCase}
              </label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                disabled={state === "loading"}
                id="use-case"
                onChange={(event) => handleUseCaseChange(event.target.value as UseCase)}
                value={useCase}
              >
                {useCases.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-zinc-500">{selectedUseCase.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950" htmlFor="structured-input">
                {copy.input}
              </label>
              <Textarea
                className="min-h-56"
                disabled={state === "loading"}
                id="structured-input"
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
            </div>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              {copy.state}: {state}
            </div>

            <Button disabled={state === "loading" || input.trim().length === 0} type="submit">
              {state === "loading" ? copy.generating : copy.generate}
            </Button>
          </form>

          <section className="flex min-h-[520px] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-950">{copy.preview}</h2>
              <p className="mt-1 text-xs text-zinc-500">{copy.previewHint}</p>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              {state === "empty" ? (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-500">
                  {copy.empty}
                </div>
              ) : null}

              {state === "loading" ? (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-500">
                  {copy.loading}
                </div>
              ) : null}

              {state === "error" && result && !result.ok ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="font-semibold">{result.error.code}</div>
                  <p className="mt-2">{result.error.message}</p>
                  <p className="mt-2 text-xs text-red-500">requestId: {result.requestId}</p>
                </div>
              ) : null}

              {state === "success" && result?.ok ? (
                <>
                  <div className="grid gap-2 text-xs text-zinc-500 sm:grid-cols-3">
                    <div>requestId: {result.requestId}</div>
                    <div>model: {result.data.model ?? "-"}</div>
                    <div>tokens: {result.data.usage?.totalTokens ?? "-"}</div>
                  </div>
                  <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-zinc-950 p-4 text-sm leading-6 text-zinc-50">
                    <code>{outputText}</code>
                  </pre>
                </>
              ) : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
