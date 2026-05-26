import type { ChatMessage as ChatMessageType, ChatStatus } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";

type ChatMessageListProps = {
  messages: ChatMessageType[];
  status: ChatStatus;
};

const copy = {
  emptyTitle: "开始一次 AI 对话",
  emptyDescription:
    "输入一个问题，页面会通过服务端 /api/chat 调用模型，并流式显示回答。",
  ariaLabel: "聊天消息",
  loading: "正在连接模型...",
};

export function ChatMessageList({ messages, status }: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold text-zinc-950">{copy.emptyTitle}</h2>
          <p className="text-sm leading-6 text-zinc-500">{copy.emptyDescription}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={copy.ariaLabel}
      className="flex min-h-80 flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {status === "loading" ? (
        <div className="text-sm text-zinc-500" role="status">
          {copy.loading}
        </div>
      ) : null}
    </section>
  );
}
