import { Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AgentConversation, AgentLabel } from "@/lib/domain";
import { formatRupiah } from "@/lib/format";

interface AgentLogListProps {
  conversations: readonly AgentConversation[];
  labelNames: Readonly<Record<AgentLabel, string>>;
}

const statusMeta: Record<
  AgentConversation["status"],
  { label: string; variant: "success" | "secondary" | "warning" }
> = {
  resolved: { label: "Selesai", variant: "success" },
  open: { label: "Berjalan", variant: "secondary" },
  escalated: { label: "Dieskalasi", variant: "warning" },
};

/** Read-only list of assistant conversations with their complaint label and tool calls. */
export function AgentLogList({ conversations, labelNames }: AgentLogListProps) {
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {conversations.map((conversation) => {
        const status = statusMeta[conversation.status];
        return (
          <li
            key={conversation.id}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
          >
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tabular-nums">{conversation.id}</span>
                <Badge variant="outline">{labelNames[conversation.label]}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                {conversation.audience === "parent" ? "Orang tua" : "Siswa"} · tingkat{" "}
                {conversation.level} · {conversation.messageCount} pesan ·{" "}
                {conversation.startedLabel}
              </p>
              {conversation.toolCalls.length > 0 && (
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Wrench className="size-4 text-muted-foreground" aria-hidden />
                  <span className="sr-only">Panggilan alat: </span>
                  {conversation.toolCalls.map((tool) => (
                    <code key={tool} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {tool}
                    </code>
                  ))}
                </p>
              )}
            </div>
            <p className="font-semibold tabular-nums">{formatRupiah(conversation.costIdr)}</p>
          </li>
        );
      })}
    </ul>
  );
}
