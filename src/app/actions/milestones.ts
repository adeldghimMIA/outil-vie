"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { SkillMilestone } from "@/types/gamification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClient() {
  return await createClient();
}

// ─── Read Actions ────────────────────────────────────────────────────────────

/**
 * Fetch all milestones for a given axis, ordered by order_index.
 */
export async function getMilestonesByAxis(
  axisId: string,
  userId: string = DEFAULT_USER_ID
): Promise<SkillMilestone[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("skill_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("axis_id", axisId)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Erreur recuperation milestones : ${error.message}`);
  }

  return (data ?? []) as SkillMilestone[];
}

/**
 * Fetch all active milestones across all axes.
 */
export async function getActiveMilestones(
  userId: string = DEFAULT_USER_ID
): Promise<SkillMilestone[]> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("skill_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Erreur recuperation milestones actifs : ${error.message}`);
  }

  return (data ?? []) as SkillMilestone[];
}

// ─── Write Actions ──────────────────────────────────────────────────────────

/**
 * Create a new milestone for an axis.
 */
export async function createMilestone(data: {
  axisId: string;
  title: string;
  description?: string;
  durationWeeks?: number;
  xpReward?: number;
  targetDate?: string;
  userId?: string;
}): Promise<SkillMilestone> {
  const supabase = await getClient();
  const userId = data.userId ?? DEFAULT_USER_ID;

  // Get the next order_index
  const { data: existing, error: countError } = await supabase
    .from("skill_milestones")
    .select("order_index")
    .eq("user_id", userId)
    .eq("axis_id", data.axisId)
    .order("order_index", { ascending: false })
    .limit(1);

  if (countError) {
    throw new Error(`Erreur comptage milestones : ${countError.message}`);
  }

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  // Determine status: if no other milestones exist or all are completed, this is active
  const { data: activeMilestones } = await supabase
    .from("skill_milestones")
    .select("id")
    .eq("user_id", userId)
    .eq("axis_id", data.axisId)
    .eq("status", "active")
    .limit(1);

  const status = (!activeMilestones || activeMilestones.length === 0) && nextIndex === 0
    ? "active"
    : "locked";

  const { data: milestone, error } = await supabase
    .from("skill_milestones")
    .insert({
      user_id: userId,
      axis_id: data.axisId,
      title: data.title,
      description: data.description ?? null,
      order_index: nextIndex,
      status,
      xp_reward: data.xpReward ?? 100,
      duration_weeks: data.durationWeeks ?? null,
      target_date: data.targetDate ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur creation milestone : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return milestone as SkillMilestone;
}

/**
 * Mark a milestone as completed and activate the next one.
 */
export async function completeMilestone(
  milestoneId: string,
  userId: string = DEFAULT_USER_ID
): Promise<SkillMilestone> {
  const supabase = await getClient();

  // Fetch the milestone
  const { data: milestone, error: fetchError } = await supabase
    .from("skill_milestones")
    .select("*")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw new Error(`Erreur recuperation milestone : ${fetchError.message}`);
  }

  const ms = milestone as SkillMilestone;

  if (ms.status !== "active") {
    throw new Error("Seul un milestone actif peut etre complete.");
  }

  // Mark as completed
  const { data: updated, error: updateError } = await supabase
    .from("skill_milestones")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Erreur completion milestone : ${updateError.message}`);
  }

  // Activate the next locked milestone (by order_index)
  const { data: nextMilestone } = await supabase
    .from("skill_milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("axis_id", ms.axis_id)
    .eq("status", "locked")
    .order("order_index", { ascending: true })
    .limit(1);

  if (nextMilestone && nextMilestone.length > 0) {
    await supabase
      .from("skill_milestones")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", nextMilestone[0].id);
  }

  // Award XP via xp_events
  await supabase.from("xp_events").insert({
    user_id: userId,
    axis_id: ms.axis_id,
    source_type: "objective_completed",
    source_id: milestoneId,
    xp_amount: ms.xp_reward,
    description: `Milestone complete : ${ms.title}`,
    metadata: {},
  });

  revalidatePath("/", "layout");
  return updated as SkillMilestone;
}

/**
 * Update an existing milestone.
 */
export async function updateMilestone(
  milestoneId: string,
  data: {
    title?: string;
    description?: string;
    durationWeeks?: number;
    xpReward?: number;
    targetDate?: string;
  },
  userId: string = DEFAULT_USER_ID
): Promise<SkillMilestone> {
  const supabase = await getClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.durationWeeks !== undefined) updateData.duration_weeks = data.durationWeeks;
  if (data.xpReward !== undefined) updateData.xp_reward = data.xpReward;
  if (data.targetDate !== undefined) updateData.target_date = data.targetDate;

  const { data: updated, error } = await supabase
    .from("skill_milestones")
    .update(updateData)
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur mise a jour milestone : ${error.message}`);
  }

  revalidatePath("/", "layout");
  return updated as SkillMilestone;
}

/**
 * Delete a milestone.
 */
export async function deleteMilestone(
  milestoneId: string,
  userId: string = DEFAULT_USER_ID
): Promise<void> {
  const supabase = await getClient();

  const { error } = await supabase
    .from("skill_milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Erreur suppression milestone : ${error.message}`);
  }

  revalidatePath("/", "layout");
}
