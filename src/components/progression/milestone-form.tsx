"use client";

import { useState, useEffect, useTransition } from "react";
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
import type { SkillMilestone } from "@/types/gamification";

interface MilestoneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: SkillMilestone | null;
  axisId: string;
  onSubmit: (data: {
    title: string;
    description: string;
    durationWeeks: number | undefined;
    xpReward: number;
    targetDate: string | undefined;
  }) => void;
}

export function MilestoneForm({
  open,
  onOpenChange,
  milestone,
  axisId,
  onSubmit,
}: MilestoneFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [xpReward, setXpReward] = useState("100");
  const [targetDate, setTargetDate] = useState("");

  const isEditing = !!milestone;

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? "");
      setDurationWeeks(milestone.duration_weeks?.toString() ?? "");
      setXpReward(milestone.xp_reward.toString());
      setTargetDate(milestone.target_date ?? "");
    } else {
      setTitle("");
      setDescription("");
      setDurationWeeks("");
      setXpReward("100");
      setTargetDate("");
    }
  }, [milestone, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    const dw = durationWeeks ? parseInt(durationWeeks, 10) : undefined;
    const xp = parseInt(xpReward, 10) || 100;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      durationWeeks: dw && !isNaN(dw) ? dw : undefined,
      xpReward: xp,
      targetDate: targetDate || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le jalon" : "Nouveau jalon"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les details de ce jalon."
              : "Definissez un nouveau jalon pour tracer votre progression."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Titre</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Courir 5km sans pause"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="milestone-description">
              Description (optionnel)
            </Label>
            <Textarea
              id="milestone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez cet objectif en quelques mots..."
              rows={3}
            />
          </div>

          {/* Duration weeks */}
          <div className="space-y-2">
            <Label htmlFor="milestone-duration">
              Duree estimee (semaines)
            </Label>
            <Input
              id="milestone-duration"
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              placeholder="Ex: 3"
            />
          </div>

          {/* XP Reward */}
          <div className="space-y-2">
            <Label htmlFor="milestone-xp">Recompense XP</Label>
            <Input
              id="milestone-xp"
              type="number"
              min={10}
              max={10000}
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Target date */}
          <div className="space-y-2">
            <Label htmlFor="milestone-date">Date cible (optionnel)</Label>
            <Input
              id="milestone-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
