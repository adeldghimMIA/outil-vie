"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { getTaskXP } from "@/lib/gamification/xp-calculator";
import { awardXP } from "@/app/actions/gamification";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  EventCategory,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClient() {
  return await createClient();
}

// ─── Read Actions ────────────────────────────────────────────────────────────

export async function getTasks(
  userId: string,
  filters?: {
    category?: EventCategory;
    status?: TaskStatus;
    dueDate?: string; // ISO date string (YYYY-MM-DD)
  }
): Promise<Task[]> {
  const supabase = await getClient();

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .neq("status", "cancelled")
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.dueDate) {
    const dayStart = `${filters.dueDate}T00:00:00.000Z`;
    const dayEnd = `${filters.dueDate}T23:59:59.999Z`;
    query = query.gte("due_date", dayStart).lte("due_date", dayEnd);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des tâches : ${error.message}`);
  }

  return (data as Task[]) ?? [];
}

export async function getTasksForToday(
  userId: string,
  category?: EventCategory
): Promise<Task[]> {
  const supabase = await getClient();

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .in("status", ["todo", "scheduled", "in_progress"])
    .lte("due_date", todayEnd.toISOString())
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des tâches du jour : ${error.message}`);
  }

  return (data as Task[]) ?? [];
}

// ─── Create Actions ──────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  raw_input?: string | null;
  estimated_minutes?: number | null;
  priority?: TaskPriority;
  energy_level?: EnergyLevel | null;
  due_date?: string | null;
  due_date_hard?: boolean;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status?: TaskStatus;
  is_flexible?: boolean;
  category?: EventCategory;
  tags?: string[];
  project_id?: string | null;
  sequence_order?: number | null;
  depends_on?: string[];
  ai_confidence?: number | null;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const supabase = await getClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: DEFAULT_USER_ID,
      title: data.title,
      description: data.description ?? null,
      raw_input: data.raw_input ?? null,
      estimated_minutes: data.estimated_minutes ?? null,
      priority: data.priority ?? 3,
      energy_level: data.energy_level ?? null,
      due_date: data.due_date ?? null,
      due_date_hard: data.due_date_hard ?? false,
      scheduled_start: data.scheduled_start ?? null,
      scheduled_end: data.scheduled_end ?? null,
      status: data.status ?? "todo",
      is_flexible: data.is_flexible ?? true,
      category: data.category ?? "pro",
      tags: data.tags ?? [],
      project_id: data.project_id ?? null,
      sequence_order: data.sequence_order ?? null,
      depends_on: data.depends_on ?? [],
      ai_confidence: data.ai_confidence ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de la tâche : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return task as Task;
}

export async function createTasksBatch(
  tasks: CreateTaskInput[]
): Promise<Task[]> {
  const supabase = await getClient();

  if (tasks.length === 0) {
    return [];
  }

  const rows = tasks.map((data) => ({
    user_id: DEFAULT_USER_ID,
    title: data.title,
    description: data.description ?? null,
    raw_input: data.raw_input ?? null,
    estimated_minutes: data.estimated_minutes ?? null,
    priority: data.priority ?? 3,
    energy_level: data.energy_level ?? null,
    due_date: data.due_date ?? null,
    due_date_hard: data.due_date_hard ?? false,
    scheduled_start: data.scheduled_start ?? null,
    scheduled_end: data.scheduled_end ?? null,
    status: data.status ?? "todo",
    is_flexible: data.is_flexible ?? true,
    category: data.category ?? "pro",
    tags: data.tags ?? [],
    project_id: data.project_id ?? null,
    sequence_order: data.sequence_order ?? null,
    depends_on: data.depends_on ?? [],
    ai_confidence: data.ai_confidence ?? null,
  }));

  const { data: created, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Erreur lors de la création des tâches : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return (created as Task[]) ?? [];
}

// ─── Update Actions ──────────────────────────────────────────────────────────

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  priority?: TaskPriority;
  energy_level?: EnergyLevel | null;
  due_date?: string | null;
  due_date_hard?: boolean;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status?: TaskStatus;
  is_flexible?: boolean;
  category?: EventCategory;
  tags?: string[];
  project_id?: string | null;
  sequence_order?: number | null;
  depends_on?: string[];
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<Task> {
  const supabase = await getClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la tâche : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return task as Task;
}

// ─── Complete / Delete Actions ───────────────────────────────────────────────

export async function completeTask(id: string): Promise<Task> {
  const supabase = await getClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: "done" as TaskStatus,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la complétion de la tâche : ${error.message}`);
  }

  const completedTask = task as Task;

  // Award XP if the task is linked to a gamification axis
  if (completedTask.axis_id) {
    const xpAmount = getTaskXP(completedTask.priority);
    try {
      await awardXP({
        userId: DEFAULT_USER_ID,
        axisId: completedTask.axis_id,
        sourceType: "task_completed",
        sourceId: completedTask.id,
        xpAmount,
        description: `Task completed: ${completedTask.title}`,
      });
    } catch {
      // XP awarding is non-blocking; log but don't fail the task completion
      console.error("Failed to award XP for completed task:", completedTask.id);
    }
  }

  revalidatePath("/", "layout");
  return completedTask;
}

export async function deleteTask(id: string): Promise<Task> {
  const supabase = await getClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: "cancelled" as TaskStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la suppression de la tâche : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return task as Task;
}
