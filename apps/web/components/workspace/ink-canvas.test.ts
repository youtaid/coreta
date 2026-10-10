import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InkCanvas } from "./ink-canvas";
import { ScratchArea } from "./scratch-area";

describe("InkCanvas", () => {
  const html = renderToStaticMarkup(createElement(InkCanvas, { header: "Area" }));

  it("offers the five tools, each with a label", () => {
    expect(html).toContain('role="toolbar"');
    for (const name of ["Pena", "Penghapus", "Urungkan", "Ulangi", "Bersihkan"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
  });

  it("starts with the pen selected and nothing to undo, redo, or clear", () => {
    expect(html).toMatch(
      /aria-pressed="true"[^>]*aria-label="Pena"|aria-label="Pena"[^>]*aria-pressed="true"/,
    );
    expect(html).toMatch(
      /aria-label="Penghapus"[^>]*aria-pressed="false"|aria-pressed="false"[^>]*aria-label="Penghapus"/,
    );
    for (const name of ["Urungkan", "Ulangi", "Bersihkan"]) {
      expect(html).toMatch(
        new RegExp(
          `<button[^>]*disabled[^>]*aria-label="${name}"|<button[^>]*aria-label="${name}"[^>]*disabled`,
        ),
      );
    }
  });

  it("gives the canvas a text alternative and a text color for the ink to follow", () => {
    expect(html).toContain("<canvas");
    expect(html).toContain('role="img"');
    expect(html).toContain("text-foreground");
  });

  it("uses 44 px buttons", () => {
    expect(html).toContain("size-touch");
  });
});

describe("ScratchArea", () => {
  it("puts the ink canvas on top of the grid and keeps its label", () => {
    const html = renderToStaticMarkup(createElement(ScratchArea, { label: "Area Coretan" }));
    expect(html).toContain("workspace-grid-pattern");
    expect(html).toContain("Kertas Berpetak 24px");
    expect(html).toContain("<canvas");
  });
});
