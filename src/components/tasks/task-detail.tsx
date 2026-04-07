"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Clock, Calendar, Tag, Folder, Zap } from "lucide-react";
import { toast } from "sonner";
import { updateTask, completeTask, uncompleteTask } from "@/app/actions/tasks";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Task, TaskPriority } from "@/types";

interface TaskDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit: (task: Task) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  1: { label: "Critique", color: "bg-red-500 text-white" },
  2: { label: "Important", color: "bg-orange-500 text-white" },
  3: { label: "Normal", color: "bg-yellow-500 text-white" },
  4: { label: "Mineur", color: "bg-blue-500 text-white" },
  5: { label: "Optionnel", color: "bg-gray-400 text-white" },
};

const energyLabels: Record<string, string> = {
  high: "Haut",
  medium: "Moyen",
  low: "Bas",
};

export function TaskDetail({ open, onOpenChange, task, onEdit }: TaskDetailProps) {
  const [notes, setNotes] = useState(task?.description ?? "");
  const [isSavingNotes, startSavingNotes] = useTransition();
  const [isTogglingComplete, startToggleComplete] = useTransition();

  // Reset notes when task changes
  useEffect(() => {
    setNotes(task?.description ?? "");
  }, [task?.description, task?.id]);

  const handleNotesBlur = useCallback(() => {
    if (!task) return;
    const newDescription = notes.trim() || null;
    if (newDescription === (task.description ?? null)) return;

    startSavingNotes(async () => {
      try {
        await updateTask(task.id, { description: newDescription });
        toast.success("Notes sauvegardees");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
        );
      }
    });
  }, [task, notes]);

  function handleToggleComplete() {
    if (!task) return;
    startToggleComplete(async () => {
      try {
        if (task.status === "done") {
          await uncompleteTask(task.id);
          toast.success(`"${task.title}" reouverte`);
        } else {
          await completeTask(task.id);
          toast.success(`"${task.title}" completee`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la mise a jour"
        );
      }
    });
  }

  function handleOpenEdit() {
    if (!task) return;
    onOpenChange(false);
    onEdit(task);
  }

  if (!task) return null;

  const isDone = task.status === "done";
  const config = priorityConfig[task.priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="pt-1">
                <Checkbox
                  checked={isDone}
                  onCheckedChange={handleToggleComplete}
                  disabled={isTogglingComplete}
                />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle
                  className={`text-lg font-semibold leading-tight ${
                    isDone ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </DialogTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleOpenEdit}
              title="Modifier la tache"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Details de la tache
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Priority + Category badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs px-2 py-0.5 ${config.color}`}>
              {config.label}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {task.category === "pro" ? "Pro" : "Perso"}
            </Badge>
            {task.energy_level && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
                <Zap className="h-3 w-3" />
                {energyLabels[task.energy_level] ?? task.energy_level}
              </Badge>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
            {task.estimated_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {task.estimated_minutes} min
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(parseISO(task.due_date), "d MMMM yyyy", { locale: fr })}
                {task.due_date_hard && (
                  <span className="text-red-500 font-medium">!</span>
                )}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Project */}
          {task.project_id && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>Projet lie</span>
            </div>
          )}

          {/* Notes / Description - live-editable */}
          <div className="space-y-1.5">
            <label
              htmlFor="task-detail-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Notes
            </label>
            <Textarea
              id="task-detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Ajouter des notes..."
              className="min-h-[100px] resize-y"
              disabled={isSavingNotes}
            />
            {isSavingNotes && (
              <p className="text-xs text-muted-foreground">Sauvegarde...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
