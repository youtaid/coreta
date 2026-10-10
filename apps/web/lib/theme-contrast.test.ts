import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function readTokens(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`Blok ${selector} tidak ditemukan di globals.css`);
  const block = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, value]) => [
      name,
      value.toLowerCase(),
    ]),
  );
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// [foreground, background] pairs that carry text (WCAG 1.4.3, AA = 4.5:1).
const textPairs: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["primary", "card"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["success-foreground", "success"],
  ["success", "background"],
  ["success", "card"],
  ["warning-foreground", "warning"],
  ["warning", "background"],
  ["warning", "card"],
  ["ink", "card"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
];

// Input outlines are UI components, not text (WCAG 1.4.11, 3:1).
const uiPairs: [string, string][] = [
  ["input", "background"],
  ["input", "card"],
];

describe.each([
  ["terang", ":root"],
  ["gelap", ".dark"],
])("kontras tema %s", (_label, selector) => {
  const tokens = readTokens(selector);
  const light = readTokens(":root");
  const color = (name: string) => tokens[name] ?? light[name];

  it.each(textPairs)("%s di atas %s ≥ 4,5:1", (fg, bg) => {
    expect(color(fg), `--${fg}`).toBeDefined();
    expect(color(bg), `--${bg}`).toBeDefined();
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(uiPairs)("%s di atas %s ≥ 3:1", (fg, bg) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(3);
  });
});
