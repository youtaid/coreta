import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getMockWorkspaceAssignment,
  mockPasteAssignment,
  mockWorkspaceQuestions,
} from "../../lib/mock/workspace";
import { InkCanvas } from "./ink-canvas";
import { MediaPanel } from "./media-panel";
import { PasteLayerSurface } from "./paste-layer";
import { ScratchArea } from "./scratch-area";
import { WorkspaceLayout } from "./workspace-layout";

const pasteTable = mockPasteAssignment.questions[0]!.media!;
const plainDiagram = { ...pasteTable, id: "no-paste", pasteable: undefined };

describe("pasteable media in the mock data", () => {
  it("marks the table question's media as pasteable, and the demo assignment is reachable", () => {
    expect(pasteTable.kind).toBe("table");
    expect(pasteTable.pasteable).toBe(true);
    expect(getMockWorkspaceAssignment("demo-tempel")).toBe(mockPasteAssignment);
  });

  it("marks the parabola diagram as pasteable too", () => {
    expect(mockWorkspaceQuestions[1]?.media?.pasteable).toBe(true);
  });
});

describe("MediaPanel paste button", () => {
  const render = (media: typeof pasteTable, onPaste?: () => void, pastedCount?: number) =>
    renderToStaticMarkup(createElement(MediaPanel, { media, onPaste, pastedCount }));

  it("shows a 'Tempel' button for pasteable media when pasting is wired up", () => {
    const html = render(pasteTable, () => {});
    expect(html).toContain("Tempel");
    expect(html).toContain("ke area coretan");
  });

  it("hides it for media that is not pasteable, or when there is nothing to call", () => {
    expect(render(plainDiagram, () => {})).not.toContain("ke area coretan");
    expect(render(pasteTable)).not.toContain("ke area coretan");
  });

  it("shows how many copies are already pasted", () => {
    expect(render(pasteTable, () => {}, 2)).toContain("(2)");
    expect(render(pasteTable, () => {}, 0)).not.toContain("(0)");
  });
});

describe("InkCanvas layer mode", () => {
  const render = (props: Parameters<typeof InkCanvas>[0]) =>
    renderToStaticMarkup(createElement(InkCanvas, props));

  it("offers 'Geser lapisan' only when there are layers", () => {
    expect(render({ layerCount: 0 })).not.toContain("Geser lapisan");
    expect(render({ layerCount: 1 })).toContain('aria-label="Geser lapisan"');
  });

  it("lets the canvas catch input until layers are being moved", () => {
    const html = render({ layerCount: 1, renderUnderlay: () => null });
    // Draw mode is the default, so the canvas itself must not be set to ignore pointers.
    expect(html.match(/<canvas[^>]*>/)?.[0]).not.toContain("pointer-events-none");
  });

  it("starts in draw mode even with layers present", () => {
    const html = render({ layerCount: 1 });
    expect(html).toMatch(
      /aria-pressed="false"[^>]*aria-label="Geser lapisan"|aria-label="Geser lapisan"[^>]*aria-pressed="false"/,
    );
  });
});

describe("PasteLayerSurface", () => {
  it("renders nothing until the canvas has a size, and never blocks the canvas by itself", () => {
    const html = renderToStaticMarkup(
      createElement(PasteLayerSurface, {
        pasted: [{ id: "p1", slot: 0, media: pasteTable }],
        interactive: false,
        onRemove: () => {},
      }),
    );
    expect(html).toContain("pointer-events-none");
    expect(html).not.toContain('data-testid="paste-layer"');
  });
});

describe("ScratchArea with pasted media", () => {
  it("still renders the grid, toolbar, and canvas", () => {
    const html = renderToStaticMarkup(
      createElement(ScratchArea, {
        label: "Area",
        pasted: [{ id: "p1", slot: 0, media: pasteTable }],
      }),
    );
    expect(html).toContain("workspace-grid-pattern");
    expect(html).toContain("<canvas");
    expect(html).toContain('aria-label="Geser lapisan"');
  });
});

describe("WorkspaceLayout", () => {
  it("shows the paste button for the pasteable table, and keeps the page locked to one screen", () => {
    const question = mockPasteAssignment.questions[0]!;
    const html = renderToStaticMarkup(
      createElement(WorkspaceLayout, {
        question,
        questions: mockPasteAssignment.questions,
        currentQuestionIndex: 0,
        totalQuestions: 1,
      }),
    );
    expect(html).toContain("ke area coretan");
    expect(html).toContain("h-[100dvh]");
    expect(html).toContain("overflow-hidden");
    expect(html).not.toContain('aria-label="Geser lapisan"'); // nothing pasted yet
  });
});
