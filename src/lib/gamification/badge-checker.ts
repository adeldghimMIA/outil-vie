// ─── Badge Eligibility Checker ──────────────────────────────────────────────

export interface BadgeCheckResult {
  badgeId: string;
  name: string;
  icon: string;
  rarity: string;
}

/**
 * Checks if the given badge's criteria are met based on the user's current stats.
 */
export function checkBadgeEligibility(
  badge: {
    id: string;
    name: string;
    icon: string;
    criteria_type: string;
    criteria_value: number;
    rarity: string;
  },
  stats: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    totalSessions: number;
  }
): boolean {
  switch (badge.criteria_type) {
    case "xp_total":
      return stats.totalXP >= badge.criteria_value;
    case "level_reached":
      return stats.currentLevel >= badge.criteria_value;
    case "streak_days":
      return stats.longestStreak >= badge.criteria_value;
    case "sessions_count":
      return stats.totalSessions >= badge.criteria_value;
    case "objective_completed":
      // Objective-based badges are awarded directly when an objective is completed,
      // not through periodic stat checks. Return false here.
      return false;
    case "custom":
      // Custom badges are awarded manually or via specific triggers.
      return false;
    default:
      return false;
  }
}
