import { supabase, handleSupabaseError } from "./client"
import { JournalService } from "./journals"
import { TaskService } from "./tasks"
import { HabitService } from "./habits"
import type { UserDashboardStats, DashboardData, ApiResponse } from "./types"

export class DashboardService {
  // Get comprehensive dashboard data
  static async getDashboardData(userId: string): Promise<ApiResponse<DashboardData>> {
    try {
      // Fetch all dashboard data in parallel
      const [
        statsResult,
        journalsResult,
        tasksResult,
        habitsResult,
        moodTrendsResult,
        taskTrendsResult,
        habitCalendarResult,
      ] = await Promise.all([
        this.getDashboardStats(userId),
        JournalService.getJournals(userId, {}, { limit: 5, sortBy: "entry_date", sortOrder: "desc" }),
        TaskService.getTasks(
          userId,
          { status: ["todo", "in_progress"] },
          { limit: 10, sortBy: "due_date", sortOrder: "asc" },
        ),
        HabitService.getTodayHabits(userId),
        JournalService.getMoodEnergyTrends(userId, 6),
        TaskService.getTaskCompletionTrends(userId, 12),
        HabitService.getHabitCompletionCalendar(userId),
      ])

      // Check for any errors
      if (statsResult.error) throw new Error(statsResult.error)
      if (journalsResult.error) throw new Error(journalsResult.error)
      if (tasksResult.error) throw new Error(tasksResult.error)
      if (habitsResult.error) throw new Error(habitsResult.error)

      const dashboardData: DashboardData = {
        stats: statsResult.data!,
        recentJournals: journalsResult.data || [],
        upcomingTasks: tasksResult.data || [],
        todayHabits: habitsResult.data || [],
        moodTrends: moodTrendsResult.data || [],
        taskTrends: taskTrendsResult.data || [],
        habitCalendar: habitCalendarResult.data || [],
      }

      return { data: dashboardData, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(userId: string): Promise<ApiResponse<UserDashboardStats>> {
    try {
      const { data, error } = await supabase.from("user_dashboard_stats").select("*").eq("user_id", userId).single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get detailed statistics using the database function
  static async getDetailedStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc("get_user_dashboard_stats", { user_uuid: userId })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get activity summary for a date range
  static async getActivitySummary(userId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    try {
      // Get journals in date range
      const journalsPromise = JournalService.getJournalsByDateRange(userId, startDate, endDate)

      // Get completed tasks in date range
      const tasksPromise = TaskService.getTasks(
        userId,
        {
          status: ["completed"],
        },
        { limit: 1000 },
      )

      // Get habit completions in date range
      const habitsPromise = supabase
        .from("habit_completions")
        .select(`
          *,
          habit:habits(name, category)
        `)
        .eq("user_id", userId)
        .gte("completion_date", startDate)
        .lte("completion_date", endDate)

      const [journalsResult, tasksResult, habitsResult] = await Promise.all([
        journalsPromise,
        tasksPromise,
        habitsPromise,
      ])

      if (journalsResult.error) throw new Error(journalsResult.error)
      if (tasksResult.error) throw new Error(tasksResult.error)
      if (habitsResult.error) throw habitsResult.error

      const summary = {
        dateRange: { startDate, endDate },
        journals: {
          count: journalsResult.data?.length || 0,
          totalWords: journalsResult.data?.reduce((sum, j) => sum + j.word_count, 0) || 0,
          avgMood: journalsResult.data?.length
            ? journalsResult.data.reduce((sum, j) => sum + (j.mood_numeric || 0), 0) / journalsResult.data.length
            : 0,
        },
        tasks: {
          completed:
            tasksResult.data?.filter((t) => t.completed_at && t.completed_at >= startDate && t.completed_at <= endDate)
              .length || 0,
        },
        habits: {
          completions: habitsResult.data?.length || 0,
          uniqueHabits: new Set(habitsResult.data?.map((h) => h.habit_id)).size || 0,
          avgQuality: habitsResult.data?.length
            ? habitsResult.data.reduce((sum, h) => sum + (h.quality_rating || 0), 0) / habitsResult.data.length
            : 0,
        },
      }

      return { data: summary, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get weekly summary
  static async getWeeklySummary(userId: string): Promise<ApiResponse<any>> {
    const endDate = new Date().toISOString().split("T")[0]
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    return this.getActivitySummary(userId, startDate, endDate)
  }

  // Get monthly summary
  static async getMonthlySummary(userId: string): Promise<ApiResponse<any>> {
    const endDate = new Date().toISOString().split("T")[0]
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

    return this.getActivitySummary(userId, startDate, endDate)
  }

  // Get productivity insights
  static async getProductivityInsights(userId: string): Promise<ApiResponse<any>> {
    try {
      // Get data for analysis
      const [statsResult, moodTrendsResult, taskTrendsResult] = await Promise.all([
        this.getDetailedStats(userId),
        JournalService.getMoodEnergyTrends(userId, 3),
        TaskService.getTaskCompletionTrends(userId, 8),
      ])

      if (statsResult.error) throw new Error(statsResult.error)

      const stats = statsResult.data
      const insights = {
        productivity: {
          score: this.calculateProductivityScore(stats),
          trend: this.calculateProductivityTrend(taskTrendsResult.data || []),
          recommendations: this.generateProductivityRecommendations(stats),
        },
        wellbeing: {
          moodTrend: this.calculateMoodTrend(moodTrendsResult.data || []),
          energyTrend: this.calculateEnergyTrend(moodTrendsResult.data || []),
          recommendations: this.generateWellbeingRecommendations(moodTrendsResult.data || []),
        },
        habits: {
          consistency: stats?.habits?.avg_completion_rate || 0,
          activeStreaks: stats?.habits?.active_streaks || 0,
          recommendations: this.generateHabitRecommendations(stats?.habits || {}),
        },
      }

      return { data: insights, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Helper methods for insights calculation
  private static calculateProductivityScore(stats: any): number {
    if (!stats) return 0

    const taskCompletionRate = stats.tasks?.completed / Math.max(stats.tasks?.total_tasks, 1)
    const habitConsistency = stats.habits?.avg_completion_rate / 100
    const journalConsistency = Math.min(stats.journals?.this_month / 30, 1)

    return Math.round((taskCompletionRate * 0.4 + habitConsistency * 0.4 + journalConsistency * 0.2) * 100)
  }

  private static calculateProductivityTrend(taskTrends: any[]): "up" | "down" | "stable" {
    if (taskTrends.length < 2) return "stable"

    const recent = taskTrends.slice(0, 4).reduce((sum, t) => sum + (t.tasks_completed || 0), 0)
    const older = taskTrends.slice(4, 8).reduce((sum, t) => sum + (t.tasks_completed || 0), 0)

    if (recent > older * 1.1) return "up"
    if (recent < older * 0.9) return "down"
    return "stable"
  }

  private static calculateMoodTrend(moodTrends: any[]): "improving" | "declining" | "stable" {
    if (moodTrends.length < 2) return "stable"

    const recent = moodTrends.slice(0, 2).reduce((sum, t) => sum + (t.avg_mood || 0), 0) / 2
    const older = moodTrends.slice(2, 4).reduce((sum, t) => sum + (t.avg_mood || 0), 0) / 2

    if (recent > older + 0.3) return "improving"
    if (recent < older - 0.3) return "declining"
    return "stable"
  }

  private static calculateEnergyTrend(moodTrends: any[]): "improving" | "declining" | "stable" {
    if (moodTrends.length < 2) return "stable"

    const recent = moodTrends.slice(0, 2).reduce((sum, t) => sum + (t.avg_energy || 0), 0) / 2
    const older = moodTrends.slice(2, 4).reduce((sum, t) => sum + (t.avg_energy || 0), 0) / 2

    if (recent > older + 0.3) return "improving"
    if (recent < older - 0.3) return "declining"
    return "stable"
  }

  private static generateProductivityRecommendations(stats: any): string[] {
    const recommendations: string[] = []

    if (stats?.tasks?.overdue > 0) {
      recommendations.push("Focus on completing overdue tasks to reduce stress")
    }

    if (stats?.habits?.avg_completion_rate < 70) {
      recommendations.push("Consider reducing the number of habits to improve consistency")
    }

    if (stats?.journals?.this_month < 15) {
      recommendations.push("Try to journal more regularly for better self-reflection")
    }

    return recommendations
  }

  private static generateWellbeingRecommendations(moodTrends: any[]): string[] {
    const recommendations: string[] = []

    const avgMood = moodTrends.reduce((sum, t) => sum + (t.avg_mood || 0), 0) / moodTrends.length
    const avgEnergy = moodTrends.reduce((sum, t) => sum + (t.avg_energy || 0), 0) / moodTrends.length

    if (avgMood < 3) {
      recommendations.push("Consider activities that boost your mood")
    }

    if (avgEnergy < 3) {
      recommendations.push("Focus on habits that increase your energy levels")
    }

    return recommendations
  }

  private static generateHabitRecommendations(habitStats: any): string[] {
    const recommendations: string[] = []

    if (habitStats.active_streaks === 0) {
      recommendations.push("Start with one simple habit to build momentum")
    }

    if (habitStats.avg_completion_rate < 50) {
      recommendations.push("Consider making your habits smaller and easier")
    }

    return recommendations
  }
}
