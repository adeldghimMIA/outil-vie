"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { logSession } from "@/app/actions/gamification";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { GamificationAxis } from "@/types/gamification";

interface SessionLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  axes: GamificationAxis[];
  preselectedAxisId?: string;
}

export function SessionLogForm({
  open,
  onOpenChange,
  axes,
  preselectedAxisId,
}: SessionLogFormProps) {
  const [axisId, setAxisId] = useState(preselectedAxisId ?? "");
  const [duration, setDuration] = useState("30");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setAxisId(preselectedAxisId ?? "");
    setDuration("30");
    setRating(0);
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!axisId) {
      toast.error("Veuillez selectionner un axe.");
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Duree invalide.");
      return;
    }

    startTransition(async () => {
      try {
        await logSession({
          userId: DEFAULT_USER_ID,
          activityId: axisId,
          axisId,
          durationMinutes: durationNum,
          notes: notes || undefined,
          rating: rating > 0 ? rating : undefined,
        });
        toast.success("Session enregistree ! XP attribue.");
        resetForm();
        onOpenChange(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erreur lors de l'enregistrement."
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Logger une session</DialogTitle>
          <DialogDescription>
            Enregistrez votre activite pour gagner de l&apos;XP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Axis selector */}
          <div className="space-y-2">
            <Label htmlFor="axis-select">Axe</Label>
            <Select value={axisId} onValueChange={(v) => setAxisId(v ?? "")}>
              <SelectTrigger className="w-full" id="axis-select">
                <SelectValue placeholder="Choisir un axe" />
              </SelectTrigger>
              <SelectContent>
                {axes.map((axis) => (
                  <SelectItem key={axis.id} value={axis.id}>
                    {axis.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duree (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
            />
          </div>

          {/* Star rating */}
          <div className="space-y-2">
            <Label>Note (optionnel)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="rounded p-0.5 transition-colors hover:bg-muted"
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passee la session ?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
