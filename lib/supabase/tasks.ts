import { supabase, handleSupabaseError } from "./client"
import type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithDependencies,
  TaskDependency,
  TaskDependencyInsert,
  TaskFilters,
  PaginationOptions,
  ApiResponse,
} from "./types"

export class TaskService {
  // Get tasks with optional filtering and pagination
  static async getTasks(
    userId: string,
    filters: TaskFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<ApiResponse<TaskWithDependencies[]>> {
    try {
      let query = supabase.from("tasks_with_dependencies").select("*", { count: "exact" }).eq("user_id", userId)

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status)
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in("priority", filters.priority)
      }
      if (filters.category) {
        query = query.eq("category", filters.category)
      }
      if (filters.project) {
        query = query.eq("project", filters.project)
      }
      if (filters.dueDateFrom) {
        query = query.gte("due_date", filters.dueDateFrom)
      }
      if (filters.dueDateTo) {
        query = query.lte("due_date", filters.dueDateTo)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags)
      }
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
      }
      if (filters.isOverdue) {
        query = query.eq("is_overdue", true)
      }
      if (filters.isArchived !== undefined) {
        query = query.eq("is_archived", filters.isArchived)
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

  // Get a single task
  static async getTask(id: string, userId: string): Promise<ApiResponse<TaskWithDependencies>> {
    try {
      const { data, error } = await supabase
        .from("tasks_with_dependencies")
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

  // Create a new task
  static async createTask(task: TaskInsert): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase.from("tasks").insert(task).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Update a task
  static async updateTask(id: string, userId: string, updates: TaskUpdate): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from("tasks")
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

  // Delete a task
  static async deleteTask(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Complete a task
  static async completeTask(id: string, userId: string): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
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

  // Get task dependencies
  static async getTaskDependencies(taskId: string): Promise<ApiResponse<TaskDependency[]>> {
    try {
      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
        `)
        .eq("task_id", taskId)

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Add task dependency
  static async addTaskDependency(dependency: TaskDependencyInsert): Promise<ApiResponse<TaskDependency>> {
    try {
      const { data, error } = await supabase.from("task_dependencies").insert(dependency).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Remove task dependency
  static async removeTaskDependency(taskId: string, dependsOnTaskId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("task_id", taskId)
        .eq("depends_on_task_id", dependsOnTaskId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get subtasks
  static async getSubtasks(parentTaskId: string): Promise<ApiResponse<TaskWithDependencies[]>> {
    try {
      const { data, error } = await supabase
        .from("tasks_with_dependencies")
        .select("*")
        .eq("parent_task_id", parentTaskId)
        .order("order_index", { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get overdue tasks
  static async getOverdueTasks(userId: string): Promise<ApiResponse<TaskWithDependencies[]>> {
    try {
      const { data, error } = await supabase
        .from("tasks_with_dependencies")
        .select("*")
        .eq("user_id", userId)
        .eq("is_overdue", true)
        .neq("status", "completed")
        .order("due_date", { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get tasks by project
  static async getTasksByProject(userId: string, project: string): Promise<ApiResponse<TaskWithDependencies[]>> {
    try {
      const { data, error } = await supabase
        .from("tasks_with_dependencies")
        .select("*")
        .eq("user_id", userId)
        .eq("project", project)
        .order("order_index", { ascending: true })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get task statistics
  static async getTaskStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc("get_user_dashboard_stats", { user_uuid: userId })

      if (error) throw error

      return {
        data: data?.tasks || {},
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Get task completion trends
  static async getTaskCompletionTrends(userId: string, weeks = 12): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from("task_completion_trends")
        .select("*")
        .eq("user_id", userId)
        .gte("week", new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("week", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  // Bulk operations
  static async bulkUpdateStatus(
    ids: string[],
    userId: string,
    status: "todo" | "in_progress" | "completed" | "cancelled",
  ): Promise<ApiResponse<boolean>> {
    try {
      const updates: any = { status }
      if (status === "completed") {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from("tasks").update(updates).in("id", ids).eq("user_id", userId)

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
      const { error } = await supabase.from("tasks").delete().in("id", ids).eq("user_id", userId)

      if (error) throw error

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }

  static async bulkArchive(ids: string[], userId: string, archived = true): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_archived: archived })
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

  // Reorder tasks
  static async reorderTasks(
    userId: string,
    taskUpdates: { id: string; order_index: number }[],
  ): Promise<ApiResponse<boolean>> {
    try {
      const updates = taskUpdates.map(({ id, order_index }) =>
        supabase.from("tasks").update({ order_index }).eq("id", id).eq("user_id", userId),
      )

      await Promise.all(updates)

      return { data: true, error: null }
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error),
      }
    }
  }
}
