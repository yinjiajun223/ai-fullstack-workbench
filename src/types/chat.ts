export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatStatus = "empty" | "loading" | "streaming" | "success" | "error";

export type ChatModelOption = {
  id: string;
  label: string;
  role: "chat" | "fast" | "reasoning";
};

export type ChatUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ChatRunMeta = {
  requestId?: string;
  model?: string;
  usage?: ChatUsage;
};
