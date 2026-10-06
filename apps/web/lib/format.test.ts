import { describe, expect, it } from "vitest";

import { formatPercent, formatRupiah } from "./format";

describe("formatRupiah", () => {
  it.each([
    [29_900, "Rp29.900"],
    [358_800, "Rp358.800"],
    [0, "Rp0"],
    [1_250_000, "Rp1.250.000"],
    [24_916.67, "Rp24.917"],
    [-5_000, "-Rp5.000"],
  ])("%d → %s", (amount, expected) => {
    expect(formatRupiah(amount)).toBe(expected);
  });
});

describe("formatPercent", () => {
  it.each([
    [0.875, "88%"],
    [0.8, "80%"],
    [0, "0%"],
    [1, "100%"],
  ])("%d → %s", (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected);
  });
});
