import { storageManager, type StorageOptions, type StorageStats } from "./storage-manager"
import { localStorageAdapter } from "./local-storage-adapter"
import { sessionStorageAdapter } from "./session-storage-adapter"

export type StorageType = "indexeddb" | "localstorage" | "sessionstorage" | "auto"

export interface UnifiedStorageConfig {
  primaryStorage: StorageType
  fallbackStorage: StorageType
  enableEncryption: boolean
  enableCompression: boolean
  enableBackups: boolean
  enableSync: boolean
  cacheTimeout: number
}

export class UnifiedStorage {
  private static instance: UnifiedStorage
  private config: UnifiedStorageConfig
  private currentStorage: StorageType = "auto"

  private constructor(config: Partial<UnifiedStorageConfig> = {}) {
    this.config = {
      primaryStorage: "indexeddb",
      fallbackStorage: "localstorage",
      enableEncryption: true,
      enableCompression: true,
      enableBackups: true,
      enableSync: false,
      cacheTimeout: 3600000, // 1 hour
      ...config,
    }

    this.initialize()
  }

  static getInstance(config?: Partial<UnifiedStorageConfig>): UnifiedStorage {
    if (!UnifiedStorage.instance) {
      UnifiedStorage.instance = new UnifiedStorage(config)
    }
    return UnifiedStorage.instance
  }

  private async initialize(): Promise<void> {
    // Detect best available storage
    this.currentStorage = await this.detectBestStorage()
    console.log(`UnifiedStorage: Using ${this.currentStorage} as primary storage`)
  }

  private async detectBestStorage(): Promise<StorageType> {
    if (this.config.primaryStorage !== "auto") {
      if (await this.isStorageAvailable(this.config.primaryStorage)) {
        return this.config.primaryStorage
      }
    }

    // Auto-detect best storage
    if (await this.isStorageAvailable("indexeddb")) {
      return "indexeddb"
    } else if (await this.isStorageAvailable("localstorage")) {
      return "localstorage"
    } else if (await this.isStorageAvailable("sessionstorage")) {
      return "sessionstorage"
    }

    throw new Error("No storage mechanism available")
  }

