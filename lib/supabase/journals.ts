import { supabase, handleSupabaseError } from "./client"
import type {
  Journal,
  JournalInsert,
  JournalUpdate,
  JournalWithStats,
  JournalFilters,
  JournalTag,
  PaginationOptions,
  ApiResponse,
} from "./types"

export class JournalService {
  // Get journals with optional filtering and pagination
  static async getJournals(
    userId: string,
    filters: JournalFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<ApiResponse<JournalWithStats[]>> {
    try {
      let query = supabase.from("journal_entries_with_stats").select("*", { count: "exact" }).eq("user_id", userId)

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte("entry_date", filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte("entry_date", filters.dateTo)
      }
      if (filters.mood) {
        query = query.eq("mood", filters.mood)
      }
      if (filters.energyLevel) {
        query = query.eq("energy_level", filters.energyLevel)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags)
      }
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,content.ilike.%${filters.searchQuery}%`)
      }
      if (filters.isFavorite !== undefined) {
        query = query.eq("is_favorite", filters.isFavorite)
      }
      if (filters.isPrivate !== undefined) {
        query = query.eq("is_private", filters.isPrivate)
      }

      // Apply pagination and sorting
      const page = pagination.page || 1
      const limit = pagination.limit || 20
      const sortBy = pagination.sortBy || "entry_date"
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

  // Get a single journal entry
  static async getJournal(id: string, userId: string): Promise<ApiResponse<JournalWithStats>> {
    try {
      const { data, error } = await supabase
        .from("journal_entries_with_stats")
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

  // Create a new journal entry
  static async createJournal(journal: JournalInsert): Promise<ApiResponse<Journal>> {
    try {
      const { data, error } = await supabase.from("journals").insert(journal).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Update a journal entry
  static async updateJournal(id: string, userId: string, updates: JournalUpdate): Promise<ApiResponse<Journal>> {
    try {
      const { data, error } = await supabase
        .from("journals")
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

  // Delete a journal entry
  static async deleteJournal(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("journals").delete().eq("id", id).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get journal tags for a user
  static async getTags(userId: string): Promise<ApiResponse<JournalTag[]>> {
    try {
      const { data, error } = await supabase
        .from("journal_tags")
        .select("*")
        .eq("user_id", userId)
        .order("usage_count", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Create or update a tag
  static async upsertTag(
    userId: string,
    name: string,
    color?: string,
    description?: string,
  ): Promise<ApiResponse<JournalTag>> {
    try {
      const { data, error } = await supabase
        .from("journal_tags")
        .upsert({
          user_id: userId,
          name,
          color: color || "#6366f1",
          description,
        })
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

  // Get mood and energy trends
  static async getMoodEnergyTrends(userId: string, months = 6): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from("monthly_mood_energy_trends")
        .select("*")
        .eq("user_id", userId)
        .gte("month", new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("month", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get journal statistics
  static async getJournalStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc("get_user_dashboard_stats", { user_uuid: userId })

      if (error) throw error

      return {
        data: data?.journals || {},
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Search journals with full-text search
  static async searchJournals(userId: string, query: string, limit = 10): Promise<ApiResponse<JournalWithStats[]>> {
    try {
      const { data, error } = await supabase
        .from("journal_entries_with_stats")
        .select("*")
        .eq("user_id", userId)
        .textSearch("title,content", query)
        .order("entry_date", { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get journal entries for a specific date range
  static async getJournalsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ApiResponse<JournalWithStats[]>> {
    try {
      const { data, error } = await supabase
        .from("journal_entries_with_stats")
        .select("*")
        .eq("user_id", userId)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Toggle favorite status
  static async toggleFavorite(id: string, userId: string): Promise<ApiResponse<Journal>> {
    try {
      // First get current status
      const { data: current, error: fetchError } = await supabase
        .from("journals")
        .select("is_favorite")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

      if (fetchError) throw fetchError

      // Toggle the status
      const { data, error } = await supabase
        .from("journals")
        .update({ is_favorite: !current.is_favorite })
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

  // Bulk operations
  static async bulkDelete(ids: string[], userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("journals").delete().in("id", ids).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  static async bulkUpdateTags(ids: string[], userId: string, tags: string[]): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("journals").update({ tags }).in("id", ids).eq("user_id", userId)

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
