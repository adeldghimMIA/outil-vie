"use client";

import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/types/gamification";

interface BadgeGridProps {
  badges: Badge[];
  earnedBadgeIds: string[];
}

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "border-slate-400",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-amber-500",
};

const RARITY_BG_COLORS: Record<string, string> = {
  common: "bg-slate-100 dark:bg-slate-800",
  rare: "bg-blue-50 dark:bg-blue-950",
  epic: "bg-purple-50 dark:bg-purple-950",
  legendary: "bg-amber-50 dark:bg-amber-950",
};

const RARITY_GLOW: Record<string, string> = {
  common: "badge-glow-common",
  rare: "badge-glow-rare",
  epic: "badge-glow-epic",
  legendary: "badge-glow-legendary",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Epique",
  legendary: "Legendaire",
};

export function BadgeGrid({ badges, earnedBadgeIds }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadgeIds);

  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun badge disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {badges.map((badge) => {
        const isEarned = earnedSet.has(badge.id);
        return (
          <div
            key={badge.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all",
              RARITY_BORDER_COLORS[badge.rarity] ?? "border-slate-400",
              isEarned
                ? cn(
                    RARITY_BG_COLORS[badge.rarity] ?? "bg-slate-100 dark:bg-slate-800",
                    RARITY_GLOW[badge.rarity],
                    "hover:scale-105"
                  )
                : "border-muted bg-muted/30 grayscale"
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-lg",
                isEarned ? "opacity-100" : "opacity-40"
              )}
            >
              {badge.icon ? (
                <span className="text-2xl">{badge.icon}</span>
              ) : (
                <Award className="size-6" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "text-xs font-semibold",
                  !isEarned && "text-muted-foreground"
                )}
              >
                {badge.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {RARITY_LABELS[badge.rarity] ?? badge.rarity}
              </p>
            </div>
            {badge.description && isEarned && (
              <p className="text-[10px] text-muted-foreground leading-tight">
                {badge.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
