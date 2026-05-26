"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, ChatModelOption, ChatRunMeta, ChatStatus, ChatUsage } from "@/types/chat";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

type ChatApiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

type StreamEvent = {
  event: string;
  data: string;
};

type ChatModelsResponse = {
  ok: true;
  data: {
    defaultModel: string;
    options: ChatModelOption[];
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

const copy = {
  back: "返回工作台",
  title: "AI 聊天",
  description: "用于验证 provider adapter、API Route 和前端交互链路的流式聊天界面。",
  model: "模型",
  modelFallback: "默认模型",
  requestMeta: "请求信息",
  noUsage: "暂无 token 用量",
  modelRequestFailed: "模型请求失败，请稍后重试。",
  emptyStatus: "暂无消息",
  loadingStatus: "正在请求模型",
  streamingStatus: "正在生成回答",
  successStatus: "回答完成",
  errorStatus: "请求失败",
  state: "状态",
  requestId: "请求 ID",
  inputTokens: "输入 token",
  outputTokens: "输出 token",
  totalTokens: "总 token",
};

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("empty");
  const [error, setError] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ChatModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [runMeta, setRunMeta] = useState<ChatRunMeta>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const isGenerating = status === "loading" || status === "streaming";
  const hasAssistantMessage = useMemo(
    () => messages.some((message) => message.role === "assistant"),
    [messages],
  );
  const canRegenerate = useMemo(
    () => !isGenerating && (hasAssistantMessage || isLastMessageFromUser(messages)),
    [hasAssistantMessage, isGenerating, messages],
  );

  useEffect(() => {
    let ignore = false;

    async function loadModels() {
      try {
        const response = await fetch("/api/chat/models", {
          method: "GET",
        });
        const payload = (await response.json()) as ChatModelsResponse;

        if (ignore || !payload.ok) {
          return;
        }

        setModelOptions(payload.data.options);
        setSelectedModel(payload.data.defaultModel);
      } catch {
        if (!ignore) {
          setModelOptions([]);
        }
      }
    }

    void loadModels();

    return () => {
      ignore = true;
    };
  }, []);

  const appendAssistantContent = useCallback((id: string, content: string) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === id
          ? {
              ...message,
              content: `${message.content}${content}`,
            }
          : message,
      ),
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((currentMessages) => currentMessages.filter((message) => message.id !== id));
  }, []);

  const sendMessages = useCallback(
    async (nextMessages: ChatMessage[]) => {
      const assistantId = createMessageId();
      const controller = new AbortController();
      const model = selectedModel || undefined;

      abortControllerRef.current = controller;
      setStatus("loading");
      setError(null);
      setRunMeta({ model });
      setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
      let hasReceivedContent = false;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: toApiMessages(nextMessages),
            model,
            stream: true,
          }),
          signal: controller.signal,
        });

        const responseRequestId = response.headers.get("x-request-id") ?? undefined;

        setRunMeta((currentMeta) => ({
          ...currentMeta,
          requestId: responseRequestId,
        }));

        if (!response.ok || !response.body) {
          throw new Error(copy.modelRequestFailed);
        }

        setStatus("streaming");

        for await (const event of readServerSentEvents(response.body)) {
          if (event.event === "content") {
            const payload = JSON.parse(event.data) as { content?: string; requestId?: string };

            if (payload.requestId) {
              setRunMeta((currentMeta) => ({ ...currentMeta, requestId: payload.requestId }));
            }

            if (payload.content) {
              hasReceivedContent = true;
              appendAssistantContent(assistantId, payload.content);
            }
          }

          if (event.event === "usage") {
            const payload = JSON.parse(event.data) as { usage?: ChatUsage; requestId?: string };

            setRunMeta((currentMeta) => ({
              ...currentMeta,
              requestId: payload.requestId ?? currentMeta.requestId,
              usage: payload.usage ?? currentMeta.usage,
            }));
          }

          if (event.event === "error") {
            const payload = JSON.parse(event.data) as { error?: { message?: string }; requestId?: string };

            if (payload.requestId) {
              setRunMeta((currentMeta) => ({ ...currentMeta, requestId: payload.requestId }));
            }

            throw new Error(payload.error?.message ?? copy.modelRequestFailed);
          }

          if (event.event === "done") {
            const payload = JSON.parse(event.data) as { requestId?: string };

            if (payload.requestId) {
              setRunMeta((currentMeta) => ({ ...currentMeta, requestId: payload.requestId }));
            }

            break;
          }
        }

        setStatus("success");
      } catch (caughtError) {
        if (controller.signal.aborted) {
          setStatus("success");
          return;
        }

        if (hasReceivedContent) {
          setStatus("success");
          return;
        }

        setStatus("error");
        setError(caughtError instanceof Error ? caughtError.message : copy.modelRequestFailed);
        removeMessage(assistantId);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [appendAssistantContent, removeMessage, selectedModel],
  );

  const handleSubmit = useCallback(() => {
    const content = input.trim();

    if (!content || isGenerating) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];

    setInput("");
    void sendMessages(nextMessages);
  }, [input, isGenerating, messages, sendMessages]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRegenerate = useCallback(() => {
    if (isGenerating) {
      return;
    }

    const lastAssistantIndex = findLastAssistantIndex(messages);

    if (lastAssistantIndex !== -1) {
      void sendMessages(messages.slice(0, lastAssistantIndex));
      return;
    }

    if (isLastMessageFromUser(messages)) {
      void sendMessages(messages);
    }
  }, [isGenerating, messages, sendMessages]);

  const selectedModelLabel = getSelectedModelLabel(modelOptions, selectedModel);

  return (
    <main className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <Link className="text-sm font-medium text-zinc-500 hover:text-zinc-950" href="/">
            {copy.back}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{copy.title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">{copy.description}</p>
        </header>

        <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
          <div>
            <label className="text-xs font-medium text-zinc-500" htmlFor="chat-model">
              {copy.model}
            </label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
              disabled={isGenerating}
              id="chat-model"
              onChange={(event) => setSelectedModel(event.target.value)}
              value={selectedModel}
            >
              {modelOptions.length === 0 ? (
                <option value="">{copy.modelFallback}</option>
              ) : (
                modelOptions.map((option) => (
                  <option key={`${option.role}:${option.id}`} value={option.id}>
                    {option.label} · {option.id}
                  </option>
                ))
              )}
            </select>
          </div>

          <ChatRunMetaView meta={runMeta} selectedModelLabel={selectedModelLabel} status={status} />
        </section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="sr-only" role="status">
          {status === "empty" ? copy.emptyStatus : null}
          {status === "loading" ? copy.loadingStatus : null}
          {status === "streaming" ? copy.streamingStatus : null}
          {status === "success" ? copy.successStatus : null}
          {status === "error" ? copy.errorStatus : null}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600">
          {copy.state}: {status}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ChatMessageList messages={messages} status={status} />
          <ChatInput
            canRegenerate={canRegenerate}
            disabled={isGenerating}
            isGenerating={isGenerating}
            onChange={setInput}
            onRegenerate={handleRegenerate}
            onStop={handleStop}
            onSubmit={handleSubmit}
            value={input}
          />
        </div>
      </div>
    </main>
  );
}

