// Enums

export type DisputeStatus =
  | 'pending'
  | 'accepted'
  | 'disputed'
  | 'resolved_valid'
  | 'resolved_invalid'

export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'asneeded'

export type TaskCategory =
  | 'limpieza'
  | 'cocina'
  | 'ropa'
  | 'compras'
  | 'orden'
  | 'bonus'

export type MissionStatus = 'pending' | 'accepted' | 'rejected'

// Tables

export interface Profile {
  id: string
  email: string | null
  username: string | null
  avatar_color: string | null
  created_at: string
}

export interface Household {
  id: string
  name: string | null
  invite_code: string | null
  invite_expires_at: string | null
  user1_id: string | null
  user2_id: string | null
  week_close_day: number
  week_close_hour: number
  week_close_minute: number
  timezone: string
  reward_text: string
  competitive_mode: boolean
  tie_threshold: number
  created_at: string
}

export interface Task {
  id: string
  household_id: string
  name: string
  emoji: string | null
  points: number
  category: TaskCategory | null
  frequency: TaskFrequency
  is_bonus: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface TaskLog {
  id: string
  household_id: string
  user_id: string
  task_id: string | null
  task_name: string
  task_emoji: string | null
  points: number
  week_id: string
  dispute_status: DisputeStatus
  dispute_deadline: string | null
  created_at: string
}

export interface Dispute {
  id: string
  task_log_id: string
  disputed_by: string
  reason: string | null
  resolved: boolean
  resolution: 'valid' | 'invalid' | null
  resolved_at: string | null
  created_at: string
}

export interface WeekResult {
  id: string
  household_id: string
  week_id: string
  week_start: string | null
  week_end: string | null
  user1_points: number
  user2_points: number
  winner_id: string | null
  loser_id: string | null
  is_tie: boolean
  no_bet: boolean
  reward_text: string | null
  created_at: string
}

export interface NoBetWeek {
  id: string
  household_id: string
  requested_by: string
  week_id: string
  created_at: string
}

export interface Streak {
  id: string
  household_id: string
  user_id: string
  task_id: string
  current_streak: number
  best_streak: number
  last_done_week: string | null
}

export interface SpecialMission {
  id: string
  household_id: string
  proposed_by: string
  name: string
  points_proposed: number
  status: MissionStatus
  completed_by: string | null
  completed_at: string | null
  created_at: string
}
