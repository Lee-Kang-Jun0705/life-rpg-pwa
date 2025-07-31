import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CharacterProvider } from '@/lib/character/character-context'
import { ShopProvider } from '@/lib/shop/shop-context'
import { SettingsProvider } from '@/lib/settings/settings-context'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { ToastProvider } from '@/components/ui/Toast'
import { DungeonProvider } from '@/lib/dungeon/dungeon-context'
import { LeaderboardProvider } from '@/lib/leaderboard/leaderboard-context'
import { initialAppearance } from '@/lib/character/character-types'

// Mock 데이터
const mockCharacterData = {
  id: 'test-character',
  userId: 'test-user',
  name: 'Test Character',
  level: 1,
  experience: 0,
  health: 100,
  maxHealth: 100,
  stats: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    charisma: 10
  },
  inventory: [],
  gold: 100,
  appearance: initialAppearance,
  achievements: [],
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockSettings = {
  userId: 'test-user',
  theme: 'light' as const,
  language: 'ko',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    dailyReminder: true,
    reminderTime: '09:00'
  },
  privacy: {
    shareProfile: true,
    showStats: true,
    allowFriendRequests: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

interface AllTheProvidersProps {
  children: ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <SettingsProvider initialSettings={mockSettings}>
            <CharacterProvider initialCharacter={mockCharacterData}>
              <ShopProvider>
                <DungeonProvider>
                  <LeaderboardProvider>
                    {children}
                  </LeaderboardProvider>
                </DungeonProvider>
              </ShopProvider>
            </CharacterProvider>
          </SettingsProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock helper 함수들
export const createMockCharacter = (overrides?: Partial<typeof mockCharacterData>) => ({
  ...mockCharacterData,
  ...overrides
})

export const createMockSettings = (overrides?: Partial<typeof mockSettings>) => ({
  ...mockSettings,
  ...overrides
})

// IndexedDB mock 설정
export const setupIndexedDBMocks = () => {
  const mockDB = {
    characters: {
      toArray: jest.fn().mockResolvedValue([mockCharacterData]),
      get: jest.fn().mockResolvedValue(mockCharacterData),
      add: jest.fn().mockResolvedValue('test-character'),
      put: jest.fn().mockResolvedValue('test-character'),
      delete: jest.fn().mockResolvedValue(undefined)
    },
    settings: {
      toArray: jest.fn().mockResolvedValue([mockSettings]),
      get: jest.fn().mockResolvedValue(mockSettings),
      add: jest.fn().mockResolvedValue('test-settings'),
      put: jest.fn().mockResolvedValue('test-settings')
    },
    stats: {
      toArray: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue('test-stat')
    },
    activities: {
      toArray: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue('test-activity')
    }
  }

  return mockDB
}

// 날짜 모킹 헬퍼
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString)
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
  return mockDate
}

// 네비게이션 모킹 헬퍼
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
}

export const mockPathname = '/dashboard'
export const mockSearchParams = new URLSearchParams()