// ─── XP Calculation Functions ────────────────────────────────────────────────

const TASK_XP_MAP: Record<number, number> = {
  1: 30,
  2: 25,
  3: 15,
  4: 12,
  5: 10,
};

/**
 * Returns XP awarded for completing a task based on its priority.
 * Priority 1 (highest) = 30 XP, down to priority 5 = 10 XP.
 */
export function getTaskXP(priority: number): number {
  return TASK_XP_MAP[priority] ?? 10;
}

/**
 * Returns XP awarded for logging an activity session.
 * Base 25 + 1 per 10 minutes of duration + 10 bonus if rating >= 4.
 */
export function getSessionXP(
  durationMinutes: number,
  rating?: number | null
): number {
  const base = 25;
  const durationBonus = Math.floor(durationMinutes / 10);
  const ratingBonus = rating != null && rating >= 4 ? 10 : 0;
  return base + durationBonus + ratingBonus;
}

const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  14: 75,
  30: 150,
  60: 300,
  100: 500,
};

/**
 * Returns a bonus XP amount if the streak has reached a milestone, or null otherwise.
 */
export function getStreakBonusXP(streakDays: number): number | null {
  return STREAK_MILESTONES[streakDays] ?? null;
}
