// ─── Level Calculation Functions ─────────────────────────────────────────────

/**
 * Calculate the current level from total XP.
 * Formula: floor(sqrt(totalXP / 25)) + 1
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 25)) + 1;
}

/**
 * XP needed to reach a given level.
 * Formula: (level - 1)^2 * 25
 */
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 25;
}

/**
 * XP needed to reach the next level after the current one.
 * Formula: currentLevel^2 * 25
 */
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel ** 2 * 25;
}

/**
 * Returns level progress info including the current level, XP thresholds,
 * and a progress percentage (0-100) toward the next level.
 */
export function getLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForNextLevel(level);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  const progress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 0;

  return {
    level,
    currentXP: totalXP,
    nextLevelXP,
    progress: Math.round(progress * 100) / 100,
  };
}
