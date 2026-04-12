"use client";

import { useMemo, useEffect, useState } from "react";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { TaskPanel } from "@/components/tasks/task-panel";
import { DailyStatsBar } from "@/components/gamification/daily-stats-bar";
import { PersoDashboard } from "@/components/dashboard/perso-dashboard";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { calculateLevel } from "@/lib/gamification/level-calculator";
import type { CalendarEvent, EventCategory, Task } from "@/types";

interface GlobalDashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
}

interface DailyStats {
  totalXP: number;
  globalLevel: number;
  xpEarnedToday: number;
  currentStreak: number;
}

export function GlobalDashboard({ events, tasks }: GlobalDashboardProps) {
  const activeMode = useUIStore((s) => s.activeMode);
  const [stats, setStats] = useState<DailyStats | null>(null);

  // Derive the category filter from the active mode
  const categoryFilter: EventCategory | null =
    activeMode === "global" ? null : activeMode;

  // Filter tasks client-side based on the active mode
  const filteredTasks = useMemo(() => {
    if (activeMode === "global") return tasks;
    return tasks.filter((t) => t.category === activeMode);
  }, [tasks, activeMode]);

  // Count completed tasks for today
  const tasksCompletedToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return tasks.filter(
      (t) => t.status === "done" && t.completed_at?.slice(0, 10) === todayStr
    ).length;
  }, [tasks]);

  // Fetch gamification stats on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const supabase = createClient();

        // Fetch user_levels to aggregate total XP and max streak
        const { data: levels } = await supabase
          .from("user_levels")
          .select("total_xp, current_streak");

        if (cancelled) return;

        const totalXP =
          levels?.reduce((sum, l) => sum + (l.total_xp ?? 0), 0) ?? 0;
        const currentStreak = levels
          ? Math.max(0, ...levels.map((l) => l.current_streak ?? 0))
          : 0;
        const globalLevel = calculateLevel(totalXP);

        // Fetch XP earned today
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: xpEvents } = await supabase
          .from("xp_events")
          .select("xp_amount")
          .gte("created_at", `${todayStr}T00:00:00`);

        if (cancelled) return;

        const xpEarnedToday =
          xpEvents?.reduce((sum, e) => sum + (e.xp_amount ?? 0), 0) ?? 0;

        setStats({ totalXP, globalLevel, xpEarnedToday, currentStreak });
      } catch {
        // Silently fail -- stats bar just won't show
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // Perso mode gets its own dedicated layout
  if (activeMode === "perso") {
    return <PersoDashboard events={events} tasks={filteredTasks} />;
  }

  return (
    <div className="space-y-4">
      {stats && (
        <DailyStatsBar
          totalXP={stats.totalXP}
          globalLevel={stats.globalLevel}
          tasksCompletedToday={tasksCompletedToday}
          xpEarnedToday={stats.xpEarnedToday}
          currentStreak={stats.currentStreak}
        />
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <CalendarSection category={categoryFilter} events={events} />
        </div>
        <aside className="space-y-4">
          <TaskPanel category={categoryFilter} tasks={filteredTasks} />
        </aside>
      </div>
    </div>
  );
}
