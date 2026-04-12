"use client";

import { useState, useTransition } from "react";
import {
  Dumbbell,
  Brain,
  Languages,
  Briefcase,
  Palette,
  Users,
  Heart,
  Flame,
  Zap,
  Star,
  Clock,
  Award,
  Target,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "./level-badge";
import { XPProgressBar } from "./xp-progress-bar";
import { StreakIndicator } from "./streak-indicator";
import { SkillTree } from "./skill-tree";
import { MilestoneForm } from "./milestone-form";
import { BadgeGrid } from "./badge-grid";
import { cn } from "@/lib/utils";
import {
  createMilestone,
  completeMilestone,
} from "@/app/actions/milestones";
import type {
  GamificationAxis,
  UserLevel,
  SkillMilestone,
  Badge as BadgeType,
  XPEvent,
} from "@/types/gamification";

interface ActivitySession {
  id: string;
  session_date: string;
  duration_minutes: number;
  rating: number | null;
  notes: string | null;
}

interface PilierDetailClientProps {
  axis: GamificationAxis;
  level: UserLevel;
  milestones: SkillMilestone[];
  sessions: ActivitySession[];
  badges: BadgeType[];
  earnedBadgeIds: string[];
  xpEvents: XPEvent[];
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

interface AISuggestion {
  title: string;
  description: string;
  duration_weeks: number;
  xp_reward: number;
}

export function PilierDetailClient({
  axis,
  level,
  milestones,
  sessions,
  badges,
  earnedBadgeIds,
  xpEvents,
}: PilierDetailClientProps) {
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<SkillMilestone | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);

  const Icon = AXIS_ICONS[axis.slug] ?? Dumbbell;

  function handleComplete(milestoneId: string) {
    startTransition(async () => {
      try {
        await completeMilestone(milestoneId);
        toast.success("Jalon complete ! XP attribue.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erreur lors de la completion."
        );
      }
    });
  }

  function handleAddMilestone() {
    setEditingMilestone(null);
    setMilestoneFormOpen(true);
  }

  function handleMilestoneSubmit(data: {
    title: string;
    description: string;
    durationWeeks: number | undefined;
    xpReward: number;
    targetDate: string | undefined;
  }) {
    startTransition(async () => {
      try {
        await createMilestone({
          axisId: axis.id,
          title: data.title,
          description: data.description || undefined,
          durationWeeks: data.durationWeeks,
          xpReward: data.xpReward,
          targetDate: data.targetDate,
        });
        toast.success("Jalon cree avec succes !");
        setMilestoneFormOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erreur lors de la creation."
        );
      }
    });
  }

  async function handleGenerateAI() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          axisId: axis.id,
          axisName: axis.name,
          axisDescription: axis.description,
          existingMilestones: milestones.map((m) => ({
            title: m.title,
            status: m.status,
          })),
          currentLevel: level.current_level,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ?? "Erreur lors de la generation."
        );
      }

      const suggestions: AISuggestion[] = await response.json();

      // Create each suggested milestone
      for (const suggestion of suggestions) {
        await createMilestone({
          axisId: axis.id,
          title: suggestion.title,
          description: suggestion.description,
          durationWeeks: suggestion.duration_weeks,
          xpReward: suggestion.xp_reward,
        });
      }

      toast.success(`${suggestions.length} jalons generes avec l'IA !`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la generation IA."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: axis.color }}
        />
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex size-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${axis.color}20`,
                  color: axis.color,
                }}
              >
                <Icon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{axis.name}</h1>
                  <LevelBadge level={level.current_level} size="sm" />
                </div>
                {axis.description && (
                  <p className="text-sm text-muted-foreground">
                    {axis.description}
                  </p>
                )}
              </div>
            </div>
            <StreakIndicator
              currentStreak={level.current_streak}
              longestStreak={level.longest_streak}
            />
          </div>
          <div className="mt-4">
            <XPProgressBar
              currentXP={level.total_xp}
              nextLevelXP={level.xp_for_next_level}
              level={level.current_level}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Skill Tree ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" style={{ color: axis.color }} />
            Arbre de competences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillTree
            milestones={milestones}
            axisColor={axis.color}
            onComplete={handleComplete}
            onAdd={handleAddMilestone}
            onGenerateAI={handleGenerateAI}
            isPending={isPending || isGenerating}
          />
        </CardContent>
      </Card>

      {/* ── Recent Sessions ────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              Sessions recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{session.duration_minutes} min</span>
                    </div>
                    {session.rating && session.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-3",
                              i < session.rating!
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {session.notes && (
                    <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {session.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Badges ──────────────────────────────────────────────────── */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-purple-500" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BadgeGrid badges={badges} earnedBadgeIds={earnedBadgeIds} />
          </CardContent>
        </Card>
      )}

      {/* ── Recent XP Events ───────────────────────────────────────── */}
      {xpEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              XP recent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {xpEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {event.description ?? event.source_type}
                  </span>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Milestone Form Dialog ──────────────────────────────────── */}
      <MilestoneForm
        open={milestoneFormOpen}
        onOpenChange={setMilestoneFormOpen}
        milestone={editingMilestone}
        axisId={axis.id}
        onSubmit={handleMilestoneSubmit}
      />
    </div>
  );
}
