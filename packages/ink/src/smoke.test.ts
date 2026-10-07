import { describe, expect, it } from "vitest";
import { DEFAULT_PALM_GRACE_MS, PalmGuard } from "./index";

describe("ink package smoke test", () => {
  it("exports palm guard with default grace ms", () => {
    expect(DEFAULT_PALM_GRACE_MS).toBeGreaterThan(0);
    const guard = new PalmGuard();
    expect(guard).toBeDefined();
  });
});
