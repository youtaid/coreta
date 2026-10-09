import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentLogList } from "../../components/domain/agent-log-list";
import { ReviewQueue } from "../../components/domain/review-queue";
import { SlaCountdown } from "../../components/domain/sla-countdown";
import { slaLevel } from "../sla";
import {
  agentConversations,
  agentLabelNames,
  aiCostByDay,
  failedJobs,
  hintReportReasonLabels,
  hintReports,
} from "./admin";

describe("hint report mock data", () => {
  const open = hintReports.filter((r) => r.status === "open");

  it("covers all three countdown states among open reports", () => {
    const levels = open.map((r) => slaLevel(r.dueInMinutes * 60_000));
    expect(new Set(levels)).toEqual(new Set(["ok", "urgent", "overdue"]));
  });

  it("covers every status and every reason", () => {
    expect(new Set(hintReports.map((r) => r.status))).toEqual(
      new Set(["open", "valid", "revised", "item_flagged"]),
    );
    for (const report of hintReports) {
      expect(hintReportReasonLabels[report.reason]).toBeTruthy();
    }
  });

  it("links every report to an editable item", () => {
    for (const report of hintReports) expect(report.itemId).toMatch(/^item-/);
  });
});

describe("SlaCountdown", () => {
  it("renders an inert placeholder before the clock starts, so hydration matches", () => {
    const html = renderToStaticMarkup(createElement(SlaCountdown, { dueInMinutes: 90 }));
    expect(html).toContain("--:--:--");
    expect(html).not.toContain("role=");
  });
});

describe("ReviewQueue", () => {
  const html = renderToStaticMarkup(
    createElement(ReviewQueue, { reports: hintReports, reasonLabels: hintReportReasonLabels }),
  );

  it("lists the overdue report first, ahead of later deadlines", () => {
    const overdue = hintReports.find((r) => r.dueInMinutes < 0)!;
    const later = hintReports.find((r) => r.dueInMinutes === 22 * 60)!;
    expect(html.indexOf(overdue.itemCode)).toBeGreaterThan(-1);
    expect(html.indexOf(`laporan ${overdue.itemCode}`)).toBeLessThan(
      html.indexOf(`laporan ${later.itemCode}`),
    );
  });

  it("shows a status filter with counts and a review button on every row", () => {
    expect(html).toContain('aria-label="Filter status laporan"');
    expect(html.match(/aria-pressed/g)).toHaveLength(5);
    expect(html.match(/Tinjau<span/g)).toHaveLength(hintReports.length);
  });
});

describe("admin lists", () => {
  it("never reports more attempts than the limit", () => {
    expect(failedJobs.length).toBeGreaterThan(0);
    for (const job of failedJobs) expect(job.attempts).toBeLessThanOrEqual(job.maxAttempts);
  });

  it("shows tool calls, and only first-line conversations have none", () => {
    const html = renderToStaticMarkup(
      createElement(AgentLogList, {
        conversations: agentConversations,
        labelNames: agentLabelNames,
      }),
    );
    expect(html).toContain("refund_per_policy");
    for (const c of agentConversations.filter((c) => c.level === 1)) {
      expect(c.toolCalls).toEqual([]);
    }
  });

  it("lists seven days of AI cost, newest first", () => {
    expect(aiCostByDay).toHaveLength(7);
    expect(aiCostByDay[0]?.dayLabel).toBe("Rab 7 Okt");
  });
});
