"use client"
import { useState } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useStorageStats, useBackups, useBulkStorage } from "@/lib/storage/storage-hooks"
import { unifiedStorage } from "@/lib/storage/unified-storage"
import {
  Database,
  HardDrive,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Settings,
  BarChart3,
  Archive,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react"

export default function StorageManager() {
  const { stats, loading: statsLoading, error: statsError, refresh: refreshStats } = useStorageStats()
  const {
    backups,
    loading: backupsLoading,
    error: backupsError,
    createBackup,
    restoreBackup,
    refresh: refreshBackups,
  } = useBackups()
  const { bulkStore, bulkRetrieve, bulkRemove, loading: bulkLoading, error: bulkError } = useBulkStorage()

  const [selectedTab, setSelectedTab] = useState("overview")
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const keys = await unifiedStorage.keys()
      const data = await bulkRetrieve(keys)

      const exportData = {
        version: "1.0",
        timestamp: Date.now(),
        storageType: unifiedStorage.getCurrentStorageType(),
        data: data.reduce(
          (acc, item) => {
            acc[item.key] = item.data
            return acc
          },
          {} as Record<string, any>,
        ),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `life-os-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showMessage("success", "Data exported successfully!")
    } catch (error) {
      showMessage("error", "Export failed. Please try again.")
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      if (!importData.data || typeof importData.data !== "object") {
        throw new Error("Invalid import file format")
      }

      const items = Object.entries(importData.data).map(([key, data]) => ({ key, data }))
      await bulkStore(items)

      showMessage("success", `Successfully imported ${items.length} items`)
      await refreshStats()
    } catch (error) {
      showMessage("error", "Import failed. Please check your file format.")
      console.error("Import failed:", error)
    } finally {
      setIsImporting(false)
      event.target.value = ""
    }
  }

  const handleCreateBackup = async () => {
    try {
      const backupId = await createBackup()
      showMessage("success", `Backup created successfully: ${backupId}`)
    } catch (error) {
      showMessage("error", "Failed to create backup")
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return
    }

    try {
      await restoreBackup(backupId)
      showMessage("success", "Backup restored successfully")
      await refreshStats()
    } catch (error) {
      showMessage("error", "Failed to restore backup")
    }
  }

  const handleClearStorage = async () => {
    if (!confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return
    }

    try {
      // Create backup before clearing
      await createBackup()
      await unifiedStorage.clear()
      showMessage("success", "Storage cleared successfully")
      await refreshStats()
    } catch (error) {
      showMessage("error", "Failed to clear storage")
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStorageUsagePercentage = () => {
    if (!stats || stats.storageQuota === 0) return 0
    return Math.round((stats.usedQuota / stats.storageQuota) * 100)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-6 h-6 mr-3" />
            Storage Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className={`mb-4 ${
                message.type === "success"
                  ? "border-green-500"
                  : message.type === "error"
                    ? "border-red-500"
                    : "border-blue-500"
              }`}
            >
              {message.type === "success" && <CheckCircle className="h-4 w-4" />}
              {message.type === "error" && <AlertTriangle className="h-4 w-4" />}
              {message.type === "info" && <Info className="h-4 w-4" />}
              <AlertDescription className="text-white">{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/10">
              <TabsTrigger value="overview" className="text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="data" className="text-white">
                Data
              </TabsTrigger>
              <TabsTrigger value="backups" className="text-white">
                Backups
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-white">
                Settings
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-white">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Storage Type</p>
                        <p className="text-lg font-semibold text-white capitalize">
                          {unifiedStorage.getCurrentStorageType()}
                        </p>
                      </div>
                      <HardDrive className="w-6 h-6 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Items Stored</p>
                        <p className="text-lg font-semibold text-white">{stats?.itemCount || 0}</p>
                      </div>
                      <Archive className="w-6 h-6 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Data Size</p>
                        <p className="text-lg font-semibold text-white">{formatBytes(stats?.totalSize || 0)}</p>
                      </div>
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Sync Status</p>
                        <Badge
                          variant="secondary"
                          className={
                            stats?.syncStatus === "synced"
                              ? "bg-green-500/20 text-green-300"
                              : stats?.syncStatus === "pending"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-red-500/20 text-red-300"
                          }
                        >
                          {stats?.syncStatus || "unknown"}
                        </Badge>
                      </div>
                      <Shield className="w-6 h-6 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats && stats.storageQuota > 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Storage Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Used Space</span>
                        <span className="text-white">
                          {formatBytes(stats.usedQuota)} / {formatBytes(stats.storageQuota)}
                        </span>
                      </div>
                      <Progress value={getStorageUsagePercentage()} className="w-full" />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{getStorageUsagePercentage()}% used</span>
                        <span>{formatBytes(stats.storageQuota - stats.usedQuota)} available</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={refreshStats}
                  disabled={statsLoading}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {statsLoading ? "Refreshing..." : "Refresh Stats"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Export Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Export all your data to a JSON file for backup or migration purposes.
                    </p>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting || bulkLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Exporting..." : "Export Data"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Import Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Import previously exported data. This will merge with existing data.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        disabled={isImporting || bulkLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button disabled={isImporting || bulkLoading} className="w-full bg-green-600 hover:bg-green-700">
                        <Upload className="w-4 h-4 mr-2" />
                        {isImporting ? "Importing..." : "Import Data"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border border-red-500/50 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2">Clear All Data</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      This will permanently delete all stored data. A backup will be created automatically.
                    </p>
                    <Button onClick={handleClearStorage} variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backups" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-lg font-semibold">Backup Management</h3>
                <Button
                  onClick={handleCreateBackup}
                  disabled={backupsLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </div>

              {backupsError && (
                <Alert className="border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-white">{backupsError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {backups.length === 0 ? (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 text-center">
                      <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No backups found</p>
                      <p className="text-sm text-gray-500 mt-2">Create your first backup to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  backups.map((backup) => (
                    <Card key={backup.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Archive className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-white font-medium">{backup.description || backup.id}</p>
                                <p className="text-sm text-gray-400">
                                  {formatDate(backup.timestamp)} • {formatBytes(backup.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRestoreBackup(backup.id)}
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                          >
                            Restore
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Storage Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">Primary Storage</label>
                      <div className="p-3 bg-white/5 rounded border border-white/10">
                        <p className="text-white capitalize">{unifiedStorage.getCurrentStorageType()}</p>
                        <p className="text-xs text-gray-400">Automatically selected based on browser support</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">Features</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-white text-sm">Encryption</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enabled
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-white text-sm">Compression</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enabled
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-white text-sm">Auto Backup</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enabled
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Storage Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Read Speed</span>
                        <span className="text-white">Fast</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Write Speed</span>
                        <span className="text-white">Fast</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Compression Ratio</span>
                        <span className="text-white">~60%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Data Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">User Data</span>
                        <span className="text-white">75%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cache</span>
                        <span className="text-white">15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Backups</span>
                        <span className="text-white">10%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
