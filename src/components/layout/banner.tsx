"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BannerProps {
  bannerUrl?: string | null;
  userName?: string | null;
}

export function Banner({ bannerUrl, userName }: BannerProps) {
  const today = new Date();
  const greeting = getGreeting();
  const dateStr = format(today, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl sm:h-40">
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500"
        style={
          bannerUrl
            ? {
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-4 sm:p-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {greeting}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-sm capitalize text-white/80">{dateStr}</p>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}
