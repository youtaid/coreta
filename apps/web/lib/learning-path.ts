import type { ActivityDay, Stage } from "@/lib/domain";

/**
 * The stage the student should work on next: the active one, otherwise the first stage that is
 * not mastered yet. Returns undefined when every stage is mastered.
 */
export function findCurrentStage(stages: readonly Stage[]): Stage | undefined {
  return (
    stages.find((stage) => stage.status === "active") ??
    stages.find((stage) => stage.status !== "mastered")
  );
}

export function countMastered(stages: readonly Stage[]): number {
  return stages.filter((stage) => stage.status === "mastered").length;
}

export interface DailyTargetProgress {
  done: number;
  goal: number;
  /** Items still needed today; never negative. */
  remaining: number;
  /** Share of the goal reached, clamped to 0-1 for progress bars. */
  ratio: number;
  reached: boolean;
}

export function dailyTargetProgress(done: number, goal: number): DailyTargetProgress {
  const safeDone = Math.max(0, Math.floor(done));
  const safeGoal = Math.max(1, Math.floor(goal));
  return {
    done: safeDone,
    goal: safeGoal,
    remaining: Math.max(0, safeGoal - safeDone),
    ratio: Math.min(1, safeDone / safeGoal),
    reached: safeDone >= safeGoal,
  };
}

/**
 * Consecutive days, ending on `today`, on which the daily goal was met. Today only extends the
 * streak once its goal is met; an unfinished today does not break a streak that ended yesterday.
 */
export function goalStreak(days: readonly ActivityDay[], goal: number, today: string): number {
  const byDate = new Map(days.map((day) => [day.date, day.count]));
  const met = (date: string) => (byDate.get(date) ?? 0) >= goal;

  let cursor = new Date(`${today}T00:00:00Z`);
  if (!met(today)) cursor = new Date(cursor.getTime() - 86_400_000);

  let streak = 0;
  while (met(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}
