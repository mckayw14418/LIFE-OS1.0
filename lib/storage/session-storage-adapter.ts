export class SessionStorageAdapter {
  private prefix = "lifeOS_session_"

  async store(key: string, data: any): Promise<void> {
    try {
      const fullKey = this.prefix + key
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
      })

      sessionStorage.setItem(fullKey, serializedData)
      console.log(`SessionStorage: Stored ${key}`)
    } catch (error) {
      console.error(`SessionStorage: Failed to store ${key}:`, error)
      throw error
    }
  }

  async retrieve(key: string): Promise<any> {
    try {
      const fullKey = this.prefix + key
      const stored = sessionStorage.getItem(fullKey)

      if (!stored) {
        return null
      }

      const parsedData = JSON.parse(stored)
      return parsedData.data
    } catch (error) {
      console.error(`SessionStorage: Failed to retrieve ${key}:`, error)
      return null
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.prefix + key
      sessionStorage.removeItem(fullKey)
      console.log(`SessionStorage: Removed ${key}`)
    } catch (error) {
      console.error(`SessionStorage: Failed to remove ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys()
      for (const key of keys) {
        sessionStorage.removeItem(this.prefix + key)
      }
      console.log("SessionStorage: Cleared all data")
    } catch (error) {
      console.error("SessionStorage: Failed to clear data:", error)
      throw error
    }
  }

  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }

  async exists(key: string): Promise<boolean> {
    return sessionStorage.getItem(this.prefix + key) !== null
  }
}

export const sessionStorageAdapter = new SessionStorageAdapter()
