'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { db } from '@/lib/database/client'
import { StatActionsConfig, DEFAULT_STAT_ACTIONS, StatAction } from '@/lib/types/stat-actions'
import { useDatabase } from '@/lib/hooks/useDatabase'

interface StatActionsContextType {
  statActions: StatActionsConfig
  updateAction: (statType: keyof StatActionsConfig, index: number, action: StatAction) => void
  addAction: (statType: keyof StatActionsConfig, action: StatAction) => void
  deleteAction: (statType: keyof StatActionsConfig, index: number) => void
  resetToDefault: (statType: keyof StatActionsConfig) => void
}

const StatActionsContext = createContext<StatActionsContextType | undefined>(undefined)

export function StatActionsProvider({ children }: { children: ReactNode }) {
  const [statActions, setStatActions] = useState<StatActionsConfig>(DEFAULT_STAT_ACTIONS)
  const isDatabaseReady = useDatabase()

  // DB에서 커스텀 액션 불러오기
  useEffect(() => {
    if (!isDatabaseReady) return

    const loadCustomActions = async () => {
      try {
        if (!db || !isDatabaseReady) return
        
        // 데이터베이스가 열려있는지 확인
        if (!db.isOpen()) {
          await db.open()
        }
        
        const setting = await db.playerData.get('custom_stat_actions')
        if (setting?.data && typeof setting.data === 'string') {
          setStatActions(JSON.parse(setting.data))
        }
      } catch (error) {
        // DexieError와 초기화 관련 에러는 무시
        if (error instanceof Error) {
          const ignorableErrors = [
            'DexieError',
            'Database not opened',
            'Cannot read properties of null',
            'db is null'
          ]
          
          const shouldIgnore = ignorableErrors.some(msg => 
            error.name === msg || error.message.includes(msg)
          )
          
          if (!shouldIgnore && process.env.NODE_ENV === 'development') {
            console.warn('[StatActions] Database not ready yet:', error.message)
          }
        }
      }
    }
    
    loadCustomActions()
  }, [isDatabaseReady])

  // DB에 저장
  const saveToDb = useCallback(async (actions: StatActionsConfig) => {
    // DB가 준비되지 않았으면 저장하지 않음
    if (!isDatabaseReady) {
      console.log('Database not ready, skipping save')
      return
    }
    
    try {
      if (!db) return
      await db.playerData.put({
        id: 'custom_stat_actions',
        data: JSON.stringify(actions),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to save custom actions:', error)
    }
  }, [isDatabaseReady])

  const updateAction = useCallback((statType: keyof StatActionsConfig, index: number, action: StatAction) => {
    setStatActions(prev => {
      const newActions = { ...prev }
      newActions[statType] = [...newActions[statType]]
      newActions[statType][index] = action
      saveToDb(newActions)
      return newActions
    })
  }, [saveToDb])

  const addAction = useCallback((statType: keyof StatActionsConfig, action: StatAction) => {
    setStatActions(prev => {
      const newActions = { ...prev }
      newActions[statType] = [...newActions[statType], action]
      saveToDb(newActions)
      return newActions
    })
  }, [saveToDb])

  const deleteAction = useCallback((statType: keyof StatActionsConfig, index: number) => {
    setStatActions(prev => {
      const newActions = { ...prev }
      newActions[statType] = newActions[statType].filter((_, i) => i !== index)
      saveToDb(newActions)
      return newActions
    })
  }, [saveToDb])

  const resetToDefault = useCallback((statType: keyof StatActionsConfig) => {
    setStatActions(prev => {
      const newActions = { ...prev }
      newActions[statType] = [...DEFAULT_STAT_ACTIONS[statType]]
      saveToDb(newActions)
      return newActions
    })
  }, [saveToDb])

  return (
    <StatActionsContext.Provider value={{
      statActions,
      updateAction,
      addAction,
      deleteAction,
      resetToDefault
    }}>
      {children}
    </StatActionsContext.Provider>
  )
}

export function useStatActions() {
  const context = useContext(StatActionsContext)
  if (context === undefined) {
    throw new Error('useStatActions must be used within a StatActionsProvider')
  }
  return context
}