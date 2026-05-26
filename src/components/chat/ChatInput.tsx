"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  value: string;
  disabled: boolean;
  isGenerating: boolean;
  canRegenerate: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onRegenerate: () => void;
};

const copy = {
  label: "输入消息",
  placeholder: "输入消息。Enter 发送，Shift + Enter 换行。",
  hint: "模型调用只会通过服务端 API Route 发生。",
  regenerate: "重新生成",
  stop: "停止",
  send: "发送",
};

export function ChatInput({
  value,
  disabled,
  isGenerating,
  canRegenerate,
  onChange,
  onSubmit,
  onStop,
  onRegenerate,
}: ChatInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-input">
        {copy.label}
      </label>
      <Textarea
        disabled={disabled}
        id="chat-input"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={copy.placeholder}
        value={value}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">{copy.hint}</p>
        <div className="flex gap-2">
          <Button disabled={!canRegenerate || isGenerating} onClick={onRegenerate} type="button" variant="secondary">
            {copy.regenerate}
          </Button>
          {isGenerating ? (
            <Button onClick={onStop} type="button" variant="danger">
              {copy.stop}
            </Button>
          ) : (
            <Button disabled={disabled || value.trim().length === 0} type="submit">
              {copy.send}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
