// Supabase Database Types for Life OS
// Auto-generated types based on database schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          timezone: string
          date_format: string
          time_format: string
          theme: string
          notifications_enabled: boolean
          email_notifications: boolean
          push_notifications: boolean
          weekly_review_day: number
          daily_reminder_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string
          date_format?: string
          time_format?: string
          theme?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          weekly_review_day?: number
          daily_reminder_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string
          date_format?: string
          time_format?: string
          theme?: string
          notifications_enabled?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          weekly_review_day?: number
          daily_reminder_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      journals: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          entry_date: string
          mood: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level: "very_low" | "low" | "medium" | "high" | "very_high" | null
          weather: string | null
          location: string | null
          word_count: number
          reading_time: number
          is_favorite: boolean
          is_private: boolean
          tags: string[]
          attachments: Json
          metadata: Json
          ai_analysis: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          entry_date?: string
          mood?: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level?: "very_low" | "low" | "medium" | "high" | "very_high" | null
          weather?: string | null
          location?: string | null
          word_count?: number
          reading_time?: number
          is_favorite?: boolean
          is_private?: boolean
          tags?: string[]
          attachments?: Json
          metadata?: Json
          ai_analysis?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          entry_date?: string
          mood?: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level?: "very_low" | "low" | "medium" | "high" | "very_high" | null
          weather?: string | null
          location?: string | null
          word_count?: number
          reading_time?: number
          is_favorite?: boolean
          is_private?: boolean
          tags?: string[]
          attachments?: Json
          metadata?: Json
          ai_analysis?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: "todo" | "in_progress" | "completed" | "cancelled"
          priority: "low" | "medium" | "high" | "urgent"
          category: string | null
          project: string | null
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          estimated_duration: number | null
          actual_duration: number | null
          tags: string[]
          subtasks: Json
          attachments: Json
          notes: string | null
          reminder_at: string | null
          recurring_pattern: Json | null
          parent_task_id: string | null
          order_index: number
          is_archived: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: "todo" | "in_progress" | "completed" | "cancelled"
          priority?: "low" | "medium" | "high" | "urgent"
          category?: string | null
          project?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          tags?: string[]
          subtasks?: Json
          attachments?: Json
          notes?: string | null
          reminder_at?: string | null
          recurring_pattern?: Json | null
          parent_task_id?: string | null
          order_index?: number
          is_archived?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: "todo" | "in_progress" | "completed" | "cancelled"
          priority?: "low" | "medium" | "high" | "urgent"
          category?: string | null
          project?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          tags?: string[]
          subtasks?: Json
          attachments?: Json
          notes?: string | null
          reminder_at?: string | null
          recurring_pattern?: Json | null
          parent_task_id?: string | null
          order_index?: number
          is_archived?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          frequency: "daily" | "weekly" | "monthly" | "custom"
          frequency_config: Json
          target_value: number
          unit: string | null
          color: string
          icon: string | null
          is_active: boolean
          start_date: string
          end_date: string | null
          reminder_times: string[]
          streak_count: number
          best_streak: number
          total_completions: number
          completion_rate: number
          last_completed_date: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          frequency?: "daily" | "weekly" | "monthly" | "custom"
          frequency_config?: Json
          target_value?: number
          unit?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          reminder_times?: string[]
          streak_count?: number
          best_streak?: number
          total_completions?: number
          completion_rate?: number
          last_completed_date?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          frequency?: "daily" | "weekly" | "monthly" | "custom"
          frequency_config?: Json
          target_value?: number
          unit?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          reminder_times?: string[]
          streak_count?: number
          best_streak?: number
          total_completions?: number
          completion_rate?: number
          last_completed_date?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          completion_date: string
          value: number
          quality_rating: number | null
          notes: string | null
          mood: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level: "very_low" | "low" | "medium" | "high" | "very_high" | null
          context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          completion_date?: string
          value?: number
          quality_rating?: number | null
          notes?: string | null
          mood?: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level?: "very_low" | "low" | "medium" | "high" | "very_high" | null
          context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          completion_date?: string
          value?: number
          quality_rating?: number | null
          notes?: string | null
          mood?: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level?: "very_low" | "low" | "medium" | "high" | "very_high" | null
          context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      journal_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          description: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          description?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          description?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_dependencies: {
        Row: {
          id: string
          user_id: string
          task_id: string
          depends_on_task_id: string
          dependency_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          depends_on_task_id: string
          dependency_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          depends_on_task_id?: string
          dependency_type?: string
          created_at?: string
        }
      }
      user_statistics: {
        Row: {
          id: string
          user_id: string
          total_journal_entries: number
          total_words_written: number
          total_tasks_completed: number
          total_habits_tracked: number
          current_streaks: Json
          monthly_stats: Json
          yearly_stats: Json
          last_calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_journal_entries?: number
          total_words_written?: number
          total_tasks_completed?: number
          total_habits_tracked?: number
          current_streaks?: Json
          monthly_stats?: Json
          yearly_stats?: Json
          last_calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_journal_entries?: number
          total_words_written?: number
          total_tasks_completed?: number
          total_habits_tracked?: number
          current_streaks?: Json
          monthly_stats?: Json
          yearly_stats?: Json
          last_calculated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json
          is_read: boolean
          scheduled_for: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json
          is_read?: boolean
          scheduled_for?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json
          is_read?: boolean
          scheduled_for?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      journal_entries_with_stats: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          entry_date: string
          mood: "very_low" | "low" | "neutral" | "high" | "very_high" | null
          energy_level: "very_low" | "low" | "medium" | "high" | "very_high" | null
          weather: string | null
          location: string | null
          word_count: number
          reading_time: number
          is_favorite: boolean
          is_private: boolean
          tags: string[]
          attachments: Json
          metadata: Json
          ai_analysis: Json
          created_at: string
          updated_at: string
          day_of_week: number | null
          week_of_year: number | null
          month: number | null
          year: number | null
          mood_numeric: number | null
          energy_numeric: number | null
          tag_count: number | null
          days_ago: number | null
        }
      }
      tasks_with_dependencies: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: "todo" | "in_progress" | "completed" | "cancelled"
          priority: "low" | "medium" | "high" | "urgent"
          category: string | null
          project: string | null
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          estimated_duration: number | null
          actual_duration: number | null
          tags: string[]
          subtasks: Json
          attachments: Json
          notes: string | null
          reminder_at: string | null
          recurring_pattern: Json | null
          parent_task_id: string | null
          order_index: number
          is_archived: boolean
          metadata: Json
          created_at: string
          updated_at: string
          depends_on_count: number | null
          dependents_count: number | null
          depends_on_tasks: string[] | null
          dependent_tasks: string[] | null
          subtask_count: number | null
          completed_subtasks: number | null
          is_overdue: boolean | null
          hours_until_due: number | null
          subtask_completion_percentage: number | null
        }
      }
      habits_with_stats: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          frequency: "daily" | "weekly" | "monthly" | "custom"
          frequency_config: Json
          target_value: number
          unit: string | null
          color: string
          icon: string | null
          is_active: boolean
          start_date: string
          end_date: string | null
          reminder_times: string[]
          streak_count: number
          best_streak: number
          total_completions: number
          completion_rate: number
          last_completed_date: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
          completions_last_7_days: number | null
          completions_last_30_days: number | null
          avg_quality_rating: number | null
          completed_today: boolean | null
          days_since_completion: number | null
          expected_weekly_completions: number | null
          weekly_completion_rate: number | null
        }
      }
      user_dashboard_stats: {
        Row: {
          user_id: string
          full_name: string | null
          username: string | null
          total_journal_entries: number | null
          journal_entries_this_month: number | null
          total_words_written: number | null
          avg_mood: number | null
          total_tasks: number | null
          completed_tasks: number | null
          tasks_in_progress: number | null
          overdue_tasks: number | null
          tasks_completed_this_month: number | null
          active_habits: number | null
          avg_habit_completion_rate: number | null
          habits_with_streaks: number | null
          habits_completed_today: number | null
          unread_notifications: number | null
          user_since: string
          last_profile_update: string
        }
      }
      habit_completion_calendar: {
        Row: {
          habit_id: string
          user_id: string
          habit_name: string
          frequency: "daily" | "weekly" | "monthly" | "custom"
          date: string
          completed: boolean | null
        }
      }
      monthly_mood_energy_trends: {
        Row: {
          user_id: string
          month: string | null
          entry_count: number | null
          avg_mood: number | null
          avg_energy: number | null
          avg_word_count: number | null
        }
      }
      task_completion_trends: {
        Row: {
          user_id: string
          week: string | null
          tasks_completed: number | null
          avg_priority: number | null
          avg_duration_minutes: number | null
        }
      }
    }
    Functions: {
      calculate_habit_streak: {
        Args: {
          habit_uuid: string
        }
        Returns: number
      }
      calculate_completion_rate: {
        Args: {
          habit_uuid: string
        }
        Returns: number
      }
      get_user_dashboard_stats: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
      admin_get_user_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      task_status: "todo" | "in_progress" | "completed" | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      habit_frequency: "daily" | "weekly" | "monthly" | "custom"
      mood_level: "very_low" | "low" | "neutral" | "high" | "very_high"
      energy_level: "very_low" | "low" | "medium" | "high" | "very_high"
    }
  }
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export type Journal = Database["public"]["Tables"]["journals"]["Row"]
export type JournalInsert = Database["public"]["Tables"]["journals"]["Insert"]
export type JournalUpdate = Database["public"]["Tables"]["journals"]["Update"]
export type JournalWithStats = Database["public"]["Views"]["journal_entries_with_stats"]["Row"]

