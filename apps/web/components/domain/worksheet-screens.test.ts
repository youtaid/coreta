import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import WorksheetResultPage from "../../app/(siswa)/belajar/hasil/[assignmentId]/page";
import WorksheetListPage from "../../app/(siswa)/belajar/worksheet/page";
import { worksheets } from "../../lib/mock/learning";
import {
  filterByStage,
  parseStageFilter,
  stageFilterHref,
  stageFilterOptions,
} from "../../lib/mock/worksheets";

async function renderList(query: Record<string, string> = {}) {
  const element = await WorksheetListPage({ searchParams: Promise.resolve(query) });
  return renderToStaticMarkup(element);
}

async function renderResult(assignmentId: string) {
  const element = await WorksheetResultPage({ params: Promise.resolve({ assignmentId }) });
  return renderToStaticMarkup(element);
}

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("stage filter helpers", () => {
  it.each([
    ["3", 3],
    ["0", 0],
    ["8", 8],
    ["9", null],
    ["-1", null],
    ["3.5", null],
    ["abc", null],
    ["", null],
  ])("parses %j as %j", (value, expected) => {
    expect(parseStageFilter(value)).toBe(expected);
  });

  it("ignores missing and repeated values", () => {
    expect(parseStageFilter(undefined)).toBeNull();
    expect(parseStageFilter(["2", "3"])).toBeNull();
  });

  it("offers stages that have worksheets plus the selected one", () => {
    expect(stageFilterOptions(worksheets, null)).toEqual([2, 3]);
    expect(stageFilterOptions(worksheets, 0)).toEqual([0, 2, 3]);
  });

  it("filters by stage number", () => {
    expect(filterByStage(worksheets, 2).map((w) => w.id)).toEqual(["ws-mock-205", "ws-mock-201"]);
    expect(filterByStage(worksheets, null)).toHaveLength(worksheets.length);
  });

  it("builds filter links", () => {
    expect(stageFilterHref(null)).toBe("/belajar/worksheet");
    expect(stageFilterHref(3)).toBe("/belajar/worksheet?tahap=3");
  });
});

describe("/belajar/worksheet", () => {
  it("lists every worksheet in three sections", async () => {
    const html = await renderList();
    expect(html).toContain(">Minggu ini<");
    expect(html).toContain(">Ulang berjarak<");
    expect(html).toContain(">Selesai<");
    expect(count(html, 'data-slot="card"')).toBe(4);
  });

  it("links the completed worksheet to its result page", async () => {
    const html = await renderList();
    expect(html).toMatch(/<a[^>]*href="\/belajar\/hasil\/ws-mock-201"[^>]*>Lihat hasil<\/a>/);
  });

  it("filters by ?tahap and marks the active chip", async () => {
    const html = await renderList({ tahap: "3" });
    expect(count(html, 'data-slot="card"')).toBe(2);
    expect(html).not.toContain("Fungsi Linear &amp; Grafik");
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Tahap 3<\/a>/);
  });

  it("shows an empty state for a stage without worksheets", async () => {
    const html = await renderList({ tahap: "0" });
    expect(count(html, 'data-slot="card"')).toBe(0);
    expect(html).toContain("Belum ada worksheet untuk Tahap\u00a00");
    expect(html).toMatch(/<a[^>]*href="\/belajar\/worksheet"[^>]*>Lihat semua worksheet<\/a>/);
  });

  it("falls back to all worksheets for an invalid filter", async () => {
    const html = await renderList({ tahap: "x" });
    expect(count(html, 'data-slot="card"')).toBe(4);
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>Semua tahap<\/a>/);
  });

  it("renders card actions as links, not role=button", async () => {
    const html = await renderList();
    expect(html).not.toContain('role="button"');
  });
});

describe("/belajar/hasil/[assignmentId]", () => {
  it("summarises the score and outcomes", async () => {
    const html = await renderResult("ws-mock-201");
    expect(html).toContain("81%");
    expect(html).toMatch(/Benar[\s\S]*6/);
    expect(count(html, "<li>")).toBe(8);
  });

  it("writes partial points with a decimal comma", async () => {
    const html = await renderResult("ws-mock-201");
    const text = html.replace(/<!-- -->/g, "");
    expect(text).toContain("Sebagian benar · 0,5/1");
    expect(text).not.toContain("0.5/1");
  });

  it("keeps every explanation collapsed by default", async () => {
    const html = await renderResult("ws-mock-201");
    expect(count(html, "<details")).toBe(8);
    expect(html).not.toMatch(/<details[^>]*\sopen/);
  });

  it("links back to the worksheet list", async () => {
    const html = await renderResult("ws-mock-201");
    expect(html).toMatch(/<a[^>]*href="\/belajar\/worksheet"[^>]*>Daftar worksheet<\/a>/);
    expect(html).not.toContain('role="button"');
  });

  it("answers 404 for an unknown assignment", async () => {
    await expect(renderResult("tidak-ada")).rejects.toThrow();
  });
});
