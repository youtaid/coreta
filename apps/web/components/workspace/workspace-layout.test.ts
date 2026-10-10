import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { mockWorkspaceQuestions } from "../../lib/mock/workspace";
import { WorkspaceLayout } from "./workspace-layout";
import { QuestionPanel } from "./question-panel";
import { ScratchArea } from "./scratch-area";

describe("WorkspaceLayout", () => {
  const [qStandar, qMedia, qBacaan] = mockWorkspaceQuestions;

  it("enforces single-screen 100dvh without scroll on the root container", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qStandar,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 0,
        totalQuestions: 3,
      }),
    );

    // Root element must be fixed, 100dvh, and overflow-hidden (Rule 9 / DoD)
    expect(html).toContain('data-testid="workspace-root"');
    expect(html).toContain("h-[100dvh]");
    expect(html).toContain("max-h-[100dvh]");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("fixed inset-0");
  });

  it("renders standard mode with question panel and scratch grid", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qStandar,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 0,
      }),
    );

    expect(html).toContain("Mode Standar");
    expect(html).toContain("Area Coretan — Mode Standar");
    expect(html).toContain("Fungsi Kuadrat &amp; Determinan");
    expect(html).toContain("k &lt; 3");
    // Should not render media or reading panel
    expect(html).not.toContain("Panel Stimulus Bacaan");
    expect(html).not.toContain("Media Stimulus Soal");
  });

  it("renders media mode with diagram and coordinates", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qMedia,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 1,
      }),
    );

    expect(html).toContain("Mode Media");
    expect(html).toContain("Area Coretan — Mode Media");
    expect(html).toContain("Grafik Kurva Kuadrat pada Bidang Kartesius");
    expect(html).toContain("P(2, -1)");
    expect(html).toContain("Vektor HD");
  });

  it("renders reading mode where reading panel is the only scrollable area", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qBacaan,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 2,
      }),
    );

    expect(html).toContain("Mode Bacaan");
    expect(html).toContain("Area Coretan — Mode Bacaan");
    expect(html).toContain("Panel Stimulus Bacaan");
    expect(html).toContain("Optimalisasi Efisiensi Pewarna Alami UMKM Batik Yogya");
    expect(html).toContain('data-testid="reading-panel-scroll"');
    expect(html).toContain("overflow-y-auto");
  });

  it("provides touch targets >= 44px (min-h-touch) on all navigation and action buttons", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qStandar,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 0,
      }),
    );

    // Nav and action buttons must include min-h-touch / min-w-touch
    expect(html).toContain("min-h-touch");
    expect(html).toContain("min-w-touch");
    expect(html).toContain("Laporkan");
    expect(html).toContain("Petunjuk");
    expect(html).toContain("Tersimpan di perangkat");
  });

  it("shows 'Kirim' on the final question and 'Selanjutnya' on intermediate questions", () => {
    const htmlIntermediate = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: qStandar,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: 0,
      }),
    );
    expect(htmlIntermediate).toContain("Selanjutnya");

    const finalQuestion = mockWorkspaceQuestions[mockWorkspaceQuestions.length - 1]!;
    const htmlFinal = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: finalQuestion,
        questions: mockWorkspaceQuestions,
        currentQuestionIndex: mockWorkspaceQuestions.length - 1,
      }),
    );
    expect(htmlFinal).toContain("Kirim");
  });
});

describe("QuestionPanel", () => {
  it("renders prompt, tier badge, and 5 option buttons with min-h-touch", () => {
    const q = mockWorkspaceQuestions[0];
    const html = renderToStaticMarkup(
      createElement(QuestionPanel, {
        question: q,
        selectedOptionId: "opt-1-a",
      }),
    );

    expect(html).toContain("Soal 1");
    expect(html).toContain("Mahir");
    expect(html).toContain("MAT-SMA-ALJ-01");
    expect(html).toContain("min-h-touch");
    expect(html).toContain('role="radiogroup"');
  });
});

describe("ScratchArea", () => {
  it("renders 24px grid pattern and instructional watermark", () => {
    const html = renderToStaticMarkup(createElement(ScratchArea, { label: "Area Coretan" }));

    expect(html).toContain("workspace-grid-pattern");
    expect(html).toContain("Kertas Berpetak 24px");
    // The ink toolbar and canvas replace the earlier placeholder text.
    expect(html).toContain('role="toolbar"');
    expect(html).toContain("<canvas");
    for (const name of ["Pena", "Penghapus", "Urungkan", "Ulangi", "Bersihkan"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
  });

  it("menampilkan skor pecahan 0-1 sebagai persen", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: mockWorkspaceQuestions[0],
        questions: mockWorkspaceQuestions,
        submissionStatus: "graded",
        overallScore: 0.625,
      }),
    );
    expect(html.replace(/<!-- -->/g, "")).toContain("Skor: 63%");
  });
});