function ChatRunMetaView({
  meta,
  selectedModelLabel,
  status,
}: {
  meta: ChatRunMeta;
  selectedModelLabel: string;
  status: ChatStatus;
}) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
      <div className="font-medium text-zinc-950">{copy.requestMeta}</div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <dt>{copy.model}</dt>
        <dd className="truncate text-right text-zinc-950">{meta.model || selectedModelLabel || copy.modelFallback}</dd>
        <dt>{copy.requestId}</dt>
        <dd className="truncate text-right text-zinc-950">{meta.requestId ?? "-"}</dd>
        <dt>{copy.inputTokens}</dt>
        <dd className="text-right text-zinc-950">{meta.usage?.inputTokens ?? "-"}</dd>
        <dt>{copy.outputTokens}</dt>
        <dd className="text-right text-zinc-950">{meta.usage?.outputTokens ?? "-"}</dd>
        <dt>{copy.totalTokens}</dt>
        <dd className="text-right text-zinc-950">{meta.usage?.totalTokens ?? "-"}</dd>
      </dl>
      {status !== "success" && !meta.usage ? <p className="mt-2 text-zinc-500">{copy.noUsage}</p> : null}
    </div>
  );
}

function toApiMessages(messages: ChatMessage[]): ChatApiMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function* readServerSentEvents(body: ReadableStream<Uint8Array>): AsyncIterable<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const rawEvents = buffer.split("\n\n");
    buffer = rawEvents.pop() ?? "";

    for (const rawEvent of rawEvents) {
      const event = parseStreamEvent(rawEvent);

      if (event) {
        yield event;
      }
    }
  }

  if (buffer.trim()) {
    const event = parseStreamEvent(buffer);

    if (event) {
      yield event;
    }
  }
}

function parseStreamEvent(rawEvent: string): StreamEvent | null {
  const lines = rawEvent.split(/\r?\n/);
  const event = lines
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const data = lines
    .find((line) => line.startsWith("data:"))
    ?.slice("data:".length)
    .trim();

  if (!event || !data) {
    return null;
  }

  return { event, data };
}

function findLastAssistantIndex(messages: ChatMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "assistant") {
      return index;
    }
  }

  return -1;
}

function isLastMessageFromUser(messages: ChatMessage[]): boolean {
  return messages[messages.length - 1]?.role === "user";
}

function getSelectedModelLabel(options: ChatModelOption[], selectedModel: string): string {
  const option = options.find((item) => item.id === selectedModel);

  return option ? `${option.label} · ${option.id}` : selectedModel;
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);

    return `msg_${values[0].toString(36)}_${values[1].toString(36)}`;
  }

  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}
