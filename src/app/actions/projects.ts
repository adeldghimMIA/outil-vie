"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { Project, EventCategory, ProjectStatus } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getClient() {
  return await createClient();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Erreur lors de la recuperation des projets : ${error.message}`
    );
  }

  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID)
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la recuperation du projet : ${error.message}`
    );
  }

  return data as Project;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  color?: string;
  category?: EventCategory;
  target_date?: string | null;
  status?: ProjectStatus;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const supabase = await getClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: DEFAULT_USER_ID,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? "#3b82f6",
      category: data.category ?? "pro",
      target_date: data.target_date ?? null,
      status: data.status ?? "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la creation du projet : ${error.message}`
    );
  }

  revalidatePath("/", "layout");
  return project as Project;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string;
  category?: EventCategory;
  target_date?: string | null;
  status?: ProjectStatus;
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  const supabase = await getClient();

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la mise a jour du projet : ${error.message}`
    );
  }

  revalidatePath("/", "layout");
  return project as Project;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProject(id: string): Promise<void> {
  const supabase = await getClient();

  const { error } = await supabase
    .from("projects")
    .update({
      status: "archived" as ProjectStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", DEFAULT_USER_ID);

  if (error) {
    throw new Error(
      `Erreur lors de la suppression du projet : ${error.message}`
    );
  }

  revalidatePath("/", "layout");
}
