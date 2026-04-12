"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Lock,
  Plus,
  Sparkles,
  Trophy,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillMilestone } from "@/types/gamification";

interface SkillTreeProps {
  milestones: SkillMilestone[];
  axisColor: string;
  onComplete: (id: string) => void;
  onAdd: () => void;
  onGenerateAI?: () => void;
  isPending?: boolean;
}

export function SkillTree({
  milestones,
  axisColor,
  onComplete,
  onAdd,
  onGenerateAI,
  isPending = false,
}: SkillTreeProps) {
  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Trophy className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Aucun objectif pour le moment</p>
          <p className="text-xs text-muted-foreground">
            Ajoutez des jalons pour tracer votre progression
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-1 size-4" />
            Ajouter un jalon
          </Button>
          {onGenerateAI && (
            <Button size="sm" variant="outline" onClick={onGenerateAI}>
              <Sparkles className="mr-1 size-4" />
              Generer avec IA
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />

      {milestones.map((milestone, index) => (
        <MilestoneNode
          key={milestone.id}
          milestone={milestone}
          index={index}
          isLast={index === milestones.length - 1}
          axisColor={axisColor}
          onComplete={onComplete}
          isPending={isPending}
        />
      ))}

      {/* Add buttons at the bottom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: milestones.length * 0.08 + 0.1 }}
        className="relative flex items-center gap-2 py-4"
      >
        {/* Node dot for the add button */}
        <div className="absolute -left-8 flex size-[30px] items-center justify-center">
          <div className="size-3 rounded-full border-2 border-dashed border-muted-foreground/40" />
        </div>

        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 size-4" />
          Ajouter un jalon
        </Button>
        {onGenerateAI && (
          <Button size="sm" variant="outline" onClick={onGenerateAI}>
            <Sparkles className="mr-1 size-4" />
            Generer avec IA
          </Button>
        )}
      </motion.div>
    </div>
  );
}

// ─── Milestone Node ──────────────────────────────────────────────────────────

interface MilestoneNodeProps {
  milestone: SkillMilestone;
  index: number;
  isLast: boolean;
  axisColor: string;
  onComplete: (id: string) => void;
  isPending: boolean;
}

function MilestoneNode({
  milestone,
  index,
  isLast,
  axisColor,
  onComplete,
  isPending,
}: MilestoneNodeProps) {
  const isCompleted = milestone.status === "completed";
  const isActive = milestone.status === "active";
  const isLocked = milestone.status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative pb-6 last:pb-0"
    >
      {/* Connecting line segment */}
      {!isLast && (
        <div
          className={cn(
            "absolute -left-8 top-[15px] h-full w-0.5",
            isCompleted ? "bg-emerald-500" : "border-l-2 border-dashed border-muted-foreground/30 bg-transparent"
          )}
          style={{
            left: "15px",
          }}
        />
      )}

      {/* Node circle */}
      <div className="absolute -left-8 top-0 flex size-[30px] items-center justify-center">
        {isCompleted && (
          <div className="flex size-[30px] items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="size-4" />
          </div>
        )}
        {isActive && (
          <div
            className="relative flex size-[30px] items-center justify-center rounded-full"
            style={{ backgroundColor: axisColor }}
          >
            <div
              className="absolute inset-0 animate-ping rounded-full opacity-30"
              style={{ backgroundColor: axisColor }}
            />
            <div
              className="relative flex size-[30px] items-center justify-center rounded-full border-2 border-white/50"
              style={{ backgroundColor: axisColor }}
            >
              <Trophy className="size-3.5 text-white" />
            </div>
          </div>
        )}
        {isLocked && (
          <div className="flex size-[30px] items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-3.5" />
          </div>
        )}
      </div>

      {/* Content card */}
      <div
        className={cn(
          "rounded-lg border p-3 transition-all",
          isCompleted && "border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20",
          isActive && "border-2 shadow-sm",
          isLocked && "border-dashed opacity-60"
        )}
        style={isActive ? { borderColor: `${axisColor}40` } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "text-sm font-semibold",
                  isCompleted && "text-emerald-700 dark:text-emerald-400",
                  isLocked && "text-muted-foreground"
                )}
              >
                {milestone.title}
              </h4>
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px]"
              >
                +{milestone.xp_reward} XP
              </Badge>
            </div>

            {milestone.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {milestone.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {milestone.duration_weeks && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {milestone.duration_weeks} sem.
                </span>
              )}
              {milestone.target_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(milestone.target_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
              {isCompleted && milestone.completed_at && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" />
                  Complete le{" "}
                  {new Date(milestone.completed_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => onComplete(milestone.id)}
              disabled={isPending}
              className="w-full"
              style={{
                backgroundColor: axisColor,
                color: "white",
              }}
            >
              {isPending ? "En cours..." : "Marquer complete"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