export type Task = Database["public"]["Tables"]["tasks"]["Row"]
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"]
export type TaskWithDependencies = Database["public"]["Views"]["tasks_with_dependencies"]["Row"]

export type Habit = Database["public"]["Tables"]["habits"]["Row"]
export type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"]
export type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"]
export type HabitWithStats = Database["public"]["Views"]["habits_with_stats"]["Row"]

export type HabitCompletion = Database["public"]["Tables"]["habit_completions"]["Row"]
export type HabitCompletionInsert = Database["public"]["Tables"]["habit_completions"]["Insert"]
export type HabitCompletionUpdate = Database["public"]["Tables"]["habit_completions"]["Update"]

export type JournalTag = Database["public"]["Tables"]["journal_tags"]["Row"]
export type JournalTagInsert = Database["public"]["Tables"]["journal_tags"]["Insert"]
export type JournalTagUpdate = Database["public"]["Tables"]["journal_tags"]["Update"]

export type TaskDependency = Database["public"]["Tables"]["task_dependencies"]["Row"]
export type TaskDependencyInsert = Database["public"]["Tables"]["task_dependencies"]["Insert"]
export type TaskDependencyUpdate = Database["public"]["Tables"]["task_dependencies"]["Update"]

export type UserStatistics = Database["public"]["Tables"]["user_statistics"]["Row"]
export type UserStatisticsInsert = Database["public"]["Tables"]["user_statistics"]["Insert"]
export type UserStatisticsUpdate = Database["public"]["Tables"]["user_statistics"]["Update"]

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]

