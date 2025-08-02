'use client'

import React, { memo, useMemo } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/lib/settings/settings-context'
import { ShopProvider } from '@/lib/shop/shop-context'
import { DungeonProvider } from '@/lib/dungeon/dungeon-context'
import { LeaderboardProvider } from '@/lib/leaderboard/leaderboard-context'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { PerformanceProvider } from '@/lib/performance/performance-context'
import { CharacterProvider } from '@/lib/character/character-context'
import { EmotionProvider } from '@/contexts/EmotionContext'
import { StatActionsProvider } from '@/contexts/StatActionsContext'

interface CombinedProviderProps {
  children: React.ReactNode
}

// Provider 그룹을 나누어 관리
const CoreProviders = memo(({ children }: { children: React.ReactNode }) => (
  <I18nProvider>
    <PerformanceProvider>
      <ThemeProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </PerformanceProvider>
  </I18nProvider>
))
CoreProviders.displayName = 'CoreProviders'

const GameProviders = memo(({ children }: { children: React.ReactNode }) => (
  <CharacterProvider>
    <EmotionProvider>
      <StatActionsProvider>
        {children}
      </StatActionsProvider>
    </EmotionProvider>
  </CharacterProvider>
))
GameProviders.displayName = 'GameProviders'

const FeatureProviders = memo(({ children }: { children: React.ReactNode }) => (
  <ShopProvider>
    <DungeonProvider>
      <LeaderboardProvider>
        {children}
      </LeaderboardProvider>
    </DungeonProvider>
  </ShopProvider>
))
FeatureProviders.displayName = 'FeatureProviders'

// 모든 Provider를 계층적으로 구성
export const CombinedProvider = memo(({ children }: CombinedProviderProps) => {
  // Provider 구조를 메모이제이션하여 불필요한 리렌더링 방지
  const providers = useMemo(() => (
    <CoreProviders>
      <GameProviders>
        <FeatureProviders>
          {children}
        </FeatureProviders>
      </GameProviders>
    </CoreProviders>
  ), [children])

  return providers
})

CombinedProvider.displayName = 'CombinedProvider'
