"use client"

import { useState, useEffect, useCallback } from "react"
import { unifiedStorage, type StorageStats } from "./unified-storage"

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true)
        const stored = await unifiedStorage.retrieve(key)
        if (stored !== null) {
          setValue(stored)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error(`useStorage: Failed to load ${key}:`, err)
      } finally {
        setLoading(false)
      }
    }

    loadValue()
  }, [key])

  // Update storage when value changes
  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        setError(null)
        const valueToStore = typeof newValue === "function" ? (newValue as (prev: T) => T)(value) : newValue

        setValue(valueToStore)
        await unifiedStorage.store(key, valueToStore)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save data")
        console.error(`useStorage: Failed to save ${key}:`, err)
      }
    },
    [key, value],
  )

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      setError(null)
      await unifiedStorage.remove(key)
      setValue(defaultValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove data")
      console.error(`useStorage: Failed to remove ${key}:`, err)
    }
  }, [key, defaultValue])

  return {
    value,
    setValue: updateValue,
    removeValue,
    loading,
    error,
  }
}

export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const newStats = await unifiedStorage.getStats()
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load storage stats")
      console.error("useStorageStats: Failed to load stats:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return {
    stats,
    loading,
    error,
    refresh: refreshStats,
  }
}

export function useBackups() {
  const [backups, setBackups] = useState<Array<{ id: string; timestamp: number; size: number; description?: string }>>(
    [],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBackups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const backupList = await unifiedStorage.listBackups()
      setBackups(backupList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backups")
      console.error("useBackups: Failed to load backups:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createBackup = useCallback(async () => {
    try {
      setError(null)
      const backupId = await unifiedStorage.createBackup()
      await loadBackups() // Refresh list
      return backupId
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup")
      console.error("useBackups: Failed to create backup:", err)
      throw err
    }
  }, [loadBackups])

  const restoreBackup = useCallback(async (backupId: string) => {
    try {
      setError(null)
      await unifiedStorage.restoreBackup(backupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore backup")
      console.error("useBackups: Failed to restore backup:", err)
      throw err
    }
  }, [])

  useEffect(() => {
    loadBackups()
  }, [loadBackups])

  return {
    backups,
    loading,
    error,
    createBackup,
    restoreBackup,
    refresh: loadBackups,
  }
}

export function useBulkStorage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkStore = useCallback(async (items: Array<{ key: string; data: any }>) => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all(items.map((item) => unifiedStorage.store(item.key, item.data)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store items")
      console.error("useBulkStorage: Failed to store items:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkRetrieve = useCallback(async (keys: string[]) => {
    try {
      setLoading(true)
      setError(null)

      const results = await Promise.all(
        keys.map(async (key) => ({
          key,
          data: await unifiedStorage.retrieve(key),
        })),
      )

      return results
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve items")
      console.error("useBulkStorage: Failed to retrieve items:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkRemove = useCallback(async (keys: string[]) => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all(keys.map((key) => unifiedStorage.remove(key)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove items")
      console.error("useBulkStorage: Failed to remove items:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    bulkStore,
    bulkRetrieve,
    bulkRemove,
    loading,
    error,
  }
}
