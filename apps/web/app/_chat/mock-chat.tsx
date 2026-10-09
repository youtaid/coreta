"use client";

import { ChatPanel } from "@/components/domain/chat-panel";
import { assistantName, getMockReply, type HelpAudience, initialMessages } from "@/lib/mock/chat";

// The page is a server component and cannot hand `getReply` to the chat panel, so this thin
// client wrapper binds the mock data to it. It disappears when the real assistant is connected.
export function MockChat({ audience }: { audience: HelpAudience }) {
  return (
    <ChatPanel
      title="Bantuan"
      assistantName={assistantName}
      initialMessages={initialMessages[audience]}
      getReply={(text) => getMockReply(audience, text)}
      placeholder={audience === "siswa" ? "Tulis pertanyaanmu…" : "Tulis pertanyaan Anda…"}
    />
  );
}
