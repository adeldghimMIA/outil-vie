"use client";

import { useState } from "react";
import type {
  ProgressionPageData,
  RadarDataPoint,
} from "@/types/gamification";
import { getLevelProgress } from "@/lib/gamification/level-calculator";
import {
  Trophy,
  Zap,
  Flame,
  TrendingUp,
  Target,
  Award,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadarChart } from "./radar-chart";
import { LevelBadge } from "./level-badge";
import { AxisCard } from "./axis-card";
import { SessionLogForm } from "./session-log-form";
import { BadgeGrid } from "./badge-grid";
import { ObjectiveCard } from "./objective-card";
import { ChallengeCard } from "./challenge-card";

interface ProgressionClientProps {
  data: ProgressionPageData;
}

export function ProgressionClient({ data }: ProgressionClientProps) {
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [preselectedAxisId, setPreselectedAxisId] = useState<
    string | undefined
  >();

  function handleLogSession(axisId: string) {
    setPreselectedAxisId(axisId);
    setSessionDialogOpen(true);
  }

  // Build radar data
  const radarData: RadarDataPoint[] = data.axes.map((ap) => ({
    axis: ap.axis.name,
    value: ap.level.current_level,
    fullMark: 100,
    color: ap.axis.color,
  }));

  // Global stats
  const { progress: globalProgress } = getLevelProgress(data.totalXP);
  const totalStreak = Math.max(
    0,
    ...data.axes.map((ap) => ap.level.current_streak)
  );

  // All earned badge IDs
  const allEarnedBadgeIds = data.earnedBadges.map((ub) => ub.badge_id);

  // Active objectives from all axes
  const allObjectives = data.axes.flatMap((ap) => ap.objectives);

  // All axes for the form
  const allAxes = data.axes.map((ap) => ap.axis);

  return (
    <div className="space-y-6">
      {/* ── Overview Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Global Level */}
        <Card size="sm" className="glass-card">
          <CardContent className="flex items-center gap-3">
            <div className="animate-level-glow rounded-full">
              <LevelBadge level={data.globalLevel} size="lg" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Niveau global</p>
              <p className="text-lg font-bold">{data.globalLevel}</p>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total XP */}
        <Card size="sm" className="glass-card">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Zap className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">XP Total</p>
              <p className="text-lg font-bold">
                {data.totalXP.toLocaleString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Streak */}
        <Card size="sm" className="glass-card">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Flame className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Meilleur streak</p>
              <p className="text-lg font-bold">{totalStreak} jours</p>
            </div>
          </CardContent>
        </Card>

        {/* Badges Earned */}
        <Card size="sm" className="glass-card">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Badges obtenus</p>
              <p className="text-lg font-bold">
                {data.earnedBadges.length} / {data.badges.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Radar Chart ────────────────────────────────────────────── */}
      <Card className="glass-card overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Vue d&apos;ensemble
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <RadarChart data={radarData} />
        </CardContent>
      </Card>

      {/* ── Axis Cards Grid ────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Axes de progression</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.axes.map((ap) => (
            <AxisCard
              key={ap.axis.id}
              axis={ap.axis}
              level={ap.level}
              onLogSession={() => handleLogSession(ap.axis.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Active Challenges ──────────────────────────────────────── */}
      {data.activeChallenges.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Zap className="size-4 text-amber-500" />
            Defis actifs
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activeChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* ── Objectives ─────────────────────────────────────────────── */}
      {allObjectives.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Target className="size-4 text-primary" />
            Objectifs en cours
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {allObjectives.map((objective) => (
              <ObjectiveCard key={objective.id} objective={objective} />
            ))}
          </div>
        </div>
      )}

      {/* ── Badges ─────────────────────────────────────────────────── */}
      {data.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-purple-500" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={data.badges} earnedBadgeIds={allEarnedBadgeIds} />
          </CardContent>
        </Card>
      )}

      {/* ── Recent XP Events ───────────────────────────────────────── */}
      {data.recentXPEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              XP recent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentXPEvents.slice(0, 10).map((event) => {
                const axisData = data.axes.find(
                  (ap) => ap.axis.id === event.axis_id
                );
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: axisData?.axis.color ?? "hsl(var(--muted-foreground))",
                        }}
                      />
                      <span className="text-muted-foreground">
                        {event.description ?? event.source_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{event.xp_amount} XP
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Session Log Dialog ─────────────────────────────────────── */}
      <SessionLogForm
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        axes={allAxes}
        preselectedAxisId={preselectedAxisId}
      />
    </div>
  );
}
