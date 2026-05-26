import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "./MarkdownContent";

type ChatMessageProps = {
  message: ChatMessageType;
};

const roleLabels = {
  user: "你",
  assistant: "助手",
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[min(720px,90%)] rounded-lg border px-4 py-3",
          isUser
            ? "border-zinc-950 bg-zinc-950 text-white"
            : "border-zinc-200 bg-white text-zinc-950 shadow-sm",
        )}
      >
        <div className={cn("mb-1 text-xs font-medium", isUser ? "text-zinc-300" : "text-zinc-500")}>
          {isUser ? roleLabels.user : roleLabels.assistant}
        </div>
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
        ) : (
          <MarkdownContent content={message.content || " "} />
        )}
      </div>
    </article>
  );
}
