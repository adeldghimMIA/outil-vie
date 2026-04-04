"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { getSessionXP, getStreakBonusXP } from "@/lib/gamification/xp-calculator";
import { calculateLevel, xpForNextLevel } from "@/lib/gamification/level-calculator";
import { calculateStreak } from "@/lib/gamification/streak-calculator";
import { checkBadgeEligibility } from "@/lib/gamification/badge-checker";
import type {
  ProgressionPageData,
  AxisProgressData,
  GamificationAxis,
  UserLevel,
  Badge,
  UserBadge,
  XPEvent,
  DailyChallenge,
  GamificationObjective,
} from "@/types/gamification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClient() {
  return await createClient();
}

// ─── Read Actions ────────────────────────────────────────────────────────────

/**
 * Fetch all progression data for the progression page.
 */
export async function getProgressionData(
  userId: string = DEFAULT_USER_ID
): Promise<ProgressionPageData> {
  const supabase = await getClient();

  // Fetch all data in parallel
  const [
    axesResult,
    levelsResult,
    badgesResult,
    userBadgesResult,
    challengesResult,
    xpEventsResult,
    objectivesResult,
  ] = await Promise.all([
    supabase
      .from("gamification_axes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("user_levels").select("*").eq("user_id", userId),
    supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", userId),
    supabase
      .from("daily_challenges")
      .select("*")
      .eq("user_id", userId)
      .is("completed_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("active_date", { ascending: true }),
    supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("gamification_objectives")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  if (axesResult.error) throw new Error(`Axes: ${axesResult.error.message}`);
  if (levelsResult.error) throw new Error(`Levels: ${levelsResult.error.message}`);
  if (badgesResult.error) throw new Error(`Badges: ${badgesResult.error.message}`);
  if (userBadgesResult.error) throw new Error(`User badges: ${userBadgesResult.error.message}`);
  if (challengesResult.error) throw new Error(`Challenges: ${challengesResult.error.message}`);
  if (xpEventsResult.error) throw new Error(`XP events: ${xpEventsResult.error.message}`);
  if (objectivesResult.error) throw new Error(`Objectives: ${objectivesResult.error.message}`);

  const axes = (axesResult.data ?? []) as GamificationAxis[];
  const levels = (levelsResult.data ?? []) as UserLevel[];
  const badges = (badgesResult.data ?? []) as Badge[];
  const earnedBadges = (userBadgesResult.data ?? []) as UserBadge[];
  const activeChallenges = (challengesResult.data ?? []) as DailyChallenge[];
  const recentXPEvents = (xpEventsResult.data ?? []) as XPEvent[];
  const objectives = (objectivesResult.data ?? []) as GamificationObjective[];

  // Map earned badge IDs for quick lookup
  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badge_id));

  // Build axis progress data
  const axesData: AxisProgressData[] = axes.map((axis) => {
    const level = levels.find((l) => l.axis_id === axis.id) ?? {
      id: "",
      user_id: userId,
      axis_id: axis.id,
      total_xp: 0,
      current_level: 1,
      xp_for_next_level: 25,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    };

    const axisObjectives = objectives.filter((o) => o.axis_id === axis.id);

    const axisBadges = badges.filter(
      (b) => b.axis_id === axis.id || b.axis_id === null
    );
    const axisEarnedBadgeIds = axisBadges
      .filter((b) => earnedBadgeIds.has(b.id))
      .map((b) => b.id);

    return {
      axis,
      level,
      objectives: axisObjectives,
      earnedBadgeIds: axisEarnedBadgeIds,
    };
  });

  // Compute global totals
  const totalXP = levels.reduce((sum, l) => sum + l.total_xp, 0);
  const globalLevel = calculateLevel(totalXP);

  return {
    axes: axesData,
    totalXP,
    globalLevel,
    badges,
    earnedBadges,
    activeChallenges,
    recentXPEvents,
  };
}

/**
 * Fetch gamification axes.
 */
export async function getAxes(
  userId: string = DEFAULT_USER_ID
): Promise<GamificationAxis[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("gamification_axes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des axes : ${error.message}`);
  }

  return (data as GamificationAxis[]) ?? [];
}

// ─── XP Actions ─────────────────────────────────────────────────────────────

/**
 * Award XP for an action. The DB trigger handles level recalculation.
 */
export async function awardXP(data: {
  userId: string;
  axisId: string;
  sourceType: string;
  sourceId?: string;
  xpAmount: number;
  description: string;
}): Promise<void> {
  const supabase = await getClient();

  const { error } = await supabase.from("xp_events").insert({
    user_id: data.userId,
    axis_id: data.axisId,
    source_type: data.sourceType,
    source_id: data.sourceId ?? null,
    xp_amount: data.xpAmount,
    description: data.description,
    metadata: {},
  });

  if (error) {
    throw new Error(`Erreur lors de l'attribution d'XP : ${error.message}`);
  }

  revalidatePath("/", "layout");
}

// ─── Session Logging ─────────────────────────────────────────────────────────

/**
 * Log an activity session and award XP.
 */
export async function logSession(data: {
  userId: string;
  activityId: string;
  axisId: string;
  durationMinutes: number;
  notes?: string;
  rating?: number;
  mood?: string;
  metrics?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await getClient();

  // 1. Insert activity session
  const { data: session, error: sessionError } = await supabase
    .from("activity_sessions")
    .insert({
      user_id: data.userId,
      activity_id: data.activityId,
      session_date: new Date().toISOString().split("T")[0],
      duration_minutes: data.durationMinutes,
      notes: data.notes ?? null,
      rating: data.rating ?? null,
      mood: data.mood ?? null,
      metrics: data.metrics ?? null,
    })
    .select()
    .single();

  if (sessionError) {
    throw new Error(`Erreur lors de la création de la session : ${sessionError.message}`);
  }

  // 2. Calculate XP from duration + rating
  const xpAmount = getSessionXP(data.durationMinutes, data.rating);

  // 3. Insert XP event
  const { error: xpError } = await supabase.from("xp_events").insert({
    user_id: data.userId,
    axis_id: data.axisId,
    source_type: "session_logged",
    source_id: session.id,
    xp_amount: xpAmount,
    description: `Session logged: ${data.durationMinutes}min`,
    metadata: {
      duration_minutes: data.durationMinutes,
      rating: data.rating ?? null,
    },
  });

  if (xpError) {
    throw new Error(`Erreur lors de l'attribution d'XP : ${xpError.message}`);
  }

  // 4. Update streak on user_levels
  const { data: levelRow, error: levelFetchError } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", data.userId)
    .eq("axis_id", data.axisId)
    .single();

  if (levelFetchError && levelFetchError.code !== "PGRST116") {
    throw new Error(`Erreur lors de la récupération du niveau : ${levelFetchError.message}`);
  }

  const currentLevel = levelRow as UserLevel | null;
  const { newStreak, isNewDay } = calculateStreak(
    currentLevel?.last_activity_date ?? null,
    currentLevel?.current_streak ?? 0
  );

  if (currentLevel) {
    const longestStreak = Math.max(newStreak, currentLevel.longest_streak);

    await supabase
      .from("user_levels")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentLevel.id);

    // Award streak bonus XP if milestone reached
    if (isNewDay) {
      const streakBonus = getStreakBonusXP(newStreak);
      if (streakBonus !== null) {
        await supabase.from("xp_events").insert({
          user_id: data.userId,
          axis_id: data.axisId,
          source_type: "streak_bonus",
          source_id: null,
          xp_amount: streakBonus,
          description: `Streak milestone: ${newStreak} days`,
          metadata: { streak_days: newStreak },
        });
      }
    }
  } else {
    // Create a new user_levels row if it doesn't exist
    const newXP = xpAmount;
    const newLevel = calculateLevel(newXP);

    await supabase.from("user_levels").insert({
      user_id: data.userId,
      axis_id: data.axisId,
      total_xp: newXP,
      current_level: newLevel,
      xp_for_next_level: xpForNextLevel(newLevel),
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: new Date().toISOString().split("T")[0],
    });
  }

  // 5. Check for new badge unlocks
  await checkAndAwardBadges(data.userId, data.axisId);

  // 6. Revalidate paths
  revalidatePath("/", "layout");
}

// ─── Badge Actions ──────────────────────────────────────────────────────────

/**
 * Check and award any newly eligible badges.
 */
export async function checkAndAwardBadges(
  userId: string,
  axisId?: string
): Promise<void> {
  const supabase = await getClient();

  // Fetch all badges for the user
  let badgeQuery = supabase
    .from("badges")
    .select("*")
    .eq("user_id", userId);

  if (axisId) {
    badgeQuery = badgeQuery.or(`axis_id.eq.${axisId},axis_id.is.null`);
  }

  const { data: allBadges, error: badgesError } = await badgeQuery;

  if (badgesError) {
    throw new Error(`Erreur badges : ${badgesError.message}`);
  }

  // Fetch already earned badge IDs
  const { data: earnedBadges, error: earnedError } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (earnedError) {
    throw new Error(`Erreur user_badges : ${earnedError.message}`);
  }

  const earnedIds = new Set((earnedBadges ?? []).map((ub: { badge_id: string }) => ub.badge_id));
  const unearnedBadges = ((allBadges ?? []) as Badge[]).filter(
    (b) => !earnedIds.has(b.id)
  );

  if (unearnedBadges.length === 0) return;

  // Fetch user stats for the relevant axis/axes
  const { data: levels, error: levelsError } = await supabase
    .from("user_levels")
    .select("*")
    .eq("user_id", userId);

  if (levelsError) {
    throw new Error(`Erreur levels : ${levelsError.message}`);
  }

  const userLevels = (levels ?? []) as UserLevel[];

  // Count total sessions
  const { count: totalSessions, error: sessionsError } = await supabase
    .from("activity_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (sessionsError) {
    throw new Error(`Erreur sessions count : ${sessionsError.message}`);
  }

  // Build stats per axis + global stats
  const globalStats = {
    totalXP: userLevels.reduce((sum, l) => sum + l.total_xp, 0),
    currentLevel: calculateLevel(
      userLevels.reduce((sum, l) => sum + l.total_xp, 0)
    ),
    currentStreak: Math.max(0, ...userLevels.map((l) => l.current_streak)),
    longestStreak: Math.max(0, ...userLevels.map((l) => l.longest_streak)),
    totalSessions: totalSessions ?? 0,
  };

  const newlyEarned: Badge[] = [];

  for (const badge of unearnedBadges) {
    // Use axis-specific stats if the badge is tied to an axis
    let stats = globalStats;

    if (badge.axis_id) {
      const axisLevel = userLevels.find((l) => l.axis_id === badge.axis_id);
      if (axisLevel) {
        stats = {
          totalXP: axisLevel.total_xp,
          currentLevel: axisLevel.current_level,
          currentStreak: axisLevel.current_streak,
          longestStreak: axisLevel.longest_streak,
          totalSessions: globalStats.totalSessions, // sessions are global
        };
      }
    }

    if (checkBadgeEligibility(badge, stats)) {
      newlyEarned.push(badge);
    }
  }

  // Insert newly earned badges
  if (newlyEarned.length > 0) {
    const rows = newlyEarned.map((badge) => ({
      user_id: userId,
      badge_id: badge.id,
      earned_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("user_badges")
      .insert(rows);

    if (insertError) {
      throw new Error(`Erreur attribution badges : ${insertError.message}`);
    }
  }
}

// ─── Objective Actions ──────────────────────────────────────────────────────

/**
 * Create a new gamification objective.
 */
export async function createObjective(data: {
  userId: string;
  axisId: string;
  title: string;
  targetValue: number;
  unit: string;
  deadline?: string;
}): Promise<GamificationObjective> {
  const supabase = await getClient();

  const { data: objective, error } = await supabase
    .from("gamification_objectives")
    .insert({
      user_id: data.userId,
      axis_id: data.axisId,
      title: data.title,
      target_value: data.targetValue,
      current_value: 0,
      unit: data.unit,
      deadline: data.deadline ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création objectif : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return objective as GamificationObjective;
}

/**
 * Update progress on an objective. Marks as completed if target is reached.
 */
export async function updateObjectiveProgress(
  objectiveId: string,
  newValue: number
): Promise<GamificationObjective> {
  const supabase = await getClient();

  // Fetch the current objective to check target
  const { data: existing, error: fetchError } = await supabase
    .from("gamification_objectives")
    .select("*")
    .eq("id", objectiveId)
    .single();

  if (fetchError) {
    throw new Error(`Erreur récupération objectif : ${fetchError.message}`);
  }

  const objective = existing as GamificationObjective;
  const isCompleted =
    objective.target_value !== null && newValue >= objective.target_value;

  const updateData: Record<string, unknown> = {
    current_value: newValue,
    updated_at: new Date().toISOString(),
  };

  if (isCompleted && !objective.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from("gamification_objectives")
    .update(updateData)
    .eq("id", objectiveId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur mise à jour objectif : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return updated as GamificationObjective;
}

/**
 * Delete (deactivate) an objective.
 */
export async function deleteObjective(objectiveId: string): Promise<void> {
  const supabase = await getClient();

  const { error } = await supabase
    .from("gamification_objectives")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectiveId);

  if (error) {
    throw new Error(`Erreur suppression objectif : ${error.message}`);
  }

  revalidatePath("/", "layout");
}
