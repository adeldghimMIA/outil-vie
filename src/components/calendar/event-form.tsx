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
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/events";
import { Trash2 } from "lucide-react";
import type {
  CalendarEvent,
  EventCategory,
  EventType,
  EventRecurrence,
} from "@/types";

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

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultCategory?: EventCategory;
  defaultDate?: Date;
}

export function EventForm({
  open,
  onOpenChange,
  event,
  defaultCategory,
  defaultDate,
}: EventFormProps) {
  const isEditing = !!event;
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const now = defaultDate ?? new Date();
  const defaultStart = event
    ? event.start_at.slice(0, 16)
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:00`;
  const defaultEnd = event
    ? event.end_at.slice(0, 16)
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours() + 1).padStart(2, "0")}:00`;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(
    event?.category ?? defaultCategory ?? "pro"
  );
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);
  const [color, setColor] = useState(event?.color ?? PRESET_COLORS[0].value);
  const [eventType, setEventType] = useState<EventType>(
    event?.event_type ?? "fixed"
  );
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [recurrence, setRecurrence] = useState<EventRecurrence>(
    event?.recurrence ?? "none"
  );
  const [isUrgent, setIsUrgent] = useState(event?.is_urgent ?? false);

  function handleDelete() {
    if (!event) return;
    startDeleteTransition(async () => {
      try {
        await deleteEvent(event.id);
        toast.success("Evenement supprime");
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression"
        );
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!startAt || !endAt) {
      toast.error("Les dates de debut et de fin sont requises");
      return;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      toast.error("La date de fin doit etre apres la date de debut");
      return;
    }

    startTransition(async () => {
      try {
        const formData = {
          title: title.trim(),
          description: description.trim() || null,
          location: null,
          color,
          category,
          event_type: eventType,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          all_day: allDay,
          recurrence,
          recurrence_rule: null,
          recurrence_end_at: null,
          parent_event_id: null,
          is_urgent: isUrgent,
          reminder_minutes: [],
          activity_id: null,
          external_id: null,
          external_source: null,
        };

        if (isEditing && event) {
          await updateEvent(event.id, formData);
          toast.success("Evenement mis a jour");
        } else {
          await createEvent(formData);
          toast.success("Evenement cree");
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
            {isEditing ? "Modifier l'evenement" : "Nouvel evenement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les details de l'evenement."
              : "Remplissez les details pour creer un nouvel evenement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Titre</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reunion d'equipe..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details de l'evenement..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Category + Event Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
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
              <Label>Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixe</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="event-all-day">Toute la journee</Label>
            <Switch
              id="event-all-day"
              checked={allDay}
              onCheckedChange={(val) => setAllDay(val)}
            />
          </div>

          {/* Start / End date-time */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start">Debut</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end">Fin</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event-start-date">Date debut</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={startAt.slice(0, 10)}
                  onChange={(e) => setStartAt(`${e.target.value}T00:00`)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-end-date">Date fin</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={endAt.slice(0, 10)}
                  onChange={(e) => setEndAt(`${e.target.value}T23:59`)}
                  required
                />
              </div>
            </div>
          )}

          {/* Recurrence */}
          <div className="space-y-1.5">
            <Label>Recurrence</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as EventRecurrence)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                <SelectItem value="daily">Quotidienne</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="yearly">Annuelle</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Urgent toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="event-urgent">Urgent</Label>
            <Switch
              id="event-urgent"
              checked={isUrgent}
              onCheckedChange={(val) => setIsUrgent(val)}
            />
          </div>

          <DialogFooter>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || isPending}
                onClick={handleDelete}
                className="gap-1.5 sm:mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            )}
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button type="submit" disabled={isPending || isDeleting}>
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
