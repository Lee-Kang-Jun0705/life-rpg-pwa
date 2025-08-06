/**
 * Feature Flag 시스템 메인 엔트리
 */

export * from './types'
export * from './config'
export * from './provider'
export * from './react'

// 간편한 사용을 위한 유틸리티
import { getFeatureFlagProvider } from './provider'

export function isFeatureEnabled(flagKey: string): boolean {
  const provider = getFeatureFlagProvider()
  return provider.isEnabled(flagKey)
}

export function getFeatureFlags(): Record<string, boolean> {
  const provider = getFeatureFlagProvider()
  return provider.getAllFlags()
}