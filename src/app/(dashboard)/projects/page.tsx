import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { ProjectsClient } from "./projects-client";
import type { Project } from "@/types";

export default async function ProjectsPage() {
  let projects: Project[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    projects = (data as Project[]) ?? [];
  } catch {
    // Supabase not configured
  }

  return <ProjectsClient initialProjects={projects} />;
}
