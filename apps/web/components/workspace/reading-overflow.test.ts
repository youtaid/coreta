import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getMockWorkspaceAssignment,
  mockOverflowQuestions,
  mockWorkspaceAssignment,
} from "../../lib/mock/workspace";
import { countWords, resolveLayout } from "../../lib/workspace-fit";
import { FloatingWindow } from "./floating-window";
import { ReadingPanel } from "./reading-panel";
import { WorkspaceLayout } from "./workspace-layout";

const [longReading] = mockOverflowQuestions;

describe("overflow mock data", () => {
  it("has a reading passage of about 600 words", () => {
    const words = countWords(longReading.stimulus?.bodyText ?? "");
    expect(words).toBeGreaterThanOrEqual(600);
    expect(words).toBeLessThan(700);
  });

  it("resolves by assignment id and falls back to the default demo", () => {
    expect(getMockWorkspaceAssignment("demo-bacaan-panjang").questions).toBe(mockOverflowQuestions);
    expect(getMockWorkspaceAssignment("apa-saja")).toBe(mockWorkspaceAssignment);
  });
});

describe("ReadingPanel", () => {
  it("shows the real word count and a keyboard-focusable scroll region", () => {
    const html = renderToStaticMarkup(
      createElement(ReadingPanel, { stimulus: longReading.stimulus! }),
    );
    expect(html).toContain(`${countWords(longReading.stimulus!.bodyText)} kata`);
    expect(html).toContain('data-testid="reading-panel-scroll"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("overflow-y-auto");
  });
});

describe("FloatingWindow", () => {
  const props = { title: "Grafik", children: createElement("p", null, "isi") };
  const html = renderToStaticMarkup(createElement(FloatingWindow, props));

  it("renders a draggable handle and a minimize button with 44 px targets", () => {
    expect(html).toContain("touch-none");
    expect(html).toContain("Geser jendela Grafik");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("min-h-touch");
    expect(html).toContain("min-w-touch");
  });

  it("is anchored to the bottom-right corner until it is moved", () => {
    expect(html).toContain("right-2");
    expect(html).toContain("bottom-2");
    expect(html).not.toContain("left:");
  });
});

describe("WorkspaceLayout with overflowing content", () => {
  const render = (index: number) =>
    renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question: mockOverflowQuestions[index],
        questions: mockOverflowQuestions,
        currentQuestionIndex: index,
      }),
    );

  it("switches a declared-standar question to reading mode because of its stimulus", () => {
    expect(longReading.layoutMode).toBe("standar");
    expect(resolveLayout(longReading).mode).toBe("bacaan");
    const html = render(0);
    expect(html).toContain("Mode Bacaan");
    expect(html).toContain("Panel Stimulus Bacaan");
    expect(html).not.toContain('data-testid="floating-window"');
  });

  it("floats media that accompanies a reading passage", () => {
    const html = render(1);
    expect(html).toContain("Mode Bacaan");
    expect(html).toContain('data-testid="floating-window"');
    expect(html).toContain("Grafik Luas Petak L(x)");
  });

  it("keeps the page itself locked to one screen", () => {
    const html = render(1);
    expect(html).toContain("h-[100dvh]");
    expect(html).toContain("overflow-hidden");
    expect(html.match(/data-testid="reading-panel-scroll"/g)).toHaveLength(1);
  });
});
