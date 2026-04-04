"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Clock,
  Calendar,
  Zap,
  Tag,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import type { ParsedTask } from "@/lib/ai/schemas";
import type { EnergyLevel, EventCategory, TaskPriority } from "@/types";

interface ParsedTasksReviewProps {
  parsedTasks: ParsedTask[];
  onConfirm: (tasks: ParsedTask[]) => void;
  onCancel: () => void;
}

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Critique", color: "bg-red-500 text-white" },
  2: { label: "Important", color: "bg-orange-500 text-white" },
  3: { label: "Normal", color: "bg-yellow-500 text-white" },
  4: { label: "Mineur", color: "bg-blue-500 text-white" },
  5: { label: "Optionnel", color: "bg-gray-400 text-white" },
};

const energyLabels: Record<string, { label: string; icon: string }> = {
  high: { label: "Haute", icon: "text-red-500" },
  medium: { label: "Moyenne", icon: "text-yellow-500" },
  low: { label: "Basse", icon: "text-green-500" },
};

export function ParsedTasksReview({
  parsedTasks,
  onConfirm,
  onCancel,
}: ParsedTasksReviewProps) {
  const [tasks, setTasks] = useState<ParsedTask[]>(() => [...parsedTasks]);

  function updateTask(index: number, updates: Partial<ParsedTask>) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold">
            {tasks.length} tache{tasks.length > 1 ? "s" : ""} detectee
            {tasks.length > 1 ? "s" : ""}
          </h3>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {tasks.map((task, index) => (
          <Card key={index} className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeTask(index)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>

            <CardContent className="space-y-3 pt-4 pb-4">
              {/* Title */}
              <div className="space-y-1 pr-6">
                <Label className="text-xs text-muted-foreground">Titre</Label>
                <Input
                  value={task.title}
                  onChange={(e) =>
                    updateTask(index, { title: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              {/* Row: Priority + Category */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Priorite
                  </Label>
                  <Select
                    value={String(task.priority)}
                    onValueChange={(v) =>
                      updateTask(index, {
                        priority: Number(v) as TaskPriority,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
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

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Categorie
                  </Label>
                  <Select
                    value={task.category}
                    onValueChange={(v) =>
                      updateTask(index, {
                        category: v as EventCategory,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="perso">Perso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row: Energy + Minutes + Due date */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    Energie
                  </Label>
                  <Select
                    value={task.energy_level}
                    onValueChange={(v) =>
                      updateTask(index, {
                        energy_level: v as EnergyLevel,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Minutes
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={task.estimated_minutes}
                    onChange={(e) =>
                      updateTask(index, {
                        estimated_minutes: parseInt(e.target.value, 10) || 15,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Echeance
                  </Label>
                  <Input
                    type="date"
                    value={task.due_date ?? ""}
                    onChange={(e) =>
                      updateTask(index, {
                        due_date: e.target.value || null,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {task.tags.map((tag, tagIndex) => (
                    <Badge
                      key={tagIndex}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Priority + Energy badges (visual summary) */}
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${priorityLabels[task.priority]?.color ?? ""}`}
                >
                  {priorityLabels[task.priority]?.label ?? "Normal"}
                </Badge>
                <span
                  className={`flex items-center gap-1 text-[10px] ${energyLabels[task.energy_level]?.icon ?? ""}`}
                >
                  <Zap className="h-3 w-3" />
                  {energyLabels[task.energy_level]?.label ?? task.energy_level}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Toutes les taches ont ete supprimees.
        </div>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={tasks.length === 0}
          onClick={() => onConfirm(tasks)}
          className="gap-2 flex-1"
        >
          <CheckCircle2 className="h-4 w-4" />
          Valider {tasks.length} tache{tasks.length > 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
