import { supabase, handleSupabaseError } from "./client"
import type {
  Habit,
  HabitInsert,
  HabitUpdate,
  HabitWithStats,
  HabitCompletion,
  HabitCompletionInsert,
  HabitCompletionCalendar,
  HabitFilters,
  PaginationOptions,
  ApiResponse,
} from "./types"

export class HabitService {
  // Get habits with optional filtering and pagination
  static async getHabits(
    userId: string,
    filters: HabitFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<ApiResponse<HabitWithStats[]>> {
    try {
      let query = supabase.from("habits_with_stats").select("*", { count: "exact" }).eq("user_id", userId)

      // Apply filters
      if (filters.frequency && filters.frequency.length > 0) {
        query = query.in("frequency", filters.frequency)
      }
      if (filters.category) {
        query = query.eq("category", filters.category)
      }
      if (filters.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive)
      }
      if (filters.hasStreak) {
        query = query.gt("streak_count", 0)
      }
      if (filters.completedToday !== undefined) {
        query = query.eq("completed_today", filters.completedToday)
      }

      // Apply pagination and sorting
      const page = pagination.page || 1
      const limit = pagination.limit || 20
      const sortBy = pagination.sortBy || "created_at"
      const sortOrder = pagination.sortOrder || "desc"

      query = query.order(sortBy, { ascending: sortOrder === "asc" }).range((page - 1) * limit, page * limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        error: null,
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get a single habit
  static async getHabit(id: string, userId: string): Promise<ApiResponse<HabitWithStats>> {
    try {
      const { data, error } = await supabase
        .from("habits_with_stats")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Create a new habit
  static async createHabit(habit: HabitInsert): Promise<ApiResponse<Habit>> {
    try {
      const { data, error } = await supabase.from("habits").insert(habit).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Update a habit
  static async updateHabit(id: string, userId: string, updates: HabitUpdate): Promise<ApiResponse<Habit>> {
    try {
      const { data, error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Delete a habit
  static async deleteHabit(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Complete a habit
  static async completeHabit(
    habitId: string,
    userId: string,
    completion: Partial<HabitCompletionInsert> = {},
  ): Promise<ApiResponse<HabitCompletion>> {
    try {
      const completionData: HabitCompletionInsert = {
        user_id: userId,
        habit_id: habitId,
        completion_date: completion.completion_date || new Date().toISOString().split("T")[0],
        value: completion.value || 1,
        quality_rating: completion.quality_rating,
        notes: completion.notes,
        mood: completion.mood,
        energy_level: completion.energy_level,
        context: completion.context || {},
      }

      const { data, error } = await supabase.from("habit_completions").upsert(completionData).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Remove habit completion
  static async removeHabitCompletion(habitId: string, userId: string, date: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habitId)
        .eq("user_id", userId)
        .eq("completion_date", date)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get habit completions for a date range
  static async getHabitCompletions(
    habitId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<HabitCompletion[]>> {
    try {
      let query = supabase.from("habit_completions").select("*").eq("habit_id", habitId).eq("user_id", userId)

      if (startDate) {
        query = query.gte("completion_date", startDate)
      }
      if (endDate) {
        query = query.lte("completion_date", endDate)
      }

      query = query.order("completion_date", { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get habit completion calendar
  static async getHabitCompletionCalendar(
    userId: string,
    habitId?: string,
  ): Promise<ApiResponse<HabitCompletionCalendar[]>> {
    try {
      let query = supabase.from("habit_completion_calendar").select("*").eq("user_id", userId)

      if (habitId) {
        query = query.eq("habit_id", habitId)
      }

      query = query.order("date", { ascending: true })

      const { data, error } = await query

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get today's habits
  static async getTodayHabits(userId: string): Promise<ApiResponse<HabitWithStats[]>> {
    try {
      const { data, error } = await supabase
        .from("habits_with_stats")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get habit statistics
  static async getHabitStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc("get_user_dashboard_stats", { user_uuid: userId })

      if (error) throw error

      return {
        data: data?.habits || {},
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get habit categories
  static async getHabitCategories(userId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("category")
        .eq("user_id", userId)
        .not("category", "is", null)

      if (error) throw error

      const categories = [...new Set(data?.map((item) => item.category).filter(Boolean))]
      return { data: categories, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Calculate habit streak
  static async calculateHabitStreak(habitId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc("calculate_habit_streak", { habit_uuid: habitId })

      if (error) throw error

      return { data: data || 0, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Calculate completion rate
  static async calculateCompletionRate(habitId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc("calculate_completion_rate", { habit_uuid: habitId })

      if (error) throw error

      return { data: data || 0, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Bulk operations
  static async bulkToggleActive(ids: string[], userId: string, isActive: boolean): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("habits")
        .update({ is_active: isActive })
        .in("id", ids)
        .eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  static async bulkDelete(ids: string[], userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("habits").delete().in("id", ids).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  static async bulkUpdateCategory(ids: string[], userId: string, category: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("habits").update({ category }).in("id", ids).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }
}
