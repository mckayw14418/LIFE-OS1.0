# Life OS Storage System Documentation

## Overview

The Life OS storage system provides a comprehensive, multi-layered approach to data persistence with support for IndexedDB, localStorage, and sessionStorage. The system automatically selects the best available storage mechanism and provides fallback options for maximum compatibility.

## Architecture

### Core Components

1. **StorageManager** - Primary IndexedDB-based storage with advanced features
2. **LocalStorageAdapter** - Enhanced localStorage with compression and cleanup
3. **SessionStorageAdapter** - Temporary session-based storage
4. **UnifiedStorage** - Unified interface that automatically selects the best storage
5. **Storage Hooks** - React hooks for easy integration

### Storage Hierarchy

\`\`\`
UnifiedStorage (Auto-detection)
├── IndexedDB (Primary) - Full features
├── localStorage (Fallback) - Basic persistence
└── sessionStorage (Temporary) - Session only
\`\`\`

## Features

### 🔐 Security
- **AES-GCM Encryption**: Client-side encryption for sensitive data
- **Key Management**: Automatic encryption key generation and storage
- **Data Isolation**: Prefixed keys to prevent conflicts

### 🗜️ Compression
- **Automatic Compression**: Data larger than 1KB is automatically compressed
- **Gzip Compression**: Uses native browser compression APIs
- **Size Optimization**: Reduces storage footprint by ~60%

### 💾 Backup System
- **Automatic Backups**: Optional backup creation on data changes
- **Versioned Backups**: Keep multiple backup versions
- **Restore Functionality**: Easy backup restoration
- **Cleanup**: Automatic removal of old backups

### 🔄 Synchronization
- **Sync Queue**: Track changes for remote synchronization
- **Offline Support**: Queue operations when offline
- **Conflict Resolution**: Handle sync conflicts gracefully

### 📊 Analytics
- **Storage Stats**: Monitor usage, quota, and performance
- **Performance Metrics**: Track read/write speeds
- **Usage Analytics**: Understand data distribution

## Usage Examples

### Basic Storage Operations

\`\`\`typescript
import { unifiedStorage } from '@/lib/storage/unified-storage'

// Store data
await unifiedStorage.store('user-profile', {
  name: 'John Doe',
  preferences: { theme: 'dark' }
})

// Retrieve data
const profile = await unifiedStorage.retrieve('user-profile')

// Remove data
await unifiedStorage.remove('user-profile')

// Check if data exists
const exists = await unifiedStorage.exists('user-profile')
\`\`\`

### Advanced Options

\`\`\`typescript
// Store with encryption and backup
await unifiedStorage.store('sensitive-data', data, {
  encrypt: true,
  backup: true,
  compress: true,
  sync: true
})

// Bulk operations
const items = [
  { key: 'item1', data: { value: 1 } },
  { key: 'item2', data: { value: 2 } }
]
await bulkStore(items)
\`\`\`

### React Hooks

\`\`\`typescript
import { useStorage, useStorageStats, useBackups } from '@/lib/storage/storage-hooks'

function MyComponent() {
  // Persistent state with automatic storage
  const { value, setValue, loading, error } = useStorage('my-data', defaultValue)
  
  // Storage statistics
  const { stats, refresh } = useStorageStats()
  
  // Backup management
  const { backups, createBackup, restoreBackup } = useBackups()
  
  return (
    <div>
      {loading ? 'Loading...' : (
        <input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
        />
      )}
    </div>
  )
}
\`\`\`

## Configuration

### Storage Configuration

\`\`\`typescript
import { UnifiedStorage } from '@/lib/storage/unified-storage'

const storage = UnifiedStorage.getInstance({
  primaryStorage: 'indexeddb',     // Primary storage type
  fallbackStorage: 'localstorage', // Fallback storage
  enableEncryption: true,          // Enable encryption
  enableCompression: true,         // Enable compression
  enableBackups: true,             // Enable automatic backups
  enableSync: false,               // Enable sync queue
  cacheTimeout: 3600000           // Cache timeout (1 hour)
})
\`\`\`

### Storage Types

- **`indexeddb`** - Full-featured database with transactions, indexes, and large storage capacity
- **`localstorage`** - Simple key-value storage with 5-10MB limit
- **`sessionstorage`** - Temporary storage that clears when tab closes
- **`auto`** - Automatically detect and use the best available storage

## Data Types and Schema

### User Data Schema

\`\`\`typescript
interface StoredData {
  id: string                    // Unique identifier
  type: DataType               // Data category
  data: any                    // Actual data
  timestamp: number            // Creation timestamp
  version: number              // Schema version
  encrypted?: boolean          // Encryption flag
}

type DataType = 'profile' | 'stats' | 'habits' | 'todos' | 
                'journal' | 'checkIns' | 'settings' | 'goals'
\`\`\`

### Cache Schema

\`\`\`typescript
interface CacheEntry {
  key: string                  // Cache key
  data: any                   // Cached data
  timestamp: number           // Cache creation time
  expires: number             // Expiration timestamp
  tags?: string[]             // Cache tags for bulk operations
}
\`\`\`

### Backup Schema

\`\`\`typescript
interface BackupEntry {
  id: string                  // Backup identifier
  timestamp: number           // Backup creation time
  data: string               // Compressed backup data
  size: number               // Backup size in bytes
  compressed: boolean        // Compression flag
  description?: string       // Optional description
}
\`\`\`

## Performance Optimization

### Caching Strategy

- **Automatic Caching**: Frequently accessed data is cached in memory
- **TTL Support**: Configurable time-to-live for cache entries
- **Tag-based Invalidation**: Bulk cache invalidation by tags
- **LRU Eviction**: Least recently used items are evicted first

### Compression

- **Threshold-based**: Only compress data larger than 1KB
- **Gzip Algorithm**: Native browser compression for best performance
- **Transparent**: Automatic compression/decompression

### Cleanup

- **Automatic Cleanup**: Remove expired cache entries and old backups
- **Quota Management**: Prevent storage quota exceeded errors
- **Garbage Collection**: Clean up orphaned data

## Error Handling

### Storage Errors

\`\`\`typescript
try {
  await unifiedStorage.store('key', data)
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle storage quota exceeded
    console.log('Storage quota exceeded')
  } else if (error.name === 'DataError') {
    // Handle data corruption
    console.log('Data corruption detected')
  }
}
\`\`\`

### Fallback Strategy

1. **Primary Storage Fails**: Automatically switch to fallback storage
2. **Encryption Fails**: Store data unencrypted with warning
3. **Compression Fails**: Store data uncompressed
4. **Backup Fails**: Continue with main operation, log error

## Security Considerations

### Encryption

- **Client-side Only**: All encryption happens in the browser
- **AES-GCM**: Industry-standard encryption algorithm
- **Key Storage**: Encryption keys stored in localStorage
- **No Server Keys**: No encryption keys sent to server

### Data Protection

- **Local Storage**: Data never leaves the user's device
- **Secure Contexts**: Requires HTTPS for full functionality
- **Key Rotation**: Support for encryption key rotation
- **Data Sanitization**: Automatic data sanitization on storage

## Migration and Versioning

### Schema Versioning

\`\`\`typescript
// Version 1 to 2 migration
const migrations = {
  2: (data: any) => {
    // Transform data from v1 to v2
    return {
      ...data,
      version: 2,
      newField: 'default-value'
    }
  }
}
\`\`\`

### Data Migration

- **Automatic Migration**: Detect and migrate old data formats
- **Backward Compatibility**: Support for multiple schema versions
- **Safe Migration**: Create backups before migration
- **Rollback Support**: Ability to rollback failed migrations

## Monitoring and Analytics

### Storage Statistics

\`\`\`typescript
const stats = await unifiedStorage.getStats()
console.log({
  totalSize: stats.totalSize,        // Total data size
  itemCount: stats.itemCount,        // Number of items
  storageQuota: stats.storageQuota,  // Available quota
  usedQuota: stats.usedQuota,        // Used quota
  syncStatus: stats.syncStatus       // Sync status
})
\`\`\`

### Performance Metrics

- **Read/Write Speed**: Monitor storage performance
- **Compression Ratio**: Track compression effectiveness
- **Cache Hit Rate**: Monitor cache performance
- **Error Rates**: Track storage errors

## Best Practices

### Data Organization

1. **Use Descriptive Keys**: `user-profile-123` instead of `up123`
2. **Namespace Data**: Prefix keys by feature (`habits-`, `todos-`)
3. **Version Data**: Include version information in stored data
4. **Normalize Data**: Avoid deeply nested objects

### Performance

1. **Batch Operations**: Use bulk operations for multiple items
2. **Cache Frequently Used Data**: Cache user preferences, settings
3. **Compress Large Data**: Enable compression for large objects
4. **Clean Up Regularly**: Remove unused data and expired cache

### Security

1. **Encrypt Sensitive Data**: Enable encryption for personal information
2. **Validate Data**: Validate data before storage and after retrieval
3. **Handle Errors Gracefully**: Provide fallbacks for storage failures
4. **Monitor Usage**: Track storage usage and quota

## Troubleshooting

### Common Issues

1. **Quota Exceeded**: Enable automatic cleanup or increase cleanup frequency
2. **Data Corruption**: Implement data validation and backup restoration
3. **Performance Issues**: Enable compression and caching
4. **Sync Conflicts**: Implement conflict resolution strategies

### Debug Mode

\`\`\`typescript
// Enable debug logging
localStorage.setItem('lifeOS_debug_storage', 'true')

// View storage statistics
console.log(await unifiedStorage.getStats())

// List all stored keys
console.log(await unifiedStorage.keys())
\`\`\`

## API Reference

### UnifiedStorage Methods

- `store(key, data, options?)` - Store data
- `retrieve(key)` - Retrieve data
- `remove(key)` - Remove data
- `clear()` - Clear all data
- `exists(key)` - Check if key exists
- `keys()` - Get all keys
- `getStats()` - Get storage statistics
- `createBackup()` - Create backup
- `restoreBackup(id)` - Restore backup
- `listBackups()` - List all backups

### Storage Options

\`\`\`typescript
interface StorageOptions {
  encrypt?: boolean      // Enable encryption
  compress?: boolean     // Enable compression
  ttl?: number          // Time to live (cache only)
  backup?: boolean      // Create backup
  sync?: boolean        // Add to sync queue
}
\`\`\`

### React Hooks

- `useStorage(key, defaultValue)` - Persistent state hook
- `useStorageStats()` - Storage statistics hook
- `useBackups()` - Backup management hook
- `useBulkStorage()` - Bulk operations hook

This documentation provides a comprehensive guide to the Life OS storage system. For additional support or questions, please refer to the source code or create an issue in the project repository.
