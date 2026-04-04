"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { CalendarEvent } from "@/types";

interface MoveEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  newStart: Date;
  newEnd: Date;
  onConfirm: (mode: "single" | "all") => void;
}

export function MoveEventDialog({
  open,
  onOpenChange,
  event,
  newStart,
  newEnd,
  onConfirm,
}: MoveEventDialogProps) {
  const oldStart = parseISO(event.start_at);
  const oldEnd = parseISO(event.end_at);

  const formatDateTime = (d: Date) =>
    format(d, "EEEE d MMM, HH:mm", { locale: fr });

  const isRecurring = event.recurrence !== "none";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deplacer cet evenement ?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block font-medium text-foreground">
              {event.title}
            </span>
            <span className="mt-2 block text-xs">
              <span className="text-muted-foreground">Ancien horaire :</span>{" "}
              {formatDateTime(oldStart)} - {format(oldEnd, "HH:mm")}
            </span>
            <span className="block text-xs">
              <span className="text-muted-foreground">Nouvel horaire :</span>{" "}
              {formatDateTime(newStart)} - {format(newEnd, "HH:mm")}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          {isRecurring ? (
            <>
              <AlertDialogAction
                variant="outline"
                onClick={() => onConfirm("single")}
              >
                Juste cette fois
              </AlertDialogAction>
              <AlertDialogAction onClick={() => onConfirm("all")}>
                Toutes les occurrences
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => onConfirm("single")}>
              Deplacer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
