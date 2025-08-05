"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, subscribeToTable } from "./client"
import { JournalService } from "./journals"
import { TaskService } from "./tasks"
import { HabitService } from "./habits"
import { DashboardService } from "./dashboard"
import type {
  Journal,
  JournalWithStats,
  JournalFilters,
  Task,
  TaskWithDependencies,
  TaskFilters,
  Habit,
  HabitWithStats,
  HabitFilters,
  UserDashboardStats,
  DashboardData,
  PaginationOptions,
  ApiResponse,
} from "./types"

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        // Get or create profile
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(profile)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(profile)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}

// Journals hook
export function useJournals(filters: JournalFilters = {}, pagination: PaginationOptions = {}) {
  const [journals, setJournals] = useState<JournalWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(pagination.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const { user } = useAuth()

  const fetchJournals = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const result = await JournalService.getJournals(user.id, filters, { ...pagination, page })

    if (result.error) {
      setError(result.error)
    } else {
      setJournals(result.data || [])
      setCount(result.count || 0)
      setTotalPages(result.totalPages || 0)
      setError(null)
    }

    setLoading(false)
  }, [user, filters, pagination, page])

  useEffect(() => {
    fetchJournals()
  }, [fetchJournals])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToTable("journals", () => fetchJournals(), `user_id=eq.${user.id}`)

    return unsubscribe
  }, [user, fetchJournals])

  const createJournal = async (journal: Omit<Journal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await JournalService.createJournal({
      ...journal,
      user_id: user.id,
    })

    if (!result.error) {
      fetchJournals()
    }

    return result
  }

  const updateJournal = async (id: string, updates: Partial<Journal>) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await JournalService.updateJournal(id, user.id, updates)

    if (!result.error) {
      fetchJournals()
    }

    return result
  }

  const deleteJournal = async (id: string) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await JournalService.deleteJournal(id, user.id)

    if (!result.error) {
      fetchJournals()
    }

    return result
  }

  return {
    journals,
    loading,
    error,
    count,
    page,
    totalPages,
    setPage,
    createJournal,
    updateJournal,
    deleteJournal,
    refetch: fetchJournals,
  }
}

// Tasks hook
export function useTasks(filters: TaskFilters = {}, pagination: PaginationOptions = {}) {
  const [tasks, setTasks] = useState<TaskWithDependencies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(pagination.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const { user } = useAuth()

  const fetchTasks = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const result = await TaskService.getTasks(user.id, filters, { ...pagination, page })

    if (result.error) {
      setError(result.error)
    } else {
      setTasks(result.data || [])
      setCount(result.count || 0)
      setTotalPages(result.totalPages || 0)
      setError(null)
    }

    setLoading(false)
  }, [user, filters, pagination, page])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToTable("tasks", () => fetchTasks(), `user_id=eq.${user.id}`)

    return unsubscribe
  }, [user, fetchTasks])

  const createTask = async (task: Omit<Task, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await TaskService.createTask({
      ...task,
      user_id: user.id,
    })

    if (!result.error) {
      fetchTasks()
    }

    return result
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await TaskService.updateTask(id, user.id, updates)

    if (!result.error) {
      fetchTasks()
    }

    return result
  }

  const deleteTask = async (id: string) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await TaskService.deleteTask(id, user.id)

    if (!result.error) {
      fetchTasks()
    }

    return result
  }

  const completeTask = async (id: string) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await TaskService.completeTask(id, user.id)

    if (!result.error) {
      fetchTasks()
    }

    return result
  }

  return {
    tasks,
    loading,
    error,
    count,
    page,
    totalPages,
    setPage,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refetch: fetchTasks,
  }
}

// Habits hook
export function useHabits(filters: HabitFilters = {}, pagination: PaginationOptions = {}) {
  const [habits, setHabits] = useState<HabitWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(pagination.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const { user } = useAuth()

  const fetchHabits = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const result = await HabitService.getHabits(user.id, filters, { ...pagination, page })

    if (result.error) {
      setError(result.error)
    } else {
      setHabits(result.data || [])
      setCount(result.count || 0)
      setTotalPages(result.totalPages || 0)
      setError(null)
    }

    setLoading(false)
  }, [user, filters, pagination, page])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToTable("habits", () => fetchHabits(), `user_id=eq.${user.id}`)

    return unsubscribe
  }, [user, fetchHabits])

  const createHabit = async (habit: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await HabitService.createHabit({
      ...habit,
      user_id: user.id,
    })

    if (!result.error) {
      fetchHabits()
    }

    return result
  }

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await HabitService.updateHabit(id, user.id, updates)

    if (!result.error) {
      fetchHabits()
    }

    return result
  }

  const deleteHabit = async (id: string) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await HabitService.deleteHabit(id, user.id)

    if (!result.error) {
      fetchHabits()
    }

    return result
  }

  const completeHabit = async (habitId: string, completion?: any) => {
    if (!user) return { data: null, error: "Not authenticated" }

    const result = await HabitService.completeHabit(habitId, user.id, completion)

    if (!result.error) {
      fetchHabits()
    }

    return result
  }

  return {
    habits,
    loading,
    error,
    count,
    page,
    totalPages,
    setPage,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    refetch: fetchHabits,
  }
}

// Dashboard hook
export function useDashboardStats() {
  const [stats, setStats] = useState<UserDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStats = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const result = await DashboardService.getDashboardStats(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setStats(result.data)
      setError(null)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

// Full dashboard data hook
export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchDashboard = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const result = await DashboardService.getDashboardData(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setDashboardData(result.data)
      setError(null)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Subscribe to changes in all relevant tables
  useEffect(() => {
    if (!user) return

    const unsubscribes = [
      subscribeToTable("journals", fetchDashboard, `user_id=eq.${user.id}`),
      subscribeToTable("tasks", fetchDashboard, `user_id=eq.${user.id}`),
      subscribeToTable("habits", fetchDashboard, `user_id=eq.${user.id}`),
      subscribeToTable("habit_completions", fetchDashboard, `user_id=eq.${user.id}`),
    ]

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [user, fetchDashboard])

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
  }
}

// Generic data fetching hook
export function useSupabaseQuery<T>(queryFn: () => Promise<ApiResponse<T>>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await queryFn()

    if (result.error) {
      setError(result.error)
      setData(null)
    } else {
      setData(result.data)
      setError(null)
    }

    setLoading(false)
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
