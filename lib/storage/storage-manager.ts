import { openDB, type DBSchema, type IDBPDatabase } from "idb"

// Define the database schema
interface LifeOSDB extends DBSchema {
  userData: {
    key: string
    value: {
      id: string
      type: "profile" | "stats" | "habits" | "todos" | "journal" | "checkIns" | "settings" | "goals"
      data: any
      timestamp: number
      version: number
      encrypted?: boolean
    }
  }
  cache: {
    key: string
    value: {
      key: string
      data: any
      timestamp: number
      expires: number
      tags?: string[]
    }
  }
  backups: {
    key: string
    value: {
      id: string
      timestamp: number
      data: any
      size: number
      compressed: boolean
      description?: string
    }
  }
  sync: {
    key: string
    value: {
      id: string
      type: string
      data: any
      timestamp: number
      synced: boolean
      retryCount: number
      lastAttempt?: number
    }
  }
}

export interface StorageOptions {
  encrypt?: boolean
  compress?: boolean
  ttl?: number
  backup?: boolean
  sync?: boolean
}

export interface StorageStats {
  totalSize: number
  itemCount: number
  lastBackup?: number
  syncStatus: "synced" | "pending" | "error"
  storageQuota: number
  usedQuota: number
}

export class StorageManager {
  private static instance: StorageManager
  private db: IDBPDatabase<LifeOSDB> | null = null
  private dbName = "LifeOSDatabase"
  private dbVersion = 3
  private encryptionKey: string | null = null
  private compressionEnabled = true

