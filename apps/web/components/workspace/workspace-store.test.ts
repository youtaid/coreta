import type { Stroke } from "@coreta/ink";
import { beforeEach, describe, expect, it } from "vitest";

import { useWorkspaceStore } from "./store";

describe("Workspace Store (Fase 28)", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  describe("8-Question Navigation", () => {
    it("initializes with 8 mock questions and begins on index 0", () => {
      const state = useWorkspaceStore.getState();
      expect(state.questions.length).toBe(8);
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.questions[0]?.id).toBe("item-math-01");
      expect(state.questions[7]?.id).toBe("item-math-08");
    });

    it("navigates forward and backward sequentially", () => {
      const store = useWorkspaceStore.getState();

      store.nextQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(1);

      store.nextQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(2);

      store.previousQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(1);

      store.previousQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(0);

      // Boundary check: previous at 0 stays at 0
      store.previousQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(0);
    });

    it("does not navigate past the last question", () => {
      const store = useWorkspaceStore.getState();
      store.goToQuestion(7);
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(7);

      store.nextQuestion();
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(7);
    });

    it("navigates directly to any valid question index", () => {
      const store = useWorkspaceStore.getState();
      store.goToQuestion(4);
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(4);

      // Invalid negative index ignored
      store.goToQuestion(-1);
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(4);

      // Out of bounds index ignored
      store.goToQuestion(99);
      expect(useWorkspaceStore.getState().currentQuestionIndex).toBe(4);
    });
  });

  describe("4 Answer Types Support", () => {
    it("records PG (Pilihan Ganda) single selection", () => {
      const store = useWorkspaceStore.getState();
      store.setPgAnswer("item-math-01", "opt-1-a");

      const answer = useWorkspaceStore.getState().answers["item-math-01"];
      expect(answer).toEqual({ type: "pg", choice: "opt-1-a" });
    });

    it("records PGK (Pilihan Ganda Kompleks) multiple selections", () => {
      const store = useWorkspaceStore.getState();
      store.setPgkAnswer("item-math-04", ["opt-4-a", "opt-4-c"]);

      const answer = useWorkspaceStore.getState().answers["item-math-04"];
      expect(answer).toEqual({ type: "pgk", choices: ["opt-4-a", "opt-4-c"] });
    });

    it("records BS (Benar-Salah) matrix evaluations", () => {
      const store = useWorkspaceStore.getState();
      store.setBsAnswer("item-math-05", {
        "row-5-1": true,
        "row-5-2": false,
        "row-5-3": true,
        "row-5-4": false,
      });

      const answer = useWorkspaceStore.getState().answers["item-math-05"];
      expect(answer).toEqual({
        type: "bs",
        rows: {
          "row-5-1": true,
          "row-5-2": false,
          "row-5-3": true,
          "row-5-4": false,
        },
      });
    });

    it("records Isian Singkat numeric/text input", () => {
      const store = useWorkspaceStore.getState();
      store.setIsianAnswer("item-math-06", "60000");

      const answer = useWorkspaceStore.getState().answers["item-math-06"];
      expect(answer).toEqual({ type: "isian", text: "60000" });
    });
  });

  describe("Ink Stroke Persistence Across Questions", () => {
    it("retains strokes per question when switching between questions", () => {
      const store = useWorkspaceStore.getState();

      const dummyStroke1: Stroke = {
        id: "stroke-q1-1",
        color: "#000000",
        size: 4,
        points: [{ x: 10, y: 10, pressure: 0.5 }],
        simulatePressure: false,
      };
      const dummyStroke2: Stroke = {
        id: "stroke-q2-1",
        color: "#ff0000",
        size: 6,
        points: [{ x: 50, y: 50, pressure: 0.8 }],
        simulatePressure: false,
      };

      // Draw on Question 1
      store.setStrokes("item-math-01", [dummyStroke1]);
      expect(store.getStrokes("item-math-01")).toEqual([dummyStroke1]);

      // Move to Question 2 and draw
      store.goToQuestion(1);
      store.setStrokes("item-math-02", [dummyStroke2]);
      expect(store.getStrokes("item-math-02")).toEqual([dummyStroke2]);

      // Switch back to Question 1: strokes on item-math-01 are intact
      store.goToQuestion(0);
      expect(useWorkspaceStore.getState().getStrokes("item-math-01")).toEqual([dummyStroke1]);
      expect(useWorkspaceStore.getState().getStrokes("item-math-02")).toEqual([dummyStroke2]);
      expect(useWorkspaceStore.getState().getStrokes("item-math-03")).toEqual([]);
    });
  });

  describe("Elapsed Timer", () => {
    it("increments elapsedSeconds on tickTimer when running in draft status", () => {
      const store = useWorkspaceStore.getState();
      expect(store.elapsedSeconds).toBe(0);

      store.tickTimer();
      store.tickTimer();
      expect(useWorkspaceStore.getState().elapsedSeconds).toBe(2);

      store.stopTimer();
      store.tickTimer();
      expect(useWorkspaceStore.getState().elapsedSeconds).toBe(2);

      store.startTimer();
      store.tickTimer();
      expect(useWorkspaceStore.getState().elapsedSeconds).toBe(3);
    });
  });

  describe("Submission & Scoring Integration (@coreta/scoring)", () => {
    it("submits worksheet, grades 4 answer types, and provides distractor hints", async () => {
      const store = useWorkspaceStore.getState();

      // Answer Soal 1 (PG) correctly: "opt-1-a"
      store.setPgAnswer("item-math-01", "opt-1-a");

      // Answer Soal 2 (PG) incorrectly: "opt-2-c" (distractor with hint)
      store.setPgAnswer("item-math-02", "opt-2-c");

      // Answer Soal 4 (PGK) correctly: ["opt-4-a", "opt-4-c"]
      store.setPgkAnswer("item-math-04", ["opt-4-a", "opt-4-c"]);

      // Answer Soal 5 (BS) all correct: { "row-5-1": true, "row-5-2": false, "row-5-3": true, "row-5-4": false }
      store.setBsAnswer("item-math-05", {
        "row-5-1": true,
        "row-5-2": false,
        "row-5-3": true,
        "row-5-4": false,
      });

      // Answer Soal 6 (Isian) correctly: "60000"
      store.setIsianAnswer("item-math-06", "60000");

      expect(useWorkspaceStore.getState().submissionStatus).toBe("draft");

      const result = await store.submit();

      const finalState = useWorkspaceStore.getState();
      expect(finalState.submissionStatus).toBe("graded");
      expect(finalState.isTimerRunning).toBe(false);

      // Check grading results
      expect(result.results["item-math-01"]?.score).toBe(1);

      // Soal 2 had distractor "opt-2-c", should give score 0 and return hint
      expect(result.results["item-math-02"]?.score).toBe(0);
      expect(result.results["item-math-02"]?.hints.length).toBeGreaterThan(0);
      expect(result.results["item-math-02"]?.hints[0]?.text).toContain("titik puncak minimum");

      // Soal 4 (PGK) fully correct
      expect(result.results["item-math-04"]?.score).toBe(1);

      // Soal 5 (BS) fully correct
      expect(result.results["item-math-05"]?.score).toBe(1);

      // Soal 6 (Isian) fully correct
      expect(result.results["item-math-06"]?.score).toBe(1);

      // Overall score computed
      expect(result.overallScore).toBeGreaterThan(0);
      expect(finalState.overallScore).toBe(result.overallScore);
    });
  });
});
