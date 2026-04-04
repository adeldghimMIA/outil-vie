"use client";

import { useState, useMemo, useCallback, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { EventForm } from "@/components/calendar/event-form";
import { MoveEventDialog } from "@/components/calendar/move-event-dialog";
import { updateEvent } from "@/app/actions/events";
import type { CalendarView, EventCategory, CalendarEvent } from "@/types";

interface CalendarSectionProps {
  category: EventCategory | null;
  events: CalendarEvent[];
}

const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7h - 21h

export function CalendarSection({ category, events }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [clickedDate, setClickedDate] = useState<Date | undefined>(undefined);

  // Drag-and-drop state
  const [activeDragEvent, setActiveDragEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    event: CalendarEvent;
    newStart: Date;
    newEnd: Date;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Track whether a drag actually occurred to suppress click after drag
  const didDragRef = useRef(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Configure pointer sensor with distance constraint so clicks still work
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const sensors = useSensors(pointerSensor);

  const navigatePrev = () => {
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const title =
    category === "pro"
      ? "Calendrier Pro"
      : category === "perso"
        ? "Calendrier Perso"
        : "Calendrier";

  function handleOpenCreate(date?: Date) {
    setEditingEvent(null);
    setClickedDate(date);
    setFormOpen(true);
  }

  function handleOpenEdit(event: CalendarEvent) {
    setEditingEvent(event);
    setClickedDate(undefined);
    setFormOpen(true);
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { event: CalendarEvent }
      | undefined;
    if (data?.event) {
      setActiveDragEvent(data.event);
      didDragRef.current = true;
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragEvent(null);

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      | { event: CalendarEvent }
      | undefined;
    const overData = over.data.current as
      | { day: Date; hour: number }
      | undefined;

    if (!activeData?.event || !overData) return;

    const calEvent = activeData.event;
    const evStart = parseISO(calEvent.start_at);
    const evEnd = parseISO(calEvent.end_at);
    const durationMs = evEnd.getTime() - evStart.getTime();

    // Build new start: target day + target hour, keep minutes from original
    const newStart = new Date(overData.day);
    newStart.setHours(overData.hour, evStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Don't open dialog if dropped back on same slot
    if (
      newStart.getTime() === evStart.getTime()
    ) {
      return;
    }

    setPendingMove({ event: calEvent, newStart, newEnd });
    setMoveDialogOpen(true);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragEvent(null);
  }, []);

  const handleConfirmMove = useCallback(
    (mode: "single" | "all") => {
      if (!pendingMove) return;

      const { event: calEvent, newStart, newEnd } = pendingMove;

      startTransition(async () => {
        try {
          await updateEvent(calEvent.id, {
            start_at: newStart.toISOString(),
            end_at: newEnd.toISOString(),
          });
          toast.success("Evenement deplace");
        } catch {
          toast.error("Erreur lors du deplacement");
        }
      });

      setMoveDialogOpen(false);
      setPendingMove(null);
    },
    [pendingMove],
  );

  const handleMoveDialogClose = useCallback((open: boolean) => {
    setMoveDialogOpen(open);
    if (!open) {
      setPendingMove(null);
    }
  }, []);

  // Wrapper for event click that suppresses click right after drag
  const handleEventClick = useCallback(
    (ev: CalendarEvent) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      handleOpenEdit(ev);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <>
      <Card className="dark-glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleOpenCreate()}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Evenement
              </Button>
              <div className="flex rounded-lg border">
                <Button
                  variant={view === "day" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("day")}
                >
                  Jour
                </Button>
                <Button
                  variant={view === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("week")}
                >
                  Semaine
                </Button>
                <Button
                  variant={view === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("month")}
                >
                  Mois
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="ghost" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {view === "week"
                ? `${format(weekStart, "d MMM", { locale: fr })} - ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}`
                : format(currentDate, "EEEE d MMMM yyyy", { locale: fr })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {view === "week" ? (
              <WeekView
                weekDays={weekDays}
                category={category}
                events={events}
                onCellClick={handleOpenCreate}
                onEventClick={handleEventClick}
              />
            ) : view === "day" ? (
              <DayView
                date={currentDate}
                category={category}
                events={events}
                onCellClick={handleOpenCreate}
                onEventClick={handleEventClick}
              />
            ) : (
              <div className="flex items-center justify-center p-12 text-muted-foreground">
                Vue mensuelle bientot disponible
              </div>
            )}
            <DragOverlay dropAnimation={null}>
              {activeDragEvent ? (
                <DragGhost event={activeDragEvent} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        defaultCategory={category ?? undefined}
        defaultDate={clickedDate}
      />

      {pendingMove && (
        <MoveEventDialog
          open={moveDialogOpen}
          onOpenChange={handleMoveDialogClose}
          event={pendingMove.event}
          newStart={pendingMove.newStart}
          newEnd={pendingMove.newEnd}
          onConfirm={handleConfirmMove}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Drag ghost shown during drag
// ---------------------------------------------------------------------------

function DragGhost({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="pointer-events-none w-32 rounded px-2 py-1 text-[11px] leading-tight text-white shadow-lg opacity-90"
      style={{
        backgroundColor: event.color ?? "#3b82f6",
      }}
    >
      <span className="font-medium truncate block">{event.title}</span>
      {!event.all_day && (
        <span className="text-[9px] opacity-80 truncate block">
          {format(parseISO(event.start_at), "HH:mm")} -{" "}
          {format(parseISO(event.end_at), "HH:mm")}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers for rendering events on the grid
// ---------------------------------------------------------------------------

interface EventBlock {
  event: CalendarEvent;
  top: number; // percentage offset within the hour grid
  height: number; // percentage height
  isSimplified: boolean; // gray simplified block for opposite-category events
}

function getEventBlocksForDay(
  day: Date,
  events: CalendarEvent[],
  category: EventCategory | null
): EventBlock[] {
  const gridStartHour = 7;
  const gridEndHour = 22; // 21:00 is the last row, grid extends to 22:00
  const totalMinutes = (gridEndHour - gridStartHour) * 60;

  return events
    .filter((ev) => {
      const evStart = parseISO(ev.start_at);
      const evEnd = parseISO(ev.end_at);
      // Event overlaps with this day
      return (
        isSameDay(evStart, day) ||
        isSameDay(evEnd, day) ||
        (evStart < day && evEnd > addDays(day, 1))
      );
    })
    .map((ev) => {
      const evStart = parseISO(ev.start_at);
      const evEnd = parseISO(ev.end_at);

      // Clamp to grid hours
      const dayStart = new Date(day);
      dayStart.setHours(gridStartHour, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(gridEndHour, 0, 0, 0);

      const clampedStart = evStart < dayStart ? dayStart : evStart;
      const clampedEnd = evEnd > dayEnd ? dayEnd : evEnd;

      const startMinutes =
        (clampedStart.getHours() - gridStartHour) * 60 +
        clampedStart.getMinutes();
      const endMinutes =
        (clampedEnd.getHours() - gridStartHour) * 60 +
        clampedEnd.getMinutes();

      const top = Math.max(0, (startMinutes / totalMinutes) * 100);
      const height = Math.max(
        1.5, // minimum visible height
        ((endMinutes - startMinutes) / totalMinutes) * 100
      );

      // Determine if this event should be simplified
      // In "pro" view: perso events are simplified
      // In "perso" view: pro events are simplified
      // In "global" view: nothing is simplified
      const isSimplified =
        category !== null && ev.category !== category;

      return { event: ev, top, height, isSimplified };
    });
}

// ---------------------------------------------------------------------------
// Draggable event block component
// ---------------------------------------------------------------------------

function DraggableEventBlock({
  block,
  onClick,
}: {
  block: EventBlock;
  onClick: (event: CalendarEvent) => void;
}) {
  const { event, top, height, isSimplified } = block;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: { event },
  });

  if (isSimplified) {
    return (
      <button
        ref={setNodeRef}
        type="button"
        onClick={() => onClick(event)}
        className="absolute inset-x-0.5 z-10 overflow-hidden rounded px-1 text-[10px] leading-tight bg-gray-300/60 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400 hover:opacity-80 transition-opacity cursor-pointer border border-gray-300 dark:border-gray-600 touch-none"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          minHeight: "14px",
          opacity: isDragging ? 0.4 : undefined,
        }}
        title={`${event.category === "pro" ? "[Pro]" : "[Perso]"} ${event.title}`}
        {...listeners}
        {...attributes}
      >
        <span className="truncate block">{event.title}</span>
      </button>
    );
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick(event)}
      className="absolute inset-x-0.5 z-10 overflow-hidden rounded px-1.5 py-0.5 text-[11px] leading-tight text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm touch-none"
      style={{
        top: `${top}%`,
        height: `${height}%`,
        minHeight: "18px",
        backgroundColor: event.color ?? "#3b82f6",
        opacity: isDragging ? 0.4 : undefined,
      }}
      title={event.title}
      {...listeners}
      {...attributes}
    >
      <span className="font-medium truncate block">{event.title}</span>
      {height > 5 && !event.all_day && (
        <span className="text-[9px] opacity-80 truncate block">
          {format(parseISO(event.start_at), "HH:mm")} -{" "}
          {format(parseISO(event.end_at), "HH:mm")}
        </span>
      )}
      {event.is_urgent && (
        <span className="inline-block mt-0.5 text-[9px] bg-white/20 rounded px-0.5">
          urgent
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Droppable cell component
// ---------------------------------------------------------------------------

function DroppableCell({
  id,
  day,
  hour,
  className,
  onClick,
}: {
  id: string;
  day: Date;
  hour: number;
  className: string;
  onClick: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { day, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className}${isOver ? " bg-primary/10 ring-1 ring-inset ring-primary/30" : ""}`}
      onClick={() => {
        const clickDate = new Date(day);
        clickDate.setHours(hour, 0, 0, 0);
        onClick(clickDate);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

function WeekView({
  weekDays,
  category,
  events,
  onCellClick,
  onEventClick,
}: {
  weekDays: Date[];
  category: EventCategory | null;
  events: CalendarEvent[];
  onCellClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const eventsByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        day,
        blocks: getEventBlocksForDay(day, events, category),
      })),
    [weekDays, events, category]
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header with day names */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
          <div className="p-2" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center border-l p-2"
            >
              <span className="text-xs text-muted-foreground capitalize">
                {format(day, "EEE", { locale: fr })}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isToday(day) ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Column of hours + grid cells */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-b p-2 text-right text-xs text-muted-foreground">
                {hour}:00
              </div>
              {weekDays.map((day) => (
                <DroppableCell
                  key={`${day.toISOString()}-${hour}`}
                  id={`week-${day.toISOString()}-${hour}`}
                  day={day}
                  hour={hour}
                  className="h-12 border-b border-l transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={onCellClick}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Events overlay: positioned on top of the time grid */}
        <div
          className="pointer-events-none grid grid-cols-[60px_repeat(7,1fr)]"
          style={{
            marginTop: `-${hours.length * 48}px`, // 48px = h-12 = 3rem
            height: `${hours.length * 48}px`,
          }}
        >
          <div /> {/* spacer for the time column */}
          {eventsByDay.map(({ day, blocks }) => (
            <div
              key={day.toISOString()}
              className="pointer-events-auto relative border-l"
            >
              {blocks.map((block) => (
                <DraggableEventBlock
                  key={block.event.id}
                  block={block}
                  onClick={onEventClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day View
// ---------------------------------------------------------------------------

function DayView({
  date,
  category,
  events,
  onCellClick,
  onEventClick,
}: {
  date: Date;
  category: EventCategory | null;
  events: CalendarEvent[];
  onCellClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const blocks = useMemo(
    () => getEventBlocksForDay(date, events, category),
    [date, events, category]
  );

  return (
    <div className="relative">
      {/* Time rows */}
      {hours.map((hour) => (
        <div key={hour} className="flex border-b">
          <div className="w-16 shrink-0 p-2 text-right text-xs text-muted-foreground">
            {hour}:00
          </div>
          <DroppableCell
            id={`day-${date.toISOString()}-${hour}`}
            day={date}
            hour={hour}
            className="flex-1 h-14 border-l transition-colors hover:bg-muted/50 cursor-pointer"
            onClick={onCellClick}
          />
        </div>
      ))}
      {/* Events overlay */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-16"
        style={{ height: `${hours.length * 56}px` }} // 56px = h-14
      >
        <div className="pointer-events-auto relative h-full">
          {blocks.map((block) => (
            <DraggableEventBlock
              key={block.event.id}
              block={block}
              onClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
