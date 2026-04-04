"use client";

import {
  Dumbbell,
  Brain,
  Languages,
  Briefcase,
  Palette,
  Users,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "./level-badge";
import { XPProgressBar } from "./xp-progress-bar";
import { StreakIndicator } from "./streak-indicator";
import type { GamificationAxis, UserLevel } from "@/types/gamification";

interface AxisCardProps {
  axis: GamificationAxis;
  level: UserLevel;
  onLogSession: () => void;
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

export function AxisCard({ axis, level, onLogSession }: AxisCardProps) {
  const Icon = AXIS_ICONS[axis.slug] ?? Dumbbell;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${axis.color}20`, color: axis.color }}
            >
              <Icon className="size-4" />
            </div>
            <span>{axis.name}</span>
          </CardTitle>
          <LevelBadge level={level.current_level} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <XPProgressBar
          currentXP={level.total_xp}
          nextLevelXP={level.xp_for_next_level}
          level={level.current_level}
        />
        <div className="flex items-center justify-between">
          <StreakIndicator
            currentStreak={level.current_streak}
            longestStreak={level.longest_streak}
          />
          <Button size="sm" variant="outline" onClick={onLogSession}>
            Logger une session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
