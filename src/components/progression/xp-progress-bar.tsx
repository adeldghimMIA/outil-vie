"use client";

import { cn } from "@/lib/utils";
import { getLevelProgress } from "@/lib/gamification/level-calculator";

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
}

export function XPProgressBar({
  currentXP,
  nextLevelXP,
  level,
  className,
}: XPProgressBarProps) {
  const { progress } = getLevelProgress(currentXP);
  const xpInLevel = currentXP - (level - 1) ** 2 * 25;
  const xpNeeded = nextLevelXP - (level - 1) ** 2 * 25;

  return (
    <div className={cn("w-full space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Niv. {level}</span>
        <span>
          {xpInLevel} / {xpNeeded} XP
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
