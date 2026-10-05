import { describe, expect, it } from "vitest";

import { scoringPlaceholder } from "./index";

describe("scoring package", () => {
  it("exposes its placeholder through the workspace package", () => {
    expect(scoringPlaceholder()).toBe("scoring ready");
  });
});
