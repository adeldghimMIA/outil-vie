export interface GamificationAxis {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLevel {
  id: string;
  user_id: string;
  axis_id: string;
  total_xp: number;
  current_level: number;
  xp_for_next_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  axis_id: string | null;
  source_type:
    | "task_completed"
    | "session_logged"
    | "streak_bonus"
    | "objective_completed"
    | "badge_earned"
    | "challenge_completed"
    | "manual";
  source_id: string | null;
  xp_amount: number;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  axis_id: string | null;
  criteria_type:
    | "sessions_count"
    | "streak_days"
    | "xp_total"
    | "level_reached"
    | "objective_completed"
    | "custom";
  criteria_value: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface GamificationObjective {
  id: string;
  user_id: string;
  axis_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  deadline: string | null;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  axis_id: string | null;
  challenge_type: "daily" | "weekly";
  target_value: number;
  current_value: number;
  xp_reward: number;
  active_date: string;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
}

// Composite types for the progression page
export interface AxisProgressData {
  axis: GamificationAxis;
  level: UserLevel;
  objectives: GamificationObjective[];
  earnedBadgeIds: string[];
}

export interface ProgressionPageData {
  axes: AxisProgressData[];
  totalXP: number;
  globalLevel: number;
  badges: Badge[];
  earnedBadges: UserBadge[];
  activeChallenges: DailyChallenge[];
  recentXPEvents: XPEvent[];
}

// Radar chart data point
export interface RadarDataPoint {
  axis: string;
  value: number;
  fullMark: number;
  color: string;
}
