import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Auth helpers
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Profile helpers
export const getOrCreateProfile = async (userId: string) => {
  let { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error && error.code === "PGRST116") {
    // Profile doesn't exist, create it
    const { data: user } = await supabase.auth.getUser()
    if (user.user) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: user.user.user_metadata?.full_name || null,
          username: user.user.user_metadata?.username || null,
          avatar_url: user.user.user_metadata?.avatar_url || null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      profile = newProfile
    }
  } else if (error) {
    throw error
  }

  return profile
}

// Real-time subscription helpers
export const subscribeToTable = (table: string, callback: (payload: any) => void, filter?: string) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: table,
        filter: filter,
      },
      callback,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Error handling helper
export const handleSupabaseError = (error: any) => {
  console.error("Supabase error:", error)

  if (error?.code === "PGRST301") {
    return "Access denied. Please check your permissions."
  }

  if (error?.code === "PGRST116") {
    return "Record not found."
  }

  if (error?.code === "23505") {
    return "This record already exists."
  }

  if (error?.code === "23503") {
    return "Cannot delete this record because it is referenced by other data."
  }

  return error?.message || "An unexpected error occurred."
}

// Batch operations helper
export const batchOperation = async (operations: (() => Promise<any>)[], batchSize = 10): Promise<any[]> => {
  const results: any[] = []

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((op) => op()))
    results.push(...batchResults)
  }

  return results
}

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean },
) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options?.cacheControl || "3600",
    upsert: options?.upsert || false,
  })

  if (error) throw error
  return data
}

export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) throw error
}
