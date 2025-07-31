'use client'

import { useState, useEffect, useCallback } from 'react'
import { dbHelpers, waitForDatabase } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'

interface DbStatus {
  loading?: boolean
  hasDB?: boolean
  name?: string
  version?: number
  tables?: string[]
  databases?: IDBDatabaseInfo[]
  error?: string
}

interface UserDataStatus {
  loading?: boolean
  userId?: string
  hasProfile?: boolean
  profile?: unknown
  statsCount?: number
  stats?: Array<{ type: string; level: number; experience: number }>
  error?: string
}

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<DbStatus>({ loading: true })
  const [userDataStatus, setUserDataStatus] = useState<UserDataStatus>({ loading: true })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkDatabase()
  }, [checkDatabase])

  const checkDatabase = useCallback(async () => {
    try {
      console.log('🔍 Checking database...')
      
      // 1. IndexedDB 존재 확인
      const hasIndexedDB = 'indexedDB' in window
      console.log('Has IndexedDB:', hasIndexedDB)
      
      if (!hasIndexedDB) {
        setDbStatus({ error: 'IndexedDB not supported' })
        return
      }

      // 2. 데이터베이스 열기 시도
      const dbName = 'LifeRPGDatabase'
      const databases = await indexedDB.databases?.() || []
      console.log('Available databases:', databases)
      
      // 3. Dexie 데이터베이스 확인
      try {
        const db = await waitForDatabase()
        console.log('Dexie DB instance:', db)
        const dbInstance = db as { name: string; verno: number; tables?: Array<{ name: string }> }
        console.log('DB name:', dbInstance.name)
        console.log('DB version:', dbInstance.verno)
        console.log('DB tables:', dbInstance.tables?.map((t) => t.name) || [])
        
        setDbStatus({
          loading: false,
          hasDB: true,
          name: dbInstance.name,
          version: dbInstance.verno,
          tables: dbInstance.tables?.map((t) => t.name) || [],
          databases
        })
        
        // 4. 사용자 데이터 확인
        await checkUserData()
      } catch (dbError) {
        console.error('Failed to get DB:', dbError)
        setDbStatus({
          loading: false,
          hasDB: false,
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        })
      }
    } catch (err) {
      console.error('Database check error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setDbStatus({
        loading: false,
        error: errorMessage
      })
    }
  }, [checkUserData])

  const checkUserData = useCallback(async () => {
    try {
      const userId = GAME_CONFIG.DEFAULT_USER_ID
      console.log('Checking user data for:', userId)
      
      // 프로필 확인
      const profile = await dbHelpers.getProfile(userId)
      console.log('Profile:', profile)
      
      // 스탯 확인
      const stats = await dbHelpers.getStats(userId)
      console.log('Stats:', stats)
      
      setUserDataStatus({
        loading: false,
        userId,
        hasProfile: !!profile,
        profile,
        statsCount: stats.length,
        stats: stats.map(s => ({
          type: s.type,
          level: s.level,
          experience: s.experience
        }))
      })
    } catch (err) {
      console.error('User data check error:', err)
      setUserDataStatus({
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }, [])

  const initializeUserData = async () => {
    try {
      const userId = GAME_CONFIG.DEFAULT_USER_ID
      console.log('Initializing user data...')
      
      await dbHelpers.initializeUserData(userId, 'test@example.com', 'Test User')
      console.log('User data initialized!')
      
      // 다시 확인
      await checkUserData()
    } catch (err) {
      console.error('Initialize error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const clearDatabase = async () => {
    try {
      console.log('Clearing database...')
      const db = await waitForDatabase()
      const dbInstance = db as { delete: () => Promise<void>; open: () => Promise<void> }
      await dbInstance.delete()
      await dbInstance.open()
      console.log('Database cleared!')
      
      // 다시 확인
      await checkDatabase()
    } catch (err) {
      console.error('Clear database error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Database Debug Page</h1>
      
      {error && (
        <div className="bg-red-900 border border-red-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <pre className="text-sm">{error}</pre>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Database Status */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          {dbStatus.loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(dbStatus, null, 2)}
            </pre>
          )}
        </div>
        
        {/* User Data Status */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">User Data Status</h2>
          {userDataStatus.loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(userDataStatus, null, 2)}
            </pre>
          )}
        </div>
        
        {/* Actions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={checkDatabase}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Refresh Status
            </button>
            
            <button
              onClick={initializeUserData}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Initialize User Data
            </button>
            
            <button
              onClick={clearDatabase}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Clear Database
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}