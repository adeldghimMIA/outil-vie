"use client";

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import {
  logSession,
  awardXP,
  createObjective,
} from "@/app/actions/gamification";
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
import { calculateLevel } from "@/lib/gamification/level-calculator";

// ─── Query Keys ──────────────────────────────────────────────────────────────

const gamificationKeys = {
  all: ["gamification"] as const,
  progression: () => [...gamificationKeys.all, "progression"] as const,
  axes: () => [...gamificationKeys.all, "axes"] as const,
};

// ─── Read Hooks (Supabase browser client) ────────────────────────────────────

/**
 * Fetches all progression page data via the Supabase browser client.
 */
export function useProgressionData() {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<ProgressionPageData>({
    queryKey: gamificationKeys.progression(),
    queryFn: async () => {
      const userId = DEFAULT_USER_ID;

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
        supabase.from("badges").select("*").eq("user_id", userId),
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

      if (axesResult.error) throw axesResult.error;
      if (levelsResult.error) throw levelsResult.error;
      if (badgesResult.error) throw badgesResult.error;
      if (userBadgesResult.error) throw userBadgesResult.error;
      if (challengesResult.error) throw challengesResult.error;
      if (xpEventsResult.error) throw xpEventsResult.error;
      if (objectivesResult.error) throw objectivesResult.error;

      const axes = (axesResult.data ?? []) as GamificationAxis[];
      const levels = (levelsResult.data ?? []) as UserLevel[];
      const badges = (badgesResult.data ?? []) as Badge[];
      const earnedBadges = (userBadgesResult.data ?? []) as UserBadge[];
      const activeChallenges = (challengesResult.data ?? []) as DailyChallenge[];
      const recentXPEvents = (xpEventsResult.data ?? []) as XPEvent[];
      const objectives = (objectivesResult.data ?? []) as GamificationObjective[];

      const earnedBadgeIds = new Set(
        earnedBadges.map((ub) => ub.badge_id)
      );

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

        const axisObjectives = objectives.filter(
          (o) => o.axis_id === axis.id
        );

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
    },
  });
}

/**
 * Fetches gamification axes via the Supabase browser client.
 */
export function useAxes() {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<GamificationAxis[]>({
    queryKey: gamificationKeys.axes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_axes")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as GamificationAxis[]) ?? [];
    },
  });
}

// ─── Mutation Hooks (Server Actions) ─────────────────────────────────────────

/**
 * Mutation that calls logSession server action and invalidates progression queries.
 */
export function useLogSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      userId: string;
      activityId: string;
      axisId: string;
      durationMinutes: number;
      notes?: string;
      rating?: number;
      mood?: string;
      metrics?: Record<string, unknown>;
    }) => logSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}

/**
 * Mutation wrapping awardXP server action.
 */
export function useAwardXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      userId: string;
      axisId: string;
      sourceType: string;
      sourceId?: string;
      xpAmount: number;
      description: string;
    }) => awardXP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}

/**
 * Mutation wrapping createObjective server action.
 */
export function useCreateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      userId: string;
      axisId: string;
      title: string;
      targetValue: number;
      unit: string;
      deadline?: string;
    }) => createObjective(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}
