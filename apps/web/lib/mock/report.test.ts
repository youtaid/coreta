import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HandwritingSample } from "../../components/domain/handwriting-sample";
import { TrendChart } from "../../components/domain/trend-chart";
import { children, getWeeklyReport, weeklyReports, weeklyTrend } from "./report";

describe("weekly reports", () => {
  it("resolves by week id and returns undefined for unknown weeks", () => {
    expect(getWeeklyReport("2026-W40")?.studentName).toBe("Raka");
    expect(getWeeklyReport("2026-W01")).toBeUndefined();
  });

  it("lists the newest report first, matching the end of the trend", () => {
    expect(weeklyReports[0]?.weekId).toBe(weeklyTrend.at(-1)?.weekId);
  });

  it("gives every report all sections the screen needs", () => {
    for (const report of weeklyReports) {
      expect(report.stats.map((s) => s.label)).toEqual([
        "Hari belajar",
        "Soal dikerjakan",
        "Waktu belajar",
        "Akurasi",
      ]);
      expect(report.competencies.length).toBeGreaterThan(0);
      expect(report.attention.length).toBeGreaterThan(0);
      expect(report.sampleInk.altText.length).toBeGreaterThan(20);
      expect(report.plan).toHaveLength(2);
    }
  });

  it("agrees with the trend on items done and accuracy", () => {
    for (const report of weeklyReports) {
      const point = weeklyTrend.find((p) => p.weekId === report.weekId);
      expect(report.stats.find((s) => s.label === "Soal dikerjakan")?.value).toBe(
        String(point?.itemsDone),
      );
      expect(report.stats.find((s) => s.label === "Akurasi")?.value).toBe(
        `${Math.round((point?.accuracy ?? 0) * 100)}%`,
      );
    }
  });
});

describe("children", () => {
  it("has a code login with a four-character-plus code for the demo child", () => {
    expect(children[0]?.loginMethod).toBe("code");
    expect(children[0]?.loginLabel).toMatch(/^[A-Z]+-\d{4}$/);
  });
});

describe("TrendChart", () => {
  const html = renderToStaticMarkup(
    createElement(TrendChart, {
      points: weeklyTrend,
      hrefs: { "2026-W40": "/ortu/laporan/2026-W40" },
    }),
  );

  it("prints the exact accuracy and links only weeks that have a report", () => {
    expect(html).toContain("78%");
    expect(html.match(/href=/g)).toHaveLength(1);
    expect(html).toContain('href="/ortu/laporan/2026-W40"');
  });

  it("exposes each bar as a meter with a label", () => {
    expect(html.match(/role="meter"/g)).toHaveLength(weeklyTrend.length);
  });
});

describe("HandwritingSample", () => {
  const sample = weeklyReports[0]!.sampleInk;
  const html = renderToStaticMarkup(createElement(HandwritingSample, sample));

  it("describes the handwriting in text and hides the visual lines from screen readers", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain(sample.altText);
    expect(html).toContain("font-hand");
    expect(html).toContain('aria-hidden="true"');
  });
});
