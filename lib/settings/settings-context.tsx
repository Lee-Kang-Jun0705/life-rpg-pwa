'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Settings, DEFAULT_SETTINGS } from './types'
import { profileRepository } from '@/lib/offline/repositories'
import { errorManager } from '@/lib/error/error-manager'
import { safeLocalStorage, safeJSONParse } from '@/lib/utils/ssr'

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => Promise<void>
  resetSettings: () => Promise<void>
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const SETTINGS_KEY = 'life-rpg-settings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // 설정 로드
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async() => {
    try {
      // 로컬 스토리지에서 먼저 확인
      const savedSettings = safeLocalStorage.getItem(SETTINGS_KEY)
      const parsed = safeJSONParse<Partial<Settings> | null>(savedSettings, null)

      if (parsed && typeof parsed === 'object') {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : new Date()
        })
      }

      // IndexedDB에서 프로필 정보 로드 (로컬 사용자)
      const userId = 'local-user' // 오프라인 PWA이므로 로컬 사용자 ID 사용
      const profile = await profileRepository.findOneByUserId(userId)

      if (profile) {
        setSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            displayName: profile.name || '',
            email: profile.email || 'local@liferpg.app',
            photoURL: profile.avatar,
            bio: (profile as unknown).bio
          }
        }))
      }
    } catch (error) {
      errorManager.logError(error as Error, { context: 'loadSettings' })
      errorManager.notifyUser('설정을 불러오는 중 오류가 발생했습니다', 'warning')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async(updates: Partial<Settings>) => {
    try {
      const newSettings = {
        ...settings,
        ...updates,
        lastUpdated: new Date()
      }

      // 로컬 스토리지에 저장
      safeLocalStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))

      // 프로필 변경사항은 IndexedDB에도 저장
      if (updates.profile) {
        const userId = 'local-user'
        await profileRepository.updateByUserId(userId, {
          name: updates.profile.displayName,
          avatar: updates.profile.photoURL
        } as unknown)
      }

      setSettings(newSettings)

      // 언어 변경 시 처리 (실제로는 i18n 라이브러리 사용)
      if (updates.general?.language) {
        console.log('Language changed to:', updates.general.language)
      }

    } catch (error) {
      errorManager.logError(error as Error, {
        context: 'updateSettings',
        updatesJson: JSON.stringify(updates)
      })
      errorManager.notifyUser('설정 저장에 실패했습니다', 'error')
      throw error
    }
  }

  const resetSettings = async() => {
    try {
      safeLocalStorage.removeItem(SETTINGS_KEY)
      setSettings(DEFAULT_SETTINGS)
    } catch (error) {
      errorManager.logError(error as Error, { context: 'resetSettings' })
      errorManager.notifyUser('설정 초기화에 실패했습니다', 'error')
      throw error
    }
  }


  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
