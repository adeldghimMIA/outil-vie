"use client";

import { Trophy, Zap, CheckSquare, Flame } from "lucide-react";

interface DailyStatsBarProps {
  totalXP: number;
  globalLevel: number;
  tasksCompletedToday: number;
  xpEarnedToday: number;
  currentStreak: number;
}

export function DailyStatsBar({
  totalXP,
  globalLevel,
  tasksCompletedToday,
  xpEarnedToday,
  currentStreak,
}: DailyStatsBarProps) {
  return (
    <div className="glass-card flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3">
      {/* Level */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
          <Trophy className="size-4" />
        </div>
        <span className="text-sm font-semibold">
          Niveau {globalLevel}
        </span>
        <span className="text-xs text-muted-foreground">
          ({totalXP.toLocaleString("fr-FR")} XP)
        </span>
      </div>

      {/* XP Today */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Zap className="size-4" />
        </div>
        <span className="text-sm font-medium">
          {xpEarnedToday} XP aujourd&apos;hui
        </span>
      </div>

      {/* Tasks Completed */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <CheckSquare className="size-4" />
        </div>
        <span className="text-sm font-medium">
          {tasksCompletedToday} tache{tasksCompletedToday !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 animate-streak-pulse">
            <Flame className="size-4" />
          </div>
          <span className="text-sm font-semibold text-orange-400">
            {currentStreak}j streak
          </span>
        </div>
      )}
    </div>
  );
}
