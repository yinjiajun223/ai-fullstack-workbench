"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ToolStepStatus = "pending" | "running" | "success" | "error" | "skipped" | "requires_confirmation";
type ToolStatus = "pending" | "running" | "success" | "error" | "requires_confirmation";
type ToolMode = "manual" | "ai";

type ToolMetadata = {
  name: string;
  description: string;
  permissionLevel: "read" | "compute" | "write";
  requiresConfirmation: boolean;
  inputExample: unknown;
};

type ToolTimelineStep = {
  id: string;
  title: string;
  status: ToolStepStatus;
  description?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ToolListResponse = {
  ok: true;
  data: {
    tools: ToolMetadata[];
  };
  requestId: string;
} | {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

type ToolExecutionResponse = {
  ok: true;
  data: {
    toolName: string;
    status: "success";
    output: unknown;
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

type ToolCallingChatResponse = {
  ok: true;
  data: {
    answer: string;
    model?: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    toolCalls: Array<{
      id: string;
      name: string;
      arguments: unknown;
      status: "success" | "error";
      output?: unknown;
      error?: {
        code: string;
        message: string;
        details?: unknown;
      };
    }>;
    timeline: ToolTimelineStep[];
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
  title: "工具调用",
  description: "手动执行安全后端工具，或让模型在 allowlist 中自动选择工具并生成最终回答。",
  mode: "模式",
  manualMode: "手动执行",
  aiMode: "AI 自动调用",
  tool: "工具",
  input: "输入 JSON",
  prompt: "用户问题",
  promptPlaceholder: "例如：帮我计算 12 件商品，单价 39.9 元，9 折并加 6% 税后的总价。",
  run: "执行",
  running: "执行中...",
  result: "结果",
  finalAnswer: "最终回答",
  rawJson: "原始 JSON",
  timeline: "调用流程",
  status: "状态",
  requestId: "请求 ID",
  pending: "等待执行",
  runningStatus: "正在执行",
  success: "执行成功",
  error: "执行失败",
  requiresConfirmation: "需要确认",
  skipped: "已跳过",
  invalidJson: "输入必须是合法 JSON。",
  loadFailed: "请求失败，请检查 dev server。",
  emptyOutput: "执行成功后会展示工具输出或 AI 最终回答。",
};

const emptyTimeline: ToolTimelineStep[] = [
  {
    id: "pending",
    title: "等待执行",
    status: "pending",
    description: "选择模式并点击执行后，这里会展示工具调用流程。",
  },
];

const aiRunningTimeline: ToolTimelineStep[] = [
  {
    id: "analyze",
    title: "分析用户问题",
    status: "running",
    description: "模型正在判断是否需要调用工具。",
  },
  {
    id: "select-tool",
    title: "选择工具",
    status: "pending",
    description: "等待模型返回 tool_calls。",
  },
  {
    id: "execute-tool",
    title: "执行工具",
    status: "pending",
    description: "服务端只会执行 allowlist 中的工具。",
  },
  {
    id: "final-answer",
    title: "生成最终回答",
    status: "pending",
    description: "等待工具结果回填给模型。",
  },
];

export function ToolCallingShell() {
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [mode, setMode] = useState<ToolMode>("ai");
  const [selectedToolName, setSelectedToolName] = useState("");
  const [inputText, setInputText] = useState("{}");
  const [prompt, setPrompt] = useState(copy.promptPlaceholder);
  const [status, setStatus] = useState<ToolStatus>("pending");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ToolExecutionResponse | ToolCallingChatResponse | null>(null);
  const [timeline, setTimeline] = useState<ToolTimelineStep[]>(emptyTimeline);
  const [error, setError] = useState<string | null>(null);

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.name === selectedToolName),
    [selectedToolName, tools],
  );
  const finalAnswer = result?.ok && "answer" in result.data ? result.data.answer : "";

  useEffect(() => {
    let ignore = false;

    async function loadTools() {
      try {
        const response = await fetch("/api/tools");
        const payload = (await response.json()) as ToolListResponse;

        if (ignore || !payload.ok) {
          return;
        }

        setTools(payload.data.tools);

        const firstTool = payload.data.tools[0];

        if (firstTool) {
          setSelectedToolName(firstTool.name);
          setInputText(JSON.stringify(firstTool.inputExample, null, 2));
        }
      } catch {
        if (!ignore) {
          setError(copy.loadFailed);
          setStatus("error");
          setTimeline([
            {
              id: "load-tools",
              title: "加载工具列表",
              status: "error",
              description: copy.loadFailed,
            },
          ]);
        }
      }
    }

    void loadTools();

    return () => {
      ignore = true;
    };
  }, []);

  const resetResultState = () => {
    setStatus("pending");
    setResult(null);
    setRequestId(null);
    setTimeline(emptyTimeline);
    setError(null);
  };

  const handleToolChange = (toolName: string) => {
    const nextTool = tools.find((tool) => tool.name === toolName);

    setSelectedToolName(toolName);
    setInputText(JSON.stringify(nextTool?.inputExample ?? {}, null, 2));
    setStatus(nextTool?.requiresConfirmation ? "requires_confirmation" : "pending");
    setResult(null);
    setRequestId(null);
    setTimeline(nextTool?.requiresConfirmation ? buildRequiresConfirmationTimeline(toolName) : emptyTimeline);
    setError(null);
  };

  const handleModeChange = (nextMode: ToolMode) => {
    setMode(nextMode);
    resetResultState();
  };

  const handleRun = async () => {
    if (status === "running") {
      return;
    }

    if (mode === "manual") {
      await runManualTool();
      return;
    }

    await runAiToolCalling();
  };

  const runManualTool = async () => {
    if (!selectedToolName) {
      return;
    }

    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      setStatus("error");
      setError(copy.invalidJson);
      setTimeline([
        {
          id: "validate-json",
          title: "校验输入",
          status: "error",
          description: copy.invalidJson,
        },
      ]);
      return;
    }

    setStatus("running");
    setResult(null);
    setError(null);
    setTimeline(buildManualRunningTimeline(selectedToolName, parsedInput));

    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolName: selectedToolName,
          input: parsedInput,
        }),
      });
      const payload = (await response.json()) as ToolExecutionResponse;

      setResult(payload);
      setRequestId(payload.requestId);
      setStatus(payload.ok ? "success" : "error");
      setTimeline(buildManualResultTimeline(selectedToolName, parsedInput, payload));

      if (!payload.ok) {
        setError(payload.error.message);
      }
    } catch {
      setStatus("error");
      setError(copy.loadFailed);
      setTimeline([
        {
          id: "manual-request",
          title: "执行工具",
          status: "error",
          description: copy.loadFailed,
          toolName: selectedToolName,
          input: parsedInput,
        },
      ]);
    }
  };

  const runAiToolCalling = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    setStatus("running");
    setResult(null);
    setError(null);
    setTimeline(aiRunningTimeline);

    try {
      const response = await fetch("/api/tool-calling/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
        }),
      });
      const payload = (await response.json()) as ToolCallingChatResponse;

      setResult(payload);
      setRequestId(payload.requestId);
      setStatus(payload.ok ? "success" : "error");
      setTimeline(payload.ok ? payload.data.timeline : buildErrorTimeline(payload.error.message));

      if (!payload.ok) {
        setError(payload.error.message);
      }
    } catch {
      setStatus("error");
      setError(copy.loadFailed);
      setTimeline(buildErrorTimeline(copy.loadFailed));
    }
  };

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

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[420px_1fr]">
          <form
            className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRun();
            }}
          >
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-950">{copy.mode}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleModeChange("ai")}
                  type="button"
                  variant={mode === "ai" ? "primary" : "secondary"}
                >
                  {copy.aiMode}
                </Button>
                <Button
                  onClick={() => handleModeChange("manual")}
                  type="button"
                  variant={mode === "manual" ? "primary" : "secondary"}
                >
                  {copy.manualMode}
                </Button>
              </div>
            </div>

            {mode === "manual" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-950" htmlFor="tool-name">
                    {copy.tool}
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
                    disabled={status === "running"}
                    id="tool-name"
                    onChange={(event) => handleToolChange(event.target.value)}
                    value={selectedToolName}
                  >
                    {tools.map((tool) => (
                      <option key={tool.name} value={tool.name}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                  {selectedTool ? (
                    <p className="text-xs leading-5 text-zinc-500">
                      {selectedTool.description}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-950" htmlFor="tool-input">
                    {copy.input}
                  </label>
                  <Textarea
                    className="min-h-72 font-mono"
                    disabled={status === "running"}
                    id="tool-input"
                    onChange={(event) => setInputText(event.target.value)}
                    value={inputText}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950" htmlFor="tool-prompt">
                  {copy.prompt}
                </label>
                <Textarea
                  className="min-h-72"
                  disabled={status === "running"}
                  id="tool-prompt"
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={copy.promptPlaceholder}
                  value={prompt}
                />
              </div>
            )}

            <Button disabled={status === "running"} type="submit">
              {status === "running" ? copy.running : copy.run}
            </Button>
          </form>

          <section className="flex min-h-0 flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusTile label={copy.status} value={statusLabel(status)} />
              <StatusTile label={copy.mode} value={mode === "ai" ? copy.aiMode : copy.manualMode} />
              <StatusTile label={copy.requestId} value={requestId ?? "-"} />
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
              <TimelinePanel steps={timeline} />
              <ResultPanel finalAnswer={finalAnswer} result={result} />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-zinc-950">{value}</div>
    </div>
  );
}

function TimelinePanel({ steps }: { steps: ToolTimelineStep[] }) {
  return (
    <section className="min-h-0 rounded-md border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold text-zinc-950">{copy.timeline}</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li className="grid grid-cols-[24px_1fr] gap-3" key={step.id}>
            <span className={cn("mt-1 h-3 w-3 rounded-full", stepDotClass(step.status))} />
            <div className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-zinc-950">{step.title}</h3>
                <span className={cn("rounded-full px-2 py-1 text-xs font-medium", stepBadgeClass(step.status))}>
                  {stepStatusLabel(step.status)}
                </span>
              </div>
              {step.description ? <p className="mt-1 text-xs leading-5 text-zinc-600">{step.description}</p> : null}
              {step.toolName ? <p className="mt-2 text-xs font-medium text-zinc-500">{step.toolName}</p> : null}
              {step.input !== undefined ? <JsonBlock label="input" value={step.input} /> : null}
              {step.output !== undefined ? <JsonBlock label="output" value={step.output} /> : null}
              {step.error ? <JsonBlock label="error" value={step.error} /> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResultPanel({
  finalAnswer,
  result,
}: {
  finalAnswer: string;
  result: ToolExecutionResponse | ToolCallingChatResponse | null;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-md border border-zinc-200 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">{copy.result}</h2>
      {finalAnswer ? (
        <div className="mt-3 rounded-md border border-zinc-700 bg-zinc-900 p-3">
          <div className="text-xs font-medium text-zinc-400">{copy.finalAnswer}</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-50">{finalAnswer}</p>
        </div>
      ) : null}
      <div className="mt-3 text-xs font-medium text-zinc-400">{copy.rawJson}</div>
      <pre className="mt-2 max-h-[520px] flex-1 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-100">
        {result ? JSON.stringify(result, null, 2) : copy.emptyOutput}
      </pre>
    </section>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-zinc-500">{label}</summary>
      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-white p-2 text-xs leading-5 text-zinc-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function statusLabel(status: ToolStatus): string {
  const labels: Record<ToolStatus, string> = {
    pending: copy.pending,
    running: copy.runningStatus,
    success: copy.success,
    error: copy.error,
    requires_confirmation: copy.requiresConfirmation,
  };

  return labels[status];
}

function stepStatusLabel(status: ToolStepStatus): string {
  const labels: Record<ToolStepStatus, string> = {
    pending: copy.pending,
    running: copy.runningStatus,
    success: copy.success,
    error: copy.error,
    skipped: copy.skipped,
    requires_confirmation: copy.requiresConfirmation,
  };

  return labels[status];
}

function stepDotClass(status: ToolStepStatus): string {
  const classes: Record<ToolStepStatus, string> = {
    pending: "bg-zinc-300",
    running: "bg-blue-500",
    success: "bg-emerald-500",
    error: "bg-red-500",
    skipped: "bg-zinc-400",
    requires_confirmation: "bg-amber-500",
  };

  return classes[status];
}

function stepBadgeClass(status: ToolStepStatus): string {
  const classes: Record<ToolStepStatus, string> = {
    pending: "bg-zinc-100 text-zinc-600",
    running: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    error: "bg-red-50 text-red-700",
    skipped: "bg-zinc-100 text-zinc-500",
    requires_confirmation: "bg-amber-50 text-amber-700",
  };

  return classes[status];
}

function buildManualRunningTimeline(toolName: string, input: unknown): ToolTimelineStep[] {
  return [
    {
      id: "validate-json",
      title: "校验输入",
      status: "success",
      description: "输入 JSON 已通过浏览器侧解析。",
      input,
    },
    {
      id: "execute-tool",
      title: "执行工具",
      status: "running",
      description: "服务端正在校验工具 schema 并执行工具。",
      toolName,
      input,
    },
  ];
}

function buildManualResultTimeline(
  toolName: string,
  input: unknown,
  response: ToolExecutionResponse,
): ToolTimelineStep[] {
  if (response.ok) {
    return [
      {
        id: "validate-json",
        title: "校验输入",
        status: "success",
        description: "输入 JSON 已通过解析。",
        input,
      },
      {
        id: "execute-tool",
        title: "执行工具",
        status: "success",
        description: "工具执行完成。",
        toolName,
        input,
        output: response.data.output,
      },
    ];
  }

  return [
    {
      id: "validate-json",
      title: "校验输入",
      status: "success",
      description: "输入 JSON 已通过解析。",
      input,
    },
    {
      id: "execute-tool",
      title: "执行工具",
      status: "error",
      description: "工具执行失败。",
      toolName,
      input,
      error: response.error,
    },
  ];
}

function buildRequiresConfirmationTimeline(toolName: string): ToolTimelineStep[] {
  return [
    {
      id: "confirmation",
      title: "等待用户确认",
      status: "requires_confirmation",
      description: "该工具需要确认后才能执行。",
      toolName,
    },
  ];
}

function buildErrorTimeline(message: string): ToolTimelineStep[] {
  return [
    {
      id: "request-error",
      title: "请求失败",
      status: "error",
      description: message,
    },
  ];
}
