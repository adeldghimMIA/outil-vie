"use client";

import { Zap, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DailyChallenge } from "@/types/gamification";

interface ChallengeCardProps {
  challenge: DailyChallenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isCompleted = challenge.completed_at !== null;
  const progress =
    challenge.target_value > 0
      ? Math.min(100, (challenge.current_value / challenge.target_value) * 100)
      : 0;

  const expiresAt = new Date(challenge.expires_at);
  const now = new Date();
  const hoursRemaining = Math.max(
    0,
    Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
  );

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Zap
                className={cn(
                  "size-4 shrink-0",
                  isCompleted
                    ? "text-emerald-500"
                    : "text-amber-500"
                )}
              />
              <span className="text-sm font-medium">{challenge.title}</span>
            </div>
            {challenge.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {challenge.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            +{challenge.xp_reward} XP
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {challenge.current_value} / {challenge.target_value}
            </span>
            {!isCompleted && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {hoursRemaining}h restantes
              </span>
            )}
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCompleted ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {isCompleted && (
          <p className="text-xs font-medium text-emerald-500">
            Defi complete !
          </p>
        )}
      </CardContent>
    </Card>
  );
}
