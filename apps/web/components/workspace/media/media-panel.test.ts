import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  mockAudioMedia,
  mockDiagramMedia,
  mockImageMedia,
  mockTableMedia,
  mockVideoMedia,
} from "../../../lib/mock/media";
import { MediaPanel } from "../media-panel";
import { MathFormula } from "./math-formula";

describe("MathFormula (KaTeX 0.19)", () => {
  it("renders valid LaTeX formula into KaTeX HTML markup", () => {
    const html = renderToStaticMarkup(
      createElement(MathFormula, { formula: "f(x) = x^2 - 4x + 3", inline: true }),
    );
    expect(html).toContain("katex");
    expect(html).toContain('class="katex"');
  });

  it("handles display block mode correctly", () => {
    const html = renderToStaticMarkup(
      createElement(MathFormula, { formula: "D = b^2 - 4ac > 0", displayMode: true }),
    );
    expect(html).toContain("katex-display");
  });

  it("gracefully falls back when KaTeX parsing encounters invalid syntax", () => {
    const html = renderToStaticMarkup(
      createElement(MathFormula, { formula: "\\invalidCommand{test" }),
    );
    // Does not throw an error and renders safely
    expect(html).toContain("invalidCommand");
  });
});

describe("MediaPanel — Diagram & Image (Fase 12)", () => {
  it("renders vector diagram with accessibility label, badge, and caption", () => {
    const html = renderToStaticMarkup(createElement(MediaPanel, { media: mockDiagramMedia }));
    expect(html).toContain("figure");
    expect(html).toContain("Vektor HD");
    expect(html).toContain("Perbesar gambar");
    expect(html).toContain("Perkecil gambar");
    expect(html).toContain("P(2, -1)");
  });

  it("renders raster image with zoom level controls and lightbox trigger", () => {
    const html = renderToStaticMarkup(createElement(MediaPanel, { media: mockImageMedia }));
    expect(html).toContain("figure");
    expect(html).toContain("100%");
    expect(html).toContain("Layar Penuh");
    expect(html).toContain("Penampang Irisan Kerucut");
  });
});

describe("MediaPanel — Table with KaTeX", () => {
  it("renders structured table with headers, rows, and footnote", () => {
    const html = renderToStaticMarkup(createElement(MediaPanel, { media: mockTableMedia }));
    expect(html).toContain("<table");
    expect(html).toContain("Produk Kain");
    expect(html).toContain("Kapasitas Maksimal");
    expect(html).toContain("katex"); // KaTeX rendered in cell formula
    expect(html).toContain("Catatan:");
  });
});

describe("MediaPanel — Audio with Transcript", () => {
  it("renders audio player with transcript button and accessibility tags", () => {
    const html = renderToStaticMarkup(createElement(MediaPanel, { media: mockAudioMedia }));
    expect(html).toContain("Wawancara: Pengukuran Sudut Paralaks Bintang");
    expect(html).toContain("Dr. Hendra Gunawan");
    expect(html).toContain("Putar");
    expect(html).toContain("Transkrip");
    expect(html).toContain("01:25");
    expect(html).toContain("<audio");
  });
});

describe("MediaPanel — Video with Takarir (Captions)", () => {
  it("renders video player controls and takarir toggle", () => {
    const html = renderToStaticMarkup(createElement(MediaPanel, { media: mockVideoMedia }));
    expect(html).toContain("<video");
    expect(html).toContain("Putar video");
    expect(html).toContain("CC");
    expect(html).toContain("Daftar Takarir");
    expect(html).toContain("Simulasi Vektor Gerak Parabola");
  });
});
