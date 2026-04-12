"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Brain,
  Languages,
  Briefcase,
  Palette,
  Users,
  Heart,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { RadarChart } from "@/components/progression/radar-chart";
import { ObjectiveCard } from "@/components/progression/objective-card";
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

const AXIS_ICONS: Record<string, LucideIcon> = {
  sport: Dumbbell,
  intelligence: Brain,
  langues: Languages,
  carriere: Briefcase,
  creativite: Palette,
  social: Users,
  sante: Heart,
};

interface PilierData {
  axis: GamificationAxis;
  level: UserLevel;
}

export function PersoDashboard({ events, tasks }: PersoDashboardProps) {
  const router = useRouter();
  const [piliers, setPiliers] = useState<PilierData[]>([]);
  const [objectives, setObjectives] = useState<GamificationObjective[]>([]);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter events to perso only
  const persoEvents = events.filter((e) => e.category === "perso");

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

        // Build pilier data - match axes with their levels
        const pilierData: PilierData[] = axes.map((axis) => {
          const level = levels.find((l) => l.axis_id === axis.id) ?? {
            id: "",
            user_id: DEFAULT_USER_ID,
            axis_id: axis.id,
            total_xp: 0,
            current_level: 1,
            xp_for_next_level: 25,
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: null,
            updated_at: new Date().toISOString(),
          };
          return { axis, level };
        });

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

        setPiliers(pilierData);
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

      {/* ── MA JOURNEE - Calendar in day view ────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Ma journee</h2>
        <CalendarSection
          category="perso"
          events={persoEvents}
          defaultView="day"
          checkableMode
        />
      </div>

      {/* ── MES PILIERS - 2x3 grid ──────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Mes piliers</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        ) : piliers.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucun pilier configure
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {piliers.map(({ axis, level }) => {
              const Icon = AXIS_ICONS[axis.slug] ?? Dumbbell;
              const xpInLevel =
                level.total_xp - (level.current_level - 1) ** 2 * 25;
              const xpNeeded =
                level.xp_for_next_level -
                (level.current_level - 1) ** 2 * 25;
              const progress =
                xpNeeded > 0
                  ? Math.min(100, (xpInLevel / xpNeeded) * 100)
                  : 0;

              return (
                <Card
                  key={axis.id}
                  className="cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
                  onClick={() => router.push(`/progression/${axis.slug}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex size-7 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${axis.color}20`,
                          color: axis.color,
                        }}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {axis.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Niv. {level.current_level}
                        </p>
                      </div>
                    </div>
                    {/* Mini XP bar */}
                    <div className="space-y-0.5">
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: axis.color,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">
                        {xpInLevel}/{xpNeeded} XP
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── OBJECTIFS ACTIFS ─────────────────────────────────────── */}
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
          <div className="grid gap-3 sm:grid-cols-2">
            {objectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
