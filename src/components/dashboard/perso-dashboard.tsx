"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Circle,
  StickyNote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { RadarChart } from "@/components/progression/radar-chart";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { CalendarEvent, Task } from "@/types";
import type {
  GamificationAxis,
  UserLevel,
  GamificationObjective,
  RadarDataPoint,
} from "@/types/gamification";

interface PersoDashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
}

interface HabitItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_HABITS: Omit<HabitItem, "checked">[] = [
  { id: "routine-matin", label: "Routine matin complete" },
  { id: "pas-tel-15min", label: "Pas de telephone 15 premieres minutes" },
  { id: "journal-3-lignes", label: "Journal 3 lignes ce soir" },
  { id: "meditation", label: "Meditation / stretching" },
  { id: "espagnol", label: "Session espagnol" },
  { id: "lecture", label: "Lecture 20min" },
];

export function PersoDashboard({ events, tasks }: PersoDashboardProps) {
  const [objectives, setObjectives] = useState<GamificationObjective[]>([]);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Habits state (persisted in localStorage)
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // Perso-only tasks (small tasks, not events)
  const persoTasks = tasks.filter((t) => t.category === "perso" && t.status !== "done" && t.status !== "cancelled");

  // Filter events to perso only
  const persoEvents = events.filter((e) => e.category === "perso");

  // Initialize habits from localStorage
  useEffect(() => {
    const todayKey = `habits-${new Date().toISOString().slice(0, 10)}`;
    const stored = localStorage.getItem(todayKey);
    if (stored) {
      try {
        setHabits(JSON.parse(stored) as HabitItem[]);
      } catch {
        setHabits(DEFAULT_HABITS.map((h) => ({ ...h, checked: false })));
      }
    } else {
      setHabits(DEFAULT_HABITS.map((h) => ({ ...h, checked: false })));
    }
  }, []);

  // Persist habits to localStorage
  const toggleHabit = useCallback(
    (id: string) => {
      setHabits((prev) => {
        const next = prev.map((h) =>
          h.id === id ? { ...h, checked: !h.checked } : h
        );
        const todayKey = `habits-${new Date().toISOString().slice(0, 10)}`;
        localStorage.setItem(todayKey, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = createClient();

        const [axesResult, levelsResult, objectivesResult] = await Promise.all([
          supabase
            .from("gamification_axes")
            .select("*")
            .eq("user_id", DEFAULT_USER_ID)
            .eq("is_active", true)
            .order("display_order", { ascending: true }),
          supabase
            .from("user_levels")
            .select("*")
            .eq("user_id", DEFAULT_USER_ID),
          supabase
            .from("gamification_objectives")
            .select("*")
            .eq("user_id", DEFAULT_USER_ID)
            .eq("is_active", true)
            .is("completed_at", null),
        ]);

        if (cancelled) return;

        const axes = (axesResult.data ?? []) as GamificationAxis[];
        const levels = (levelsResult.data ?? []) as UserLevel[];
        const objs = (objectivesResult.data ?? []) as GamificationObjective[];

        // Build radar data
        const radar: RadarDataPoint[] = axes.map((axis) => {
          const level = levels.find((l) => l.axis_id === axis.id);
          return {
            axis: axis.name,
            value: level?.current_level ?? 1,
            fullMark: 100,
            color: axis.color,
          };
        });

        setObjectives(objs);
        setRadarData(radar);
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedHabitsCount = habits.filter((h) => h.checked).length;
  const habitsTotal = habits.length;

  return (
    <div className="space-y-4">
      {/* ── Radar hexagone (compact) ─────────────────────────────── */}
      <Card className="dark-glass overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
        <CardHeader className="relative pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Vue d&apos;ensemble
          </CardTitle>
        </CardHeader>
        <CardContent className="relative pt-0">
          {loading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : (
            <div className="h-[220px]">
              <RadarChart data={radarData} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Two-column layout: Planning + Habitudes ──────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* LEFT: Mon planning du jour */}
        <div>
          <h2 className="mb-3 text-base font-semibold">Mon planning du jour</h2>
          <CalendarSection
            category="perso"
            events={persoEvents}
            defaultView="day"
            checkableMode
          />
        </div>

        {/* RIGHT: Habitudes + Tasks */}
        <aside className="space-y-4">
          {/* Habitudes du jour */}
          <Card className="dark-glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Habitudes du jour
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {completedHabitsCount}/{habitsTotal}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                >
                  {habit.checked ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={
                      habit.checked
                        ? "line-through text-muted-foreground"
                        : ""
                    }
                  >
                    {habit.label}
                  </span>
                </button>
              ))}
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${habitsTotal > 0 ? (completedHabitsCount / habitsTotal) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Taches perso */}
          <Card className="dark-glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <StickyNote className="size-4 text-amber-500" />
                Taches perso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {persoTasks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune tache perso en cours
                </p>
              )}
              {persoTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{task.title}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── MES OBJECTIFS ACTIFS ─────────────────────────────────── */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Target className="size-4 text-primary" />
          Objectifs actifs
        </h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        ) : objectives.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucun objectif actif
          </div>
        ) : (
          <Card className="dark-glass">
            <CardContent className="py-3 space-y-2">
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-start gap-3 py-1">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{obj.title}</p>
                    {obj.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {obj.description}
                      </p>
                    )}
                    {obj.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Echeance :{" "}
                        {new Date(obj.deadline).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  {obj.target_value && obj.target_value > 0 && (
                    <div className="ml-auto shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {obj.current_value}/{obj.target_value}{" "}
                        {obj.unit ?? ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
