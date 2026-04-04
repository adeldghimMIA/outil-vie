"use client";

import { useRef, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadBanner } from "@/app/actions/profile";
import { cn } from "@/lib/utils";

interface BannerProps {
  bannerUrl?: string | null;
  userName?: string | null;
}

export function Banner({ bannerUrl, userName }: BannerProps) {
  const today = new Date();
  const greeting = getGreeting();
  const dateStr = format(today, "EEEE d MMMM yyyy", { locale: fr });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        await uploadBanner(formData);
        toast.success("Banniere mise a jour !");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        toast.error(message);
      }
    });

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="group relative h-32 w-full overflow-hidden rounded-xl sm:h-40">
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

      {/* Upload overlay on hover */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className={cn(
          "absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100",
          isPending && "opacity-100"
        )}
      >
        {isPending ? (
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm font-medium">Upload en cours...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white">
            <Camera className="size-5" />
            <span className="text-sm font-medium">Changer la banniere</span>
          </div>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

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
