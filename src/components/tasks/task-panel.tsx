"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, ListTodo, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { completeTask } from "@/app/actions/tasks";
import { TaskForm } from "@/components/tasks/task-form";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventCategory, Task, TaskPriority } from "@/types";

interface TaskPanelProps {
  category: EventCategory | null;
  tasks: Task[];
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  1: { label: "Critique", color: "bg-red-500 text-white" },
  2: { label: "Important", color: "bg-orange-500 text-white" },
  3: { label: "Normal", color: "bg-yellow-500 text-white" },
  4: { label: "Mineur", color: "bg-blue-500 text-white" },
  5: { label: "Optionnel", color: "bg-gray-400 text-white" },
};

export function TaskPanel({ category, tasks }: TaskPanelProps) {
  const [rawInput, setRawInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const title =
    category === "pro"
      ? "Taches Pro"
      : category === "perso"
        ? "Taches Perso"
        : "Toutes les taches";

  const pendingTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t) => t.status === "done");

  function handleOpenCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function handleExtract() {
    toast.info("Fonctionnalite IA bientot disponible");
  }

  function handlePlanDay() {
    toast.info("Fonctionnalite IA bientot disponible");
  }

  return (
    <>
      <div className="space-y-4">
        {/* Quick capture - always visible */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListTodo className="h-5 w-5" />
                {title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenCreate}
                title="Nouvelle tache"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Textarea
              placeholder="Tape tes notes en vrac... Ex: finir le rapport pour vendredi, acheter du lait, preparer la presentation..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <Button
              size="sm"
              disabled={!rawInput.trim()}
              className="gap-2"
              onClick={handleExtract}
            >
              <Sparkles className="h-4 w-4" />
              Extraire les taches
            </Button>
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aujourd&apos;hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <ListTodo className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Aucune tache pour aujourd&apos;hui
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={handleOpenCreate}
                >
                  Ajouter des taches
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {pendingTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={handleOpenEdit}
                  />
                ))}
                {completedTasks.length > 0 && (
                  <>
                    <div className="pt-2 pb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Completees ({completedTasks.length})
                      </span>
                    </div>
                    {completedTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onEdit={handleOpenEdit}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan day button */}
        <Button className="w-full gap-2" variant="outline" onClick={handlePlanDay}>
          <Sparkles className="h-4 w-4" />
          Planifier ma journee
        </Button>
      </div>

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        defaultCategory={category ?? undefined}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Individual task row
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const config = priorityConfig[task.priority];

  function handleComplete() {
    if (isDone) return;
    startTransition(async () => {
      try {
        await completeTask(task.id);
        toast.success(`"${task.title}" completee`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de la completion"
        );
      }
    });
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 ${
        isDone ? "opacity-60" : ""
      }`}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={isDone}
          onCheckedChange={handleComplete}
          disabled={isDone || isPending}
        />
      </div>
      <button
        type="button"
        className="flex-1 min-w-0 text-left cursor-pointer"
        onClick={() => onEdit(task)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              isDone ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </span>
          <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${config.color}`}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {task.estimated_minutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimated_minutes}min
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.due_date), "d MMM", { locale: fr })}
              {task.due_date_hard && (
                <span className="text-red-500 font-medium">!</span>
              )}
            </span>
          )}
          {task.tags.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              {task.tags.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
