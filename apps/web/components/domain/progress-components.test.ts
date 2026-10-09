import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { initialMessages } from "../../lib/mock/chat";
import { DAILY_GOAL, dailyActivity } from "../../lib/mock/progress";
import { ActivityCalendar } from "./activity-calendar";
import { ChatPanel } from "./chat-panel";

describe("ActivityCalendar", () => {
  const html = renderToStaticMarkup(
    createElement(ActivityCalendar, { days: dailyActivity, goal: DAILY_GOAL }),
  );

  it("renders a table with seven weekday columns and five week rows", () => {
    expect(html.match(/<th /g)).toHaveLength(7);
    expect(html.match(/<tr>/g)).toHaveLength(6); // header row + five weeks
  });

  it("describes each day in words, not only by colour", () => {
    expect(html).toContain('aria-label="7 Oktober: 6 soal, target tercapai"');
    expect(html).toContain('aria-label="5 Oktober: 0 soal, target belum tercapai"');
    expect(html).toContain('aria-label="8 Oktober: belum terjadi"');
  });

  it("uses 44 px cells", () => {
    expect(html).toContain("min-h-touch");
  });
});

describe("ChatPanel", () => {
  const html = renderToStaticMarkup(
    createElement(ChatPanel, {
      title: "Bantuan",
      assistantName: "Asisten Coreta",
      initialMessages: initialMessages.siswa,
      getReply: () => "balasan",
    }),
  );

  it("shows the opening message in a live log", () => {
    expect(html).toContain('role="log"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Aku asisten Coreta");
  });

  it("has a labelled input and a send button that starts disabled", () => {
    expect(html).toContain('aria-label="Tulis pesan"');
    expect(html).toContain("Hubungi asisten");
    expect(html).toMatch(
      /<button[^>]*disabled[^>]*type="submit"|<button[^>]*type="submit"[^>]*disabled/,
    );
  });
});
