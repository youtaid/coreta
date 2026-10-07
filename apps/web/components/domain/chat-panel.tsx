"use client";

import { Bot, Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  title: string;
  assistantName: string;
  initialMessages: readonly ChatMessage[];
  /** Produces the assistant's answer to a message; stands in for the real assistant. */
  getReply: (text: string) => string;
  /** Formats the time shown under a new message. */
  getTimeLabel?: () => string;
  /** Delay before the assistant answers, so the typing indicator is visible. */
  replyDelayMs?: number;
  placeholder?: string;
  className?: string;
}

const defaultTimeLabel = () =>
  new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Chat with local state only: messages live in memory and the answer comes from `getReply`. */
export function ChatPanel({
  title,
  assistantName,
  initialMessages,
  getReply,
  getTimeLabel = defaultTimeLabel,
  replyDelayMs = 700,
  placeholder = "Tulis pertanyaanmu…",
  className,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [...initialMessages]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(initialMessages.length + 1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);

  function append(role: ChatMessage["role"], text: string) {
    const id = `msg-${nextId.current++}`;
    setMessages((current) => [...current, { id, role, text, timeLabel: getTimeLabel() }]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    append("user", text);
    setDraft("");
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        append("assistant", getReply(text));
        setTyping(false);
      }, replyDelayMs),
    );
  }

  return (
    <section
      aria-label={title}
      className={cn(
        "flex h-[32rem] max-h-[calc(100dvh-14rem)] min-h-80 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-heading font-semibold">{assistantName}</h2>
          <p className="text-xs text-muted-foreground">Balasan contoh, belum terhubung</p>
        </div>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-label="Percakapan"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              message.role === "user" ? "items-end" : "items-start",
            )}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-base break-words whitespace-pre-wrap",
                message.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted text-foreground",
              )}
            >
              <span className="sr-only">
                {message.role === "user" ? "Kamu: " : `${assistantName}: `}
              </span>
              {message.text}
            </p>
            <span className="px-1 text-xs text-muted-foreground">{message.timeLabel}</span>
          </div>
        ))}
        {typing && (
          <p className="text-sm text-muted-foreground" role="status">
            {assistantName} sedang mengetik…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label="Tulis pesan"
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" disabled={draft.trim() === ""}>
          <Send aria-hidden data-icon="inline-start" />
          Hubungi asisten
        </Button>
      </form>
    </section>
  );
}
