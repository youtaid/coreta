import { describe, expect, it } from "vitest";

import { resolveRecognizedAnswer, setBooleanResponse, toggleSelection } from "./answer-state";

describe("answer panel local state", () => {
  it("adds and removes a complex multiple-choice selection", () => {
    expect(toggleSelection([], "option-a")).toEqual(["option-a"]);
    expect(toggleSelection(["option-a", "option-b"], "option-a")).toEqual(["option-b"]);
  });

  it("sets each true-false response independently", () => {
    const first = setBooleanResponse({}, "statement-1", true);
    const second = setBooleanResponse(first, "statement-2", false);

    expect(second).toEqual({ "statement-1": true, "statement-2": false });
    expect(setBooleanResponse(second, "statement-1", false)).toEqual({
      "statement-1": false,
      "statement-2": false,
    });
  });

  it("uses trimmed mock recognition, then falls back to the typed answer", () => {
    expect(resolveRecognizedAnswer("x = 2", "  x = 3  ")).toBe("x = 3");
    expect(resolveRecognizedAnswer("  x = 2  ")).toBe("x = 2");
    expect(resolveRecognizedAnswer("   ")).toBe("");
  });
});
