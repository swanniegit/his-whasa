import React, { createContext, useContext, useEffect, useState } from 'react'

interface OfflineContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingChanges: number
  lastSyncTime: Date | null
  syncData: () => Promise<void>
  addPendingChange: () => void
  removePendingChange: () => void
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

interface OfflineProviderProps {
  children: React.ReactNode
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      syncData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial sync
    if (isOnline) {
      syncData()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const syncData = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    
    try {
      // TODO: Implement actual sync logic with IndexedDB
      // This will sync pending changes to Supabase
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setLastSyncTime(new Date())
      setPendingChanges(0)
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const addPendingChange = () => {
    setPendingChanges(prev => prev + 1)
  }

  const removePendingChange = () => {
    setPendingChanges(prev => Math.max(0, prev - 1))
  }

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    pendingChanges,
    lastSyncTime,
    syncData,
    addPendingChange,
    removePendingChange,
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
} 