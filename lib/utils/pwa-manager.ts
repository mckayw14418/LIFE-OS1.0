export interface ScheduledNotification {
  id: string
  title: string
  body: string
  scheduledTime: number
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  status?: "scheduled" | "shown" | "cancelled"
  createdAt?: number
  shownAt?: number
  cancelledAt?: number
}

export interface InstallationStatus {
  isInstalled: boolean
  isStandalone: boolean
  canInstall: boolean
}

export interface ServiceWorkerStatus {
  isRegistered: boolean
  isActive: boolean
  version: string | null
}

export default class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {
    this.initialize()
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  private async initialize() {
    if (typeof window === "undefined") return

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      window.dispatchEvent(new CustomEvent("pwa-install-available"))
    })

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null
      window.dispatchEvent(new CustomEvent("pwa-installed"))
    })

    // Register service worker with proper configuration
    if ("serviceWorker" in navigator) {
      try {
        // Wait for page load before registering
        if (document.readyState === "loading") {
          window.addEventListener("load", () => {
            this.registerServiceWorker()
          })
        } else {
          this.registerServiceWorker()
        }
      } catch (error) {
        console.error("Service Worker initialization failed:", error)
      }
    }
  }

  private async registerServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none", // Always check for updates
      })

      console.log("Service Worker registered successfully:", this.registration.scope)

      // Listen for updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration!.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              window.dispatchEvent(new CustomEvent("pwa-update-available"))
            }
          })
        }
      })

      // Check for updates periodically
      setInterval(() => {
        this.registration?.update()
      }, 60000) // Check every minute
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }

  getInstallationStatus(): InstallationStatus {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    return {
      isInstalled: isStandalone,
      isStandalone: isStandalone,
      canInstall: !!this.deferredPrompt,
    }
  }

  getServiceWorkerStatus(): ServiceWorkerStatus {
    return {
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      version: null, // Will be populated by service worker message
    }
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice

      if (outcome === "accepted") {
        this.deferredPrompt = null
        return true
      }

      return false
    } catch (error) {
      console.error("Install prompt failed:", error)
      return false
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Notifications not supported")
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async testNotification(title = "Test Notification", body = "This is a test notification!"): Promise<boolean> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(true)
        } else {
          reject(new Error(event.data.error || "Test notification failed"))
        }
      }

      this.registration!.active!.postMessage(
        {
          type: "TEST_NOTIFICATION",
          title,
          body,
        },
        [messageChannel.port2],
      )
    })
  }

  async testNotificationViaAPI(notificationData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      })

      return response.ok
    } catch (error) {
      console.error("API notification test failed:", error)
      return false
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    options: NotificationOptions = {},
  ): Promise<string> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    const notification: ScheduledNotification = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      scheduledTime: scheduledTime.getTime(),
      ...options,
      status: "scheduled",
      createdAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.id)
        } else {
          reject(new Error(event.data.error))
        }
      }

      this.registration!.active!.postMessage(
        {
          type: "SCHEDULE_NOTIFICATION",
          data: notification,
        },
        [messageChannel.port2],
      )
    })
  }

  cancelScheduledNotification(id: string): boolean {
    if (!this.registration?.active) {
      return false
    }

    try {
      this.registration.active.postMessage({
        type: "CANCEL_NOTIFICATION",
        data: { id },
      })
      return true
    } catch (error) {
      console.error("Failed to cancel notification:", error)
      return false
    }
  }

  getScheduledNotifications(): ScheduledNotification[] {
    // This would typically fetch from IndexedDB via service worker
    // For now, return empty array as placeholder
    return []
  }

  async checkForUpdates(): Promise<void> {
    if (!this.registration) {
      throw new Error("Service Worker not registered")
    }

    try {
      await this.registration.update()
      console.log("Checked for service worker updates")
    } catch (error) {
      console.error("Failed to check for updates:", error)
      throw error
    }
  }

  async clearCache(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log("All caches cleared")
    }
  }

  // Update the service worker registration
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error("Service Worker not registered")
    }

    const newWorker = this.registration.waiting
    if (newWorker) {
      newWorker.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }
}

export const pwaManager = PWAManager.getInstance()

// Initialize PWA Manager when the module loads
if (typeof window !== "undefined") {
  // Ensure proper service worker registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }
}