  private constructor() {
    this.initialize()
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await openDB<LifeOSDB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`)

          // User data store
          if (!db.objectStoreNames.contains("userData")) {
            const userStore = db.createObjectStore("userData", { keyPath: "id" })
            userStore.createIndex("type", "type", { unique: false })
            userStore.createIndex("timestamp", "timestamp", { unique: false })
          }

          // Cache store
          if (!db.objectStoreNames.contains("cache")) {
            const cacheStore = db.createObjectStore("cache", { keyPath: "key" })
            cacheStore.createIndex("expires", "expires", { unique: false })
            cacheStore.createIndex("timestamp", "timestamp", { unique: false })
          }

          // Backups store
          if (!db.objectStoreNames.contains("backups")) {
            const backupStore = db.createObjectStore("backups", { keyPath: "id" })
            backupStore.createIndex("timestamp", "timestamp", { unique: false })
          }

          // Sync queue store
          if (!db.objectStoreNames.contains("sync")) {
            const syncStore = db.createObjectStore("sync", { keyPath: "id" })
            syncStore.createIndex("synced", "synced", { unique: false })
            syncStore.createIndex("timestamp", "timestamp", { unique: false })
          }
        },
      })

      // Initialize encryption key if needed
      await this.initializeEncryption()

      // Clean up expired cache entries
      await this.cleanupExpiredCache()

      console.log("StorageManager initialized successfully")
    } catch (error) {
      console.error("Failed to initialize StorageManager:", error)
      // Fallback to localStorage
      this.initializeFallback()
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Check if encryption key exists in localStorage
      let key = localStorage.getItem("lifeOS_encryption_key")

      if (!key) {
        // Generate new encryption key
        const keyArray = new Uint8Array(32)
        crypto.getRandomValues(keyArray)
        key = Array.from(keyArray, (byte) => byte.toString(16).padStart(2, "0")).join("")
        localStorage.setItem("lifeOS_encryption_key", key)
      }

      this.encryptionKey = key
    } catch (error) {
      console.warn("Encryption initialization failed:", error)
    }
  }

  private initializeFallback(): void {
    console.log("Using localStorage fallback")
    // Set up localStorage-based storage as fallback
  }

  // Core storage operations
  async store(key: string, data: any, options: StorageOptions = {}): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      let processedData = data

      // Encrypt data if requested
      if (options.encrypt && this.encryptionKey) {
        processedData = await this.encrypt(JSON.stringify(data))
      }

      // Compress data if requested
      if (options.compress && this.compressionEnabled) {
        processedData = await this.compress(processedData)
      }

      const record = {
        id: key,
        type: this.inferDataType(key),
        data: processedData,
        timestamp: Date.now(),
        version: 1,
        encrypted: options.encrypt || false,
      }

      await this.db.put("userData", record)

      // Create backup if requested
      if (options.backup) {
        await this.createBackup(key, data)
      }

      // Add to sync queue if requested
      if (options.sync) {
        await this.addToSyncQueue(key, data, "store")
      }

      console.log(`Data stored successfully: ${key}`)
    } catch (error) {
      console.error(`Failed to store data for key ${key}:`, error)
      throw error
    }
  }

  async retrieve(key: string): Promise<any> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const record = await this.db.get("userData", key)

      if (!record) {
        return null
      }

      let data = record.data

      // Decrypt data if encrypted
      if (record.encrypted && this.encryptionKey) {
        data = await this.decrypt(data)
        data = JSON.parse(data)
      }

      // Decompress data if needed
      if (typeof data === "string" && this.isCompressed(data)) {
        data = await this.decompress(data)
      }

      return data
    } catch (error) {
      console.error(`Failed to retrieve data for key ${key}:`, error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      await this.db.delete("userData", key)
      console.log(`Data removed successfully: ${key}`)
    } catch (error) {
      console.error(`Failed to remove data for key ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      await this.db.clear("userData")
      await this.db.clear("cache")
      console.log("All data cleared successfully")
    } catch (error) {
      console.error("Failed to clear data:", error)
      throw error
    }
  }

  // Cache operations
  async cache(key: string, data: any, ttl = 3600000): Promise<void> {
    if (!this.db) return

    try {
      const cacheRecord = {
        key,
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
        tags: this.extractTags(key),
      }

      await this.db.put("cache", cacheRecord)
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error)
    }
  }

  async getFromCache(key: string): Promise<any> {
    if (!this.db) return null

    try {
      const record = await this.db.get("cache", key)

      if (!record || record.expires < Date.now()) {
        if (record) {
          await this.db.delete("cache", key)
        }
        return null
      }

      return record.data
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error)
      return null
    }
  }

  async clearCache(tag?: string): Promise<void> {
    if (!this.db) return

    try {
      if (tag) {
        const tx = this.db.transaction("cache", "readwrite")
        const store = tx.objectStore("cache")
        const cursor = await store.openCursor()

        while (cursor) {
          if (cursor.value.tags?.includes(tag)) {
            await cursor.delete()
          }
          await cursor.continue()
        }
      } else {
        await this.db.clear("cache")
      }
    } catch (error) {
      console.error("Failed to clear cache:", error)
    }
  }

  // Backup operations
  async createBackup(key?: string, data?: any): Promise<string> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      let backupData: any

      if (key && data) {
        backupData = { [key]: data }
      } else {
        // Full backup
        const tx = this.db.transaction("userData", "readonly")
        const store = tx.objectStore("userData")
        const allRecords = await store.getAll()

        backupData = {}
        for (const record of allRecords) {
          backupData[record.id] = record.data
        }
      }

      const compressed = await this.compress(JSON.stringify(backupData))
      const backup = {
        id: backupId,
        timestamp: Date.now(),
        data: compressed,
        size: new Blob([compressed]).size,
        compressed: true,
        description: key ? `Backup for ${key}` : "Full system backup",
      }

      await this.db.put("backups", backup)

      // Keep only last 10 backups
      await this.cleanupOldBackups()

      console.log(`Backup created: ${backupId}`)
      return backupId
    } catch (error) {
      console.error("Failed to create backup:", error)
      throw error
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    try {
      const backup = await this.db.get("backups", backupId)

      if (!backup) {
        throw new Error("Backup not found")
      }

      let data = backup.data
      if (backup.compressed) {
        data = await this.decompress(data)
      }

      const backupData = JSON.parse(data)

      // Restore data
      const tx = this.db.transaction("userData", "readwrite")
      const store = tx.objectStore("userData")

      for (const [key, value] of Object.entries(backupData)) {
        const record = {
          id: key,
          type: this.inferDataType(key),
          data: value,
          timestamp: Date.now(),
          version: 1,
          encrypted: false,
        }
        await store.put(record)
      }

      await tx.done
      console.log(`Backup restored: ${backupId}`)
    } catch (error) {
      console.error("Failed to restore backup:", error)
      throw error
    }
  }

  async listBackups(): Promise<Array<{ id: string; timestamp: number; size: number; description?: string }>> {
    if (!this.db) return []

    try {
      const backups = await this.db.getAll("backups")
      return backups.map((backup) => ({
        id: backup.id,
        timestamp: backup.timestamp,
        size: backup.size,
        description: backup.description,
      }))
    } catch (error) {
      console.error("Failed to list backups:", error)
      return []
    }
  }

  // Sync operations
  async addToSyncQueue(key: string, data: any, operation: "store" | "remove"): Promise<void> {
    if (!this.db) return

    try {
      const syncRecord = {
        id: `sync_${key}_${Date.now()}`,
        type: operation,
        data: { key, data },
        timestamp: Date.now(),
        synced: false,
        retryCount: 0,
      }

      await this.db.put("sync", syncRecord)
    } catch (error) {
      console.error("Failed to add to sync queue:", error)
    }
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) return []

    try {
      const index = this.db.transaction("sync").store.index("synced")
      return await index.getAll(false)
    } catch (error) {
      console.error("Failed to get sync queue:", error)
      return []
    }
  }

  async markSynced(syncId: string): Promise<void> {
    if (!this.db) return

    try {
      const record = await this.db.get("sync", syncId)
      if (record) {
        record.synced = true
        await this.db.put("sync", record)
      }
    } catch (error) {
      console.error("Failed to mark as synced:", error)
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<StorageStats> {
    try {
      const quota = await navigator.storage?.estimate()
      let totalSize = 0
      let itemCount = 0

      if (this.db) {
        const userData = await this.db.getAll("userData")
        itemCount = userData.length

        for (const record of userData) {
          totalSize += new Blob([JSON.stringify(record)]).size
        }
      }

      const backups = await this.listBackups()
      const lastBackup = backups.length > 0 ? Math.max(...backups.map((b) => b.timestamp)) : undefined

      const syncQueue = await this.getSyncQueue()
      const syncStatus = syncQueue.length === 0 ? "synced" : "pending"

      return {
        totalSize,
        itemCount,
        lastBackup,
        syncStatus,
        storageQuota: quota?.quota || 0,
        usedQuota: quota?.usage || 0,
      }
    } catch (error) {
      console.error("Failed to get storage stats:", error)
      return {
        totalSize: 0,
        itemCount: 0,
        syncStatus: "error",
        storageQuota: 0,
        usedQuota: 0,
      }
    }
  }

  // Utility methods
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) return data

    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const keyBuffer = encoder.encode(this.encryptionKey)

      const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer.slice(0, 32), { name: "AES-GCM" }, false, [
        "encrypt",
      ])

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, dataBuffer)

      const result = new Uint8Array(iv.length + encrypted.byteLength)
      result.set(iv)
      result.set(new Uint8Array(encrypted), iv.length)

      return btoa(String.fromCharCode(...result))
    } catch (error) {
      console.error("Encryption failed:", error)
      return data
    }
  }

  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) return encryptedData

    try {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const keyBuffer = encoder.encode(this.encryptionKey)

      const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer.slice(0, 32), { name: "AES-GCM" }, false, [
        "decrypt",
      ])

      const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
      const iv = encryptedBuffer.slice(0, 12)
      const data = encryptedBuffer.slice(12)

      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, data)

      return decoder.decode(decrypted)
    } catch (error) {
      console.error("Decryption failed:", error)
      return encryptedData
    }
  }

  private async compress(data: string): Promise<string> {
    if (!this.compressionEnabled) return data

    try {
      const stream = new CompressionStream("gzip")
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(new TextEncoder().encode(data))
      writer.close()

      const chunks: Uint8Array[] = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        compressed.set(chunk, offset)
        offset += chunk.length
      }

      return btoa(String.fromCharCode(...compressed))
    } catch (error) {
      console.error("Compression failed:", error)
      return data
    }
  }

  private async decompress(compressedData: string): Promise<string> {
    try {
      const compressed = Uint8Array.from(atob(compressedData), (c) => c.charCodeAt(0))
      const stream = new DecompressionStream("gzip")
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()

      writer.write(compressed)
      writer.close()

      const chunks: Uint8Array[] = []
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
      let offset = 0
      for (const chunk of chunks) {
        decompressed.set(chunk, offset)
        offset += chunk.length
      }

      return new TextDecoder().decode(decompressed)
    } catch (error) {
      console.error("Decompression failed:", error)
      return compressedData
    }
  }

  private isCompressed(data: string): boolean {
    try {
      // Simple heuristic: compressed data is typically base64 encoded
      return /^[A-Za-z0-9+/]*={0,2}$/.test(data) && data.length > 100
    } catch {
      return false
    }
  }

  private inferDataType(
    key: string,
  ): "profile" | "stats" | "habits" | "todos" | "journal" | "checkIns" | "settings" | "goals" {
    if (key.includes("profile")) return "profile"
    if (key.includes("stats")) return "stats"
    if (key.includes("habit")) return "habits"
    if (key.includes("todo")) return "todos"
    if (key.includes("journal")) return "journal"
    if (key.includes("checkin")) return "checkIns"
    if (key.includes("goal")) return "goals"
    return "settings"
  }

  private extractTags(key: string): string[] {
    const tags = []
    if (key.includes("user")) tags.push("user")
    if (key.includes("temp")) tags.push("temporary")
    if (key.includes("cache")) tags.push("cache")
    return tags
  }

  private async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return

    try {
      const tx = this.db.transaction("cache", "readwrite")
      const store = tx.objectStore("cache")
      const index = store.index("expires")
      const cursor = await index.openCursor(IDBKeyRange.upperBound(Date.now()))

      while (cursor) {
        await cursor.delete()
        await cursor.continue()
      }
    } catch (error) {
      console.error("Failed to cleanup expired cache:", error)
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    if (!this.db) return

    try {
      const backups = await this.db.getAll("backups")
      if (backups.length > 10) {
        const sortedBackups = backups.sort((a, b) => b.timestamp - a.timestamp)
        const toDelete = sortedBackups.slice(10)

        for (const backup of toDelete) {
          await this.db.delete("backups", backup.id)
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old backups:", error)
    }
  }
}

export const storageManager = StorageManager.getInstance()