  private async isStorageAvailable(type: StorageType): Promise<boolean> {
    try {
      switch (type) {
        case "indexeddb":
          return "indexedDB" in window && indexedDB !== null
        case "localstorage":
          const testKey = "__storage_test__"
          localStorage.setItem(testKey, "test")
          localStorage.removeItem(testKey)
          return true
        case "sessionstorage":
          const testKey2 = "__storage_test__"
          sessionStorage.setItem(testKey2, "test")
          sessionStorage.removeItem(testKey2)
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }

  async store(key: string, data: any, options: Partial<StorageOptions> = {}): Promise<void> {
    const storageOptions: StorageOptions = {
      encrypt: this.config.enableEncryption,
      compress: this.config.enableCompression,
      backup: this.config.enableBackups,
      sync: this.config.enableSync,
      ...options,
    }

    try {
      switch (this.currentStorage) {
        case "indexeddb":
          await storageManager.store(key, data, storageOptions)
          break
        case "localstorage":
          await localStorageAdapter.store(key, data, storageOptions)
          break
        case "sessionstorage":
          await sessionStorageAdapter.store(key, data)
          break
        default:
          throw new Error("No storage available")
      }

      // Cache frequently accessed data
      if (this.shouldCache(key)) {
        await this.cacheData(key, data)
      }
    } catch (error) {
      console.error(`UnifiedStorage: Failed to store ${key}, trying fallback:`, error)
      await this.fallbackStore(key, data, storageOptions)
    }
  }

  async retrieve(key: string): Promise<any> {
    try {
      // Try cache first for frequently accessed data
      if (this.shouldCache(key)) {
        const cached = await this.getCachedData(key)
        if (cached !== null) {
          return cached
        }
      }

      let data: any
      switch (this.currentStorage) {
        case "indexeddb":
          data = await storageManager.retrieve(key)
          break
        case "localstorage":
          data = await localStorageAdapter.retrieve(key)
          break
        case "sessionstorage":
          data = await sessionStorageAdapter.retrieve(key)
          break
        default:
          throw new Error("No storage available")
      }

      // Cache the retrieved data
      if (data !== null && this.shouldCache(key)) {
        await this.cacheData(key, data)
      }

      return data
    } catch (error) {
      console.error(`UnifiedStorage: Failed to retrieve ${key}, trying fallback:`, error)
      return await this.fallbackRetrieve(key)
    }
  }

  async remove(key: string): Promise<void> {
    try {
      switch (this.currentStorage) {
        case "indexeddb":
          await storageManager.remove(key)
          break
        case "localstorage":
          await localStorageAdapter.remove(key)
          break
        case "sessionstorage":
          await sessionStorageAdapter.remove(key)
          break
      }

      // Remove from cache
      await this.removeCachedData(key)
    } catch (error) {
      console.error(`UnifiedStorage: Failed to remove ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      switch (this.currentStorage) {
        case "indexeddb":
          await storageManager.clear()
          break
        case "localstorage":
          await localStorageAdapter.clear()
          break
        case "sessionstorage":
          await sessionStorageAdapter.clear()
          break
      }

      // Clear cache
      await this.clearCache()
    } catch (error) {
      console.error("UnifiedStorage: Failed to clear storage:", error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const data = await this.retrieve(key)
      return data !== null
    } catch {
      return false
    }
  }

  async keys(): Promise<string[]> {
    try {
      switch (this.currentStorage) {
        case "localstorage":
          return await localStorageAdapter.keys()
        case "sessionstorage":
          return await sessionStorageAdapter.keys()
        default:
          // For IndexedDB, we'd need to implement this in the storage manager
          return []
      }
    } catch (error) {
      console.error("UnifiedStorage: Failed to get keys:", error)
      return []
    }
  }

  async getStats(): Promise<StorageStats> {
    try {
      if (this.currentStorage === "indexeddb") {
        return await storageManager.getStorageStats()
      } else {
        // Basic stats for other storage types
        const keys = await this.keys()
        let totalSize = 0

        for (const key of keys) {
          const data = await this.retrieve(key)
          if (data) {
            totalSize += JSON.stringify(data).length
          }
        }

        return {
          totalSize,
          itemCount: keys.length,
          syncStatus: "synced",
          storageQuota: 0,
          usedQuota: 0,
        }
      }
    } catch (error) {
      console.error("UnifiedStorage: Failed to get stats:", error)
      return {
        totalSize: 0,
        itemCount: 0,
        syncStatus: "error",
        storageQuota: 0,
        usedQuota: 0,
      }
    }
  }

  // Backup operations
  async createBackup(): Promise<string> {
    if (this.currentStorage === "indexeddb") {
      return await storageManager.createBackup()
    }
    throw new Error("Backups only supported with IndexedDB")
  }

  async restoreBackup(backupId: string): Promise<void> {
    if (this.currentStorage === "indexeddb") {
      await storageManager.restoreBackup(backupId)
    } else {
      throw new Error("Backup restore only supported with IndexedDB")
    }
  }

  async listBackups(): Promise<Array<{ id: string; timestamp: number; size: number; description?: string }>> {
    if (this.currentStorage === "indexeddb") {
      return await storageManager.listBackups()
    }
    return []
  }

  // Configuration
  updateConfig(newConfig: Partial<UnifiedStorageConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): UnifiedStorageConfig {
    return { ...this.config }
  }

  getCurrentStorageType(): StorageType {
    return this.currentStorage
  }

  // Private helper methods
  private async fallbackStore(key: string, data: any, options: StorageOptions): Promise<void> {
    try {
      if (this.config.fallbackStorage === "localstorage") {
        await localStorageAdapter.store(key, data, options)
      } else if (this.config.fallbackStorage === "sessionstorage") {
        await sessionStorageAdapter.store(key, data)
      }
    } catch (error) {
      console.error("UnifiedStorage: Fallback storage also failed:", error)
      throw error
    }
  }

  private async fallbackRetrieve(key: string): Promise<any> {
    try {
      if (this.config.fallbackStorage === "localstorage") {
        return await localStorageAdapter.retrieve(key)
      } else if (this.config.fallbackStorage === "sessionstorage") {
        return await sessionStorageAdapter.retrieve(key)
      }
    } catch (error) {
      console.error("UnifiedStorage: Fallback retrieve also failed:", error)
    }
    return null
  }

  private shouldCache(key: string): boolean {
    // Cache frequently accessed data like user profile, settings, etc.
    const cacheableKeys = ["profile", "settings", "stats", "preferences"]
    return cacheableKeys.some((cacheKey) => key.includes(cacheKey))
  }

  private async cacheData(key: string, data: any): Promise<void> {
    if (this.currentStorage === "indexeddb") {
      await storageManager.cache(key, data, this.config.cacheTimeout)
    }
  }

  private async getCachedData(key: string): Promise<any> {
    if (this.currentStorage === "indexeddb") {
      return await storageManager.getFromCache(key)
    }
    return null
  }

  private async removeCachedData(key: string): Promise<void> {
    if (this.currentStorage === "indexeddb") {
      await storageManager.clearCache(key)
    }
  }

  private async clearCache(): Promise<void> {
    if (this.currentStorage === "indexeddb") {
      await storageManager.clearCache()
    }
  }
}

// Export singleton instance
export const unifiedStorage = UnifiedStorage.getInstance()
