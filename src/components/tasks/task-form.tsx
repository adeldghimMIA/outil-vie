"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createTask, updateTask } from "@/app/actions/tasks";
import type {
  Task,
  EventCategory,
  TaskPriority,
  EnergyLevel,
} from "@/types";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultCategory?: EventCategory;
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  defaultCategory,
}: TaskFormProps) {
  const isEditing = !!task;
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(
    task?.category ?? defaultCategory ?? "pro"
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? 3
  );
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | "">(
    task?.energy_level ?? ""
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(
    task?.estimated_minutes?.toString() ?? ""
  );
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.slice(0, 10) : ""
  );
  const [dueDateHard, setDueDateHard] = useState(task?.due_date_hard ?? false);
  const [tagsInput, setTagsInput] = useState(
    task?.tags?.join(", ") ?? ""
  );
  const [isFlexible, setIsFlexible] = useState(task?.is_flexible ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    startTransition(async () => {
      try {
        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const parsedMinutes = estimatedMinutes
          ? parseInt(estimatedMinutes, 10)
          : null;

        if (isEditing && task) {
          await updateTask(task.id, {
            title: title.trim(),
            description: description.trim() || null,
            category,
            priority,
            energy_level: energyLevel || null,
            estimated_minutes:
              parsedMinutes && !isNaN(parsedMinutes) ? parsedMinutes : null,
            due_date: dueDate
              ? new Date(`${dueDate}T23:59:59`).toISOString()
              : null,
            due_date_hard: dueDateHard,
            tags,
            is_flexible: isFlexible,
          });
          toast.success("Tache mise a jour");
        } else {
          await createTask({
            title: title.trim(),
            description: description.trim() || null,
            category,
            priority,
            energy_level: energyLevel || null,
            estimated_minutes:
              parsedMinutes && !isNaN(parsedMinutes) ? parsedMinutes : null,
            due_date: dueDate
              ? new Date(`${dueDate}T23:59:59`).toISOString()
              : null,
            due_date_hard: dueDateHard,
            tags,
            is_flexible: isFlexible,
          });
          toast.success("Tache creee");
        }

        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde"
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la tache" : "Nouvelle tache"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les details de la tache."
              : "Remplissez les details pour creer une nouvelle tache."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Titre</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Finir le rapport..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details de la tache..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EventCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="perso">Perso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priorite</Label>
              <Select
                value={String(priority)}
                onValueChange={(v) => setPriority(Number(v) as TaskPriority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Critique</SelectItem>
                  <SelectItem value="2">2 - Important</SelectItem>
                  <SelectItem value="3">3 - Normal</SelectItem>
                  <SelectItem value="4">4 - Mineur</SelectItem>
                  <SelectItem value="5">5 - Optionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Energy level */}
          <div className="space-y-1.5">
            <Label>Niveau d&apos;energie requis</Label>
            <Select
              value={energyLevel}
              onValueChange={(v) => setEnergyLevel(v as EnergyLevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Non defini" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Haut</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Bas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated time */}
          <div className="space-y-1.5">
            <Label htmlFor="task-estimated">Duree estimee (minutes)</Label>
            <Input
              id="task-estimated"
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="30"
            />
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">Date d&apos;echeance</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Due date hard toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="task-due-hard">Echeance stricte</Label>
            <Switch
              id="task-due-hard"
              checked={dueDateHard}
              onCheckedChange={(val) => setDueDateHard(val)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="task-tags">Tags (separes par des virgules)</Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="rapport, urgent, client"
            />
          </div>

          {/* Flexible toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="task-flexible">Tache flexible</Label>
            <Switch
              id="task-flexible"
              checked={isFlexible}
              onCheckedChange={(val) => setIsFlexible(val)}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Enregistrement..."
                : isEditing
                  ? "Mettre a jour"
                  : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
