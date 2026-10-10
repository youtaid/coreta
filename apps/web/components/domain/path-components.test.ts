import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import LearningPathPage from "../../app/(siswa)/belajar/page";
import {
  TODAY,
  dailyGoal,
  nextWorksheet,
  pathActivity,
  pathStages,
  todayCount,
} from "../../lib/mock/path";
import { DailyTargetCard } from "./daily-target-card";
import { PathMap } from "./path-map";

function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

// Halaman membaca Supabase lewat lib/queries/student; di tes diganti data contoh yang sama.
vi.mock("@/lib/queries/student", () => ({
  getCurrentStudent: async () => ({ id: "siswa", goal: "both", daily_target: dailyGoal }),
  getLearningPath: async () => ({
    stages: pathStages,
    nextWorksheet,
    today: TODAY,
    todayCount,
    dailyGoal,
    activity: pathActivity,
  }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("PathMap", () => {
  const html = renderToStaticMarkup(
    createElement(PathMap, {
      stages: pathStages,
      stageHref: (stage) => `/belajar/worksheet?tahap=${stage.number}`,
    }),
  );

  it("renders nine stages in order", () => {
    expect(count(html, "<li ")).toBe(9);
    for (let n = 0; n <= 8; n += 1) expect(html).toContain(`Tahap ${n}<`);
  });

  it("shows the three statuses in words", () => {
    expect(count(html, ">Tuntas<")).toBe(3);
    expect(count(html, "Sedang dipelajari")).toBe(1);
    expect(count(html, ">Terkunci<")).toBe(5);
  });

  it("marks the active stage as the current step", () => {
    expect(count(html, 'aria-current="step"')).toBe(1);
  });

  it("links open stages only", () => {
    expect(count(html, "<a ")).toBe(4);
    expect(html).toContain('href="/belajar/worksheet?tahap=3"');
    expect(html).not.toContain('href="/belajar/worksheet?tahap=4"');
    expect(count(html, 'aria-disabled="true"')).toBe(5);
  });

  it("draws a connector between nodes but not after the last one", () => {
    expect(count(html, "h-[calc(100%+0.5rem)]")).toBe(8);
  });
});

describe("DailyTargetCard", () => {
  const render = (done: number, streak: number) =>
    renderToStaticMarkup(createElement(DailyTargetCard, { done, goal: 6, streak }));

  it("shows what is left before the target", () => {
    const html = render(2, 0);
    expect(html).toContain("Tinggal 4 soal lagi");
    expect(html).toContain("Capai target hari ini untuk memulai rangkaian");
  });

  it("celebrates a reached target and the streak", () => {
    const html = render(6, 2);
    expect(html).toContain("Target tercapai");
    expect(html).toContain("2 hari beruntun mencapai target");
  });
});

describe("/belajar page", () => {
  let html = "";
  beforeAll(async () => {
    html = renderToStaticMarkup(await LearningPathPage());
  });

  it("sends 'Lanjut belajar' to the worksheet list", () => {
    expect(html).toMatch(/<a[^>]*href="\/belajar\/worksheet"[^>]*>Lanjut belajar/);
  });

  it("keeps 'Lanjut belajar' a link for assistive tech", () => {
    const anchor = html.match(/<a[^>]*>Lanjut belajar/)?.[0] ?? "";
    expect(anchor).not.toContain('role="button"');
    expect(anchor).toContain("h-12");
  });

  it("shows the active stage, the daily target, and the map", () => {
    expect(html).toContain("Tahap 3 · Persamaan Kuadrat");
    expect(html).toContain("Target hari ini");
    expect(html).toContain("3 dari 9 tahap tuntas");
    expect(html).toContain('aria-label="Peta tahap belajar"');
  });
});
