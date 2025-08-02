'use client'

import React, { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Core Providers - 앱 전체에서 필수적인 Provider들
import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nProvider } from '@/lib/i18n/i18n-context'
import { SettingsProvider } from '@/lib/settings/settings-context'
import { PerformanceProvider } from '@/lib/performance/performance-context'

// Game Core Providers - 게임 핵심 기능
import { CharacterProvider } from '@/lib/character/character-context'
import { EmotionProvider } from '@/contexts/EmotionContext'
import { StatActionsProvider } from '@/contexts/StatActionsContext'

// Feature Providers - 동적으로 로드 가능한 기능들
const ShopProvider = dynamic(
  () => import('@/lib/shop/shop-context').then(mod => ({ default: mod.ShopProvider })),
  { ssr: false }
)

const DungeonProvider = dynamic(
  () => import('@/lib/dungeon/dungeon-context').then(mod => ({ default: mod.DungeonProvider })),
  { ssr: false }
)

const LeaderboardProvider = dynamic(
  () => import('@/lib/leaderboard/leaderboard-context').then(mod => ({ default: mod.LeaderboardProvider })),
  { ssr: false }
)

interface AppProvidersProps {
  children: React.ReactNode
}

// 필수 Provider들을 하나로 통합
const EssentialProviders = memo(({ children }: { children: React.ReactNode }) => (
  <I18nProvider>
    <PerformanceProvider>
      <ThemeProvider>
        <SettingsProvider>
          <CharacterProvider>
            <EmotionProvider>
              <StatActionsProvider>
                {children}
              </StatActionsProvider>
            </EmotionProvider>
          </CharacterProvider>
        </SettingsProvider>
      </ThemeProvider>
    </PerformanceProvider>
  </I18nProvider>
))
EssentialProviders.displayName = 'EssentialProviders'

// 동적 Provider들을 Suspense로 감싸서 로딩 최적화
const DynamicProviders = memo(({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>
    <ShopProvider>
      <DungeonProvider>
        <LeaderboardProvider>
          {children}
        </LeaderboardProvider>
      </DungeonProvider>
    </ShopProvider>
  </Suspense>
))
DynamicProviders.displayName = 'DynamicProviders'

// 최종 통합 Provider
export const AppProviders = memo(({ children }: AppProvidersProps) => (
  <EssentialProviders>
    <DynamicProviders>
      {children}
    </DynamicProviders>
  </EssentialProviders>
))

AppProviders.displayName = 'AppProviders'

// 특정 기능에만 필요한 Provider들을 위한 HOC
export function withFeatureProvider<P extends object>(
  Component: React.ComponentType<P>,
  Provider: React.ComponentType<{ children: React.ReactNode }>
) {
  const WithProvider = (props: P) => (
    <Provider>
      <Component {...props} />
    </Provider>
  )

  WithProvider.displayName = `withProvider(${Component.displayName || Component.name})`

  return WithProvider
}
