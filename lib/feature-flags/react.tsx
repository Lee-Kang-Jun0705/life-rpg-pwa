'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FeatureFlagProvider, FeatureFlagContext } from './types'
import { getFeatureFlagProvider } from './provider'

/**
 * React용 Feature Flag Hook 및 Provider
 */

interface FeatureFlagReactContext {
  provider: FeatureFlagProvider
  flags: Record<string, boolean>
  isEnabled: (flagKey: string) => boolean
  updateFlag: (flagKey: string, value: boolean) => void
  reset: () => void
}

const FeatureFlagContext = createContext<FeatureFlagReactContext | undefined>(undefined)

interface FeatureFlagProviderProps {
  children: ReactNode
  context?: FeatureFlagContext
}

export function FeatureFlagsProvider({ children, context }: FeatureFlagProviderProps) {
  const provider = getFeatureFlagProvider()
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // 초기 플래그 로드
    const allFlags = provider.getAllFlags(context)
    setFlags(allFlags)
  }, [context])

  const isEnabled = (flagKey: string) => {
    return provider.isEnabled(flagKey, context)
  }

  const updateFlag = (flagKey: string, value: boolean) => {
    provider.updateFlag(flagKey, value)
    // 플래그 상태 업데이트
    const allFlags = provider.getAllFlags(context)
    setFlags(allFlags)
  }

  const reset = () => {
    provider.reset()
    const allFlags = provider.getAllFlags(context)
    setFlags(allFlags)
  }

  const value: FeatureFlagReactContext = {
    provider,
    flags,
    isEnabled,
    updateFlag,
    reset
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

/**
 * Feature Flag를 사용하는 Hook
 */
export function useFeatureFlag(flagKey: string): boolean {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagsProvider')
  }
  
  return context.flags[flagKey] ?? false
}

/**
 * 여러 Feature Flag를 한번에 가져오는 Hook
 */
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider')
  }
  
  const result: Record<string, boolean> = {}
  flagKeys.forEach(key => {
    result[key] = context.flags[key] ?? false
  })
  
  return result
}

/**
 * Feature Flag 관리용 Hook (개발 환경)
 */
export function useFeatureFlagAdmin() {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlagAdmin must be used within FeatureFlagsProvider')
  }
  
  return {
    flags: context.flags,
    updateFlag: context.updateFlag,
    reset: context.reset
  }
}

/**
 * Feature Flag에 따라 조건부 렌더링하는 컴포넌트
 */
interface FeatureProps {
  flag: string
  children: ReactNode
  fallback?: ReactNode
}

export function Feature({ flag, children, fallback = null }: FeatureProps) {
  const isEnabled = useFeatureFlag(flag)
  
  if (isEnabled) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

/**
 * A/B 테스트용 컴포넌트
 */
interface ABTestProps {
  experiment: string
  variants: {
    [key: string]: ReactNode
  }
}

export function ABTest({ experiment, variants }: ABTestProps) {
  const flags = useFeatureFlags(Object.keys(variants))
  
  // 활성화된 variant 찾기
  for (const [variant, content] of Object.entries(variants)) {
    if (flags[variant]) {
      return <>{content}</>
    }
  }
  
  // 기본값 반환 (control)
  return <>{variants.control || null}</>
}