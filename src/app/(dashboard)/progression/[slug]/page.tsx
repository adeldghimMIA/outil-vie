import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type {
  GamificationAxis,
  UserLevel,
  SkillMilestone,
  Badge,
  UserBadge,
  XPEvent,
} from "@/types/gamification";
import { PilierDetailClient } from "@/components/progression/pilier-detail-client";

interface ActivitySession {
  id: string;
  session_date: string;
  duration_minutes: number;
  rating: number | null;
  notes: string | null;
}

interface PilierPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PilierPage({ params }: PilierPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const userId = DEFAULT_USER_ID;

  // Fetch the axis by slug
  const { data: axisData, error: axisError } = await supabase
    .from("gamification_axes")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (axisError || !axisData) {
    notFound();
  }

  const axis = axisData as GamificationAxis;

  // Fetch remaining data in parallel
  const [
    levelResult,
    milestonesResult,
    sessionsResult,
    badgesResult,
    userBadgesResult,
    xpEventsResult,
  ] = await Promise.all([
    supabase
      .from("user_levels")
      .select("*")
      .eq("user_id", userId)
      .eq("axis_id", axis.id)
      .single(),
    supabase
      .from("skill_milestones")
      .select("*")
      .eq("user_id", userId)
      .eq("axis_id", axis.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("activity_sessions")
      .select("id, session_date, duration_minutes, rating, notes")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(5),
    supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .or(`axis_id.eq.${axis.id},axis_id.is.null`),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", userId),
    supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", userId)
      .eq("axis_id", axis.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Build level with defaults
  const level: UserLevel = (levelResult.data as UserLevel) ?? {
    id: "",
    user_id: userId,
    axis_id: axis.id,
    total_xp: 0,
    current_level: 1,
    xp_for_next_level: 25,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    updated_at: new Date().toISOString(),
  };

  const milestones = (milestonesResult.data ?? []) as SkillMilestone[];
  const sessions = (sessionsResult.data ?? []) as ActivitySession[];
  const badges = (badgesResult.data ?? []) as Badge[];
  const userBadges = (userBadgesResult.data ?? []) as UserBadge[];
  const xpEvents = (xpEventsResult.data ?? []) as XPEvent[];

  const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/progression"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour a la progression
      </Link>

      <PilierDetailClient
        axis={axis}
        level={level}
        milestones={milestones}
        sessions={sessions}
        badges={badges}
        earnedBadgeIds={earnedBadgeIds}
        xpEvents={xpEvents}
      />
    </div>
  );
}