export type UserDashboardStats = Database["public"]["Views"]["user_dashboard_stats"]["Row"]
export type HabitCompletionCalendar = Database["public"]["Views"]["habit_completion_calendar"]["Row"]
export type MonthlyMoodEnergyTrends = Database["public"]["Views"]["monthly_mood_energy_trends"]["Row"]
export type TaskCompletionTrends = Database["public"]["Views"]["task_completion_trends"]["Row"]

// Enum types
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type TaskPriority = Database["public"]["Enums"]["task_priority"]
export type HabitFrequency = Database["public"]["Enums"]["habit_frequency"]
export type MoodLevel = Database["public"]["Enums"]["mood_level"]
export type EnergyLevel = Database["public"]["Enums"]["energy_level"]

// Custom types for application logic
export interface JournalFilters {
  dateFrom?: string
  dateTo?: string
  mood?: MoodLevel
  energyLevel?: EnergyLevel
  tags?: string[]
  searchQuery?: string
  isFavorite?: boolean
  isPrivate?: boolean
}

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category?: string
  project?: string
  dueDateFrom?: string
  dueDateTo?: string
  tags?: string[]
  searchQuery?: string
  isOverdue?: boolean
  isArchived?: boolean
}

export interface HabitFilters {
  frequency?: HabitFrequency[]
  category?: string
  isActive?: boolean
  hasStreak?: boolean
  completedToday?: boolean
}

export interface DashboardData {
  stats: UserDashboardStats
  recentJournals: JournalWithStats[]
  upcomingTasks: TaskWithDependencies[]
  todayHabits: HabitWithStats[]
  moodTrends: MonthlyMoodEnergyTrends[]
  taskTrends: TaskCompletionTrends[]
  habitCalendar: HabitCompletionCalendar[]
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
  page?: number
  totalPages?: number
}
