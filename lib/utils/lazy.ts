import { lazy, ComponentType, ReactElement } from 'react'
import React from 'react'

// 동적 import 헬퍼 함수들
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(importFn)
}

// 페이지 컴포넌트들을 lazy loading으로 감싸기
export const LazyComponents = {
  // 주요 페이지들
  Dashboard: lazy(() => import('@/app/dashboard/page')),
  Profile: lazy(() => import('@/app/profile/page')),
  Ranking: lazy(() => import('@/app/ranking/page')),
  Achievements: lazy(() => import('@/app/achievements/page')),
  Equipment: lazy(() => import('@/app/equipment/page')),
  Collection: lazy(() => import('@/app/collection/page')),
  Dungeon: lazy(() => import('@/app/dungeon/page')),
  Battle: lazy(() => import('@/app/battle/page')),
  Shop: lazy(() => import('@/app/shop/page')),
  AICoach: lazy(() => import('@/app/ai-coach/page')),
  Daily: lazy(() => import('@/app/daily/page')),
  Settings: lazy(() => import('@/app/settings/page')),

  // 복잡한 컴포넌트들
  CharacterCustomization: lazy(() => 
    import('@/components/character/CharacterCustomizationModal').then(m => ({ default: m.CharacterCustomizationModal }))
  ),
  DungeonDetail: lazy(() => 
    import('@/components/dungeon/DungeonDetailModal').then(m => ({ 
      default: (m as Record<string, ComponentType>).DungeonDetailModal || (m as { default: ComponentType }).default 
    }))
  ),
  AchievementDetail: lazy(() => 
    import('@/components/achievements/AchievementDetailModal').then(m => ({ 
      default: (m as Record<string, ComponentType>).AchievementDetailModal || (m as { default: ComponentType }).default 
    }))
  ),
  VoiceInput: lazy(() => 
    import('@/components/voice/EnhancedVoiceInput').then(m => ({ 
      default: (m as Record<string, ComponentType>).EnhancedVoiceInput || (m as { default: ComponentType }).default 
    }))
  ),
}

// 에러 바운더리와 함께 사용할 수 있는 래퍼
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ComponentType<{ error: Error }>
) {
  return function WrappedComponent(props: P): ReactElement {
    try {
      return React.createElement(Component, props)
    } catch (error) {
      if (fallback) {
        return React.createElement(fallback, { error: error as Error })
      }
      throw error
    }
  }
}

// Suspense와 함께 사용할 로딩 컴포넌트
export const DefaultLoader = (): ReactElement => 
  React.createElement('div', 
    { className: "flex items-center justify-center min-h-[200px]" },
    React.createElement('div', { 
      className: "animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" 
    })
  )

// 페이지별 최적화된 로더들
export const PageLoaders = {
  Dashboard: (): ReactElement => 
    React.createElement('div', 
      { className: "p-4 space-y-4" },
      React.createElement('div', { 
        className: "h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
      }),
      React.createElement('div', 
        { className: "grid grid-cols-2 gap-4" },
        ...Array.from({ length: 4 }, (_, i) => 
          React.createElement('div', {
            key: i,
            className: "h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          })
        )
      )
    ),
  
  Profile: (): ReactElement => 
    React.createElement('div', 
      { className: "p-4 space-y-4" },
      React.createElement('div', 
        { className: "flex items-center space-x-4" },
        React.createElement('div', { 
          className: "w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" 
        }),
        React.createElement('div', 
          { className: "space-y-2" },
          React.createElement('div', { 
            className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" 
          }),
          React.createElement('div', { 
            className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" 
          })
        )
      )
    ),
  
  Default: DefaultLoader,
}