"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FolderOpen,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/app/actions/projects";
import type { Project, EventCategory } from "@/types";
import Link from "next/link";

const PRESET_COLORS = [
  { value: "#3b82f6", label: "Bleu" },
  { value: "#ef4444", label: "Rouge" },
  { value: "#22c55e", label: "Vert" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#6b7280", label: "Gris" },
];

interface ProjectsClientProps {
  initialProjects: Project[];
}

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  function handleOpenCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function handleOpenEdit(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projets</h1>
        <Button onClick={handleOpenCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {initialProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <CardTitle className="mb-2">Aucun projet pour le moment</CardTitle>
            <CardDescription>
              Cree ton premier projet pour organiser tes taches en sequences
            </CardDescription>
            <Button
              variant="link"
              className="mt-2"
              onClick={handleOpenCreate}
            >
              Creer un projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Card
// ---------------------------------------------------------------------------

function ProjectCard({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (project: Project) => void;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteProject(project.id);
        toast.success("Projet supprime");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression"
        );
      }
    });
  }

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: project.color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 min-w-0"
          >
            <CardTitle className="text-base truncate hover:underline">
              {project.name}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(project)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={
              project.category === "pro"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            }
          >
            {project.category === "pro" ? "Pro" : "Perso"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {project.status === "active"
              ? "Actif"
              : project.status === "planning"
                ? "Planification"
                : project.status === "paused"
                  ? "En pause"
                  : project.status === "completed"
                    ? "Termine"
                    : project.status}
          </Badge>
          {project.target_date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(parseISO(project.target_date), "d MMM yyyy", {
                locale: fr,
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Project Form Dialog
// ---------------------------------------------------------------------------

function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}) {
  const isEditing = !!project;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0].value);
  const [category, setCategory] = useState<EventCategory>(
    project?.category ?? "pro"
  );
  const [targetDate, setTargetDate] = useState(
    project?.target_date ? project.target_date.slice(0, 10) : ""
  );

  // Reset form when dialog opens with new data
  // We use a key-based approach via the open/project combination
  // but for simplicity, we update state when project changes
  const projectId = project?.id ?? null;

  // Using useState initializers above handles mount; for re-opens we need effect-like reset.
  // Since this is a controlled dialog we can rely on the parent unmounting/remounting.
  // However, to handle switching between create and edit within the same mount:
  if (open && isEditing && project && name === "" && project.name !== "") {
    setName(project.name);
    setDescription(project.description ?? "");
    setColor(project.color);
    setCategory(project.category);
    setTargetDate(project.target_date ? project.target_date.slice(0, 10) : "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && project) {
          await updateProject(project.id, {
            name: name.trim(),
            description: description.trim() || null,
            color,
            category,
            target_date: targetDate
              ? new Date(`${targetDate}T23:59:59`).toISOString()
              : null,
          });
          toast.success("Projet mis a jour");
        } else {
          await createProject({
            name: name.trim(),
            description: description.trim() || null,
            color,
            category,
            target_date: targetDate
              ? new Date(`${targetDate}T23:59:59`).toISOString()
              : null,
          });
          toast.success("Projet cree");
        }

        // Reset form
        setName("");
        setDescription("");
        setColor(PRESET_COLORS[0].value);
        setCategory("pro");
        setTargetDate("");
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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          // Reset when closing
          setName("");
          setDescription("");
          setColor(PRESET_COLORS[0].value);
          setCategory("pro");
          setTargetDate("");
        }
        onOpenChange(val);
      }}
      key={projectId}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les details du projet."
              : "Remplissez les details pour creer un nouveau projet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Nom</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon projet..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details du projet..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Category */}
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

          {/* Target date */}
          <div className="space-y-1.5">
            <Label htmlFor="project-target-date">Date cible</Label>
            <Input
              id="project-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c.value
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
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
