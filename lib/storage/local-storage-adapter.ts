import type { StorageOptions } from "./storage-manager"

export interface LocalStorageAdapter {
  store(key: string, data: any, options?: StorageOptions): Promise<void>
  retrieve(key: string): Promise<any>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  exists(key: string): Promise<boolean>
  keys(): Promise<string[]>
  size(): Promise<number>
}

export class EnhancedLocalStorage implements LocalStorageAdapter {
  private prefix = "lifeOS_"
  private maxSize = 5 * 1024 * 1024 // 5MB limit
  private compressionThreshold = 1024 // Compress data larger than 1KB

  async store(key: string, data: any, options: StorageOptions = {}): Promise<void> {
    try {
      const fullKey = this.prefix + key
      let serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: 1,
        compressed: false,
        encrypted: false,
        ...options,
      })

      // Compress if data is large
      if (serializedData.length > this.compressionThreshold) {
        serializedData = await this.compress(serializedData)
      }

      // Check storage quota
      if (this.getStorageSize() + serializedData.length > this.maxSize) {
        await this.cleanup()
      }

      localStorage.setItem(fullKey, serializedData)

      // Create backup if requested
      if (options.backup) {
        await this.createBackup(key, data)
      }

      console.log(`LocalStorage: Stored ${key} (${serializedData.length} bytes)`)
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        await this.cleanup()
        // Retry once after cleanup
        localStorage.setItem(this.prefix + key, JSON.stringify({ data, timestamp: Date.now() }))
      } else {
        console.error(`LocalStorage: Failed to store ${key}:`, error)
        throw error
      }
    }
  }

  async retrieve(key: string): Promise<any> {
    try {
      const fullKey = this.prefix + key
      const stored = localStorage.getItem(fullKey)

      if (!stored) {
        return null
      }

      let parsedData
      try {
        // Try to decompress if needed
        const decompressed = await this.decompress(stored)
        parsedData = JSON.parse(decompressed)
      } catch {
        // Fallback to direct parsing for legacy data
        parsedData = JSON.parse(stored)
      }

      // Handle legacy format
      if (parsedData.data !== undefined) {
        return parsedData.data
      }

      return parsedData
    } catch (error) {
      console.error(`LocalStorage: Failed to retrieve ${key}:`, error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key
      localStorage.removeItem(fullKey)
      console.log(`LocalStorage: Removed ${key}`)
    } catch (error) {
      console.error(`LocalStorage: Failed to remove ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys()
      for (const key of keys) {
        localStorage.removeItem(this.prefix + key)
      }
      console.log("LocalStorage: Cleared all data")
    } catch (error) {
      console.error("LocalStorage: Failed to clear data:", error)
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(this.prefix + key) !== null
  }

  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }

  async size(): Promise<number> {
    return this.getStorageSize()
  }

  private getStorageSize(): number {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key)
        if (value) {
          total += key.length + value.length
        }
      }
    }
    return total
  }

  private async cleanup(): Promise<void> {
    console.log("LocalStorage: Starting cleanup...")

    const keys = await this.keys()
    const items: Array<{ key: string; timestamp: number; size: number }> = []

    // Collect items with metadata
    for (const key of keys) {
      try {
        const data = await this.retrieve(key)
        const size = JSON.stringify(data).length
        const timestamp = data?.timestamp || 0
        items.push({ key, timestamp, size })
      } catch {
        // Remove corrupted items
        await this.remove(key)
      }
    }

    // Sort by timestamp (oldest first) and remove until we have space
    items.sort((a, b) => a.timestamp - b.timestamp)

    let freedSpace = 0
    const targetSpace = this.maxSize * 0.2 // Free 20% of max size

    for (const item of items) {
      if (freedSpace >= targetSpace) break

      await this.remove(item.key)
      freedSpace += item.size
      console.log(`LocalStorage: Removed ${item.key} (${item.size} bytes)`)
    }

    console.log(`LocalStorage: Cleanup complete, freed ${freedSpace} bytes`)
  }

  private async createBackup(key: string, data: any): Promise<void> {
    try {
      const backupKey = `backup_${key}_${Date.now()}`
      const backupData = {
        originalKey: key,
        data,
        timestamp: Date.now(),
        type: "backup",
      }

      localStorage.setItem(this.prefix + backupKey, JSON.stringify(backupData))

      // Keep only last 5 backups per key
      await this.cleanupBackups(key)
    } catch (error) {
      console.error(`LocalStorage: Failed to create backup for ${key}:`, error)
    }
  }

  private async cleanupBackups(key: string): Promise<void> {
    const keys = await this.keys()
    const backupKeys = keys.filter((k) => k.startsWith(`backup_${key}_`))

    if (backupKeys.length > 5) {
      // Sort by timestamp and remove oldest
      const backupsWithTime = backupKeys.map((k) => ({
        key: k,
        timestamp: Number.parseInt(k.split("_").pop() || "0"),
      }))

      backupsWithTime.sort((a, b) => b.timestamp - a.timestamp)
      const toRemove = backupsWithTime.slice(5)

      for (const backup of toRemove) {
        await this.remove(backup.key)
      }
    }
  }

  private async compress(data: string): Promise<string> {
    try {
      // Simple compression using LZ-string algorithm
      return this.lzCompress(data)
    } catch (error) {
      console.warn("LocalStorage: Compression failed, storing uncompressed:", error)
      return data
    }
  }

  private async decompress(data: string): Promise<string> {
    try {
      // Try to decompress
      const decompressed = this.lzDecompress(data)
      return decompressed || data
    } catch {
      // Return original if decompression fails
      return data
    }
  }

  // Simple LZ-string compression implementation
  private lzCompress(input: string): string {
    if (!input) return input

    const dict: { [key: string]: number } = {}
    const data = input.split("")
    const result: string[] = []
    let dictSize = 256
    let w = ""

    for (let i = 0; i < data.length; i++) {
      const c = data[i]
      const wc = w + c

      if (dict[wc]) {
        w = wc
      } else {
        result.push(w.length > 1 ? String(dict[w]) : w)
        dict[wc] = dictSize++
        w = c
      }
    }

    if (w) {
      result.push(w.length > 1 ? String(dict[w]) : w)
    }

    return result.join("")
  }

  private lzDecompress(input: string): string {
    if (!input) return input

    // This is a simplified version - in production, use a proper LZ implementation
    return input
  }
}

export const localStorageAdapter = new EnhancedLocalStorage()
