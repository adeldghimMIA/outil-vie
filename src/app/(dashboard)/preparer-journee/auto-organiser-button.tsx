"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { autoOrganiseToday } from "@/app/actions/planning";

export function AutoOrganiserButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const result = await autoOrganiseToday();

      if (result.scheduledCount === 0) {
        toast.info("Aucune tache a planifier ou pas de creneau disponible.");
      } else {
        toast.success(
          `${result.scheduledCount} tache${result.scheduledCount > 1 ? "s" : ""} planifiee${result.scheduledCount > 1 ? "s" : ""} !`,
        );
      }

      if (result.unschedulableCount > 0) {
        toast.warning(
          `${result.unschedulableCount} tache${result.unschedulableCount > 1 ? "s" : ""} n'ont pas pu etre placee${result.unschedulableCount > 1 ? "s" : ""}.`,
        );
      }

      router.refresh();
    } catch (error) {
      console.error("Auto-organise error:", error);
      toast.error("Erreur lors de l'auto-organisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="default" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      Auto-organiser
    </Button>
  );
}
