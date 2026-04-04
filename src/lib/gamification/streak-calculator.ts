// ─── Streak Calculation Functions ────────────────────────────────────────────

const DEFAULT_TIMEZONE = "Europe/Paris";

/**
 * Calculate the new streak value based on the last activity date.
 *
 * - If lastActivityDate is today -> no change (isNewDay = false)
 * - If lastActivityDate is yesterday -> increment streak (isNewDay = true)
 * - If older or null -> reset to 1 (isNewDay = true)
 */
export function calculateStreak(
  lastActivityDate: string | null,
  currentStreak: number,
  timezone?: string
): { newStreak: number; isNewDay: boolean } {
  const tz = timezone ?? DEFAULT_TIMEZONE;

  const now = new Date();
  const todayStr = toDateString(now, tz);

  if (!lastActivityDate) {
    return { newStreak: 1, isNewDay: true };
  }

  const lastStr = toDateString(new Date(lastActivityDate), tz);

  if (lastStr === todayStr) {
    return { newStreak: currentStreak, isNewDay: false };
  }

  const yesterdayStr = toDateString(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    tz
  );

  if (lastStr === yesterdayStr) {
    return { newStreak: currentStreak + 1, isNewDay: true };
  }

  // Gap of more than one day -> reset
  return { newStreak: 1, isNewDay: true };
}

/**
 * Formats a Date into a YYYY-MM-DD string in the given timezone.
 */
function toDateString(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}
