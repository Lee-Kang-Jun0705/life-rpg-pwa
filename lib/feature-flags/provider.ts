import { FeatureFlagProvider, FeatureFlagContext, FeatureFlag } from './types'
import { featureFlagConfig, getFeatureFlagOverrides } from './config'

/**
 * Feature Flag Provider 구현
 */
export class DefaultFeatureFlagProvider implements FeatureFlagProvider {
  private overrides: Record<string, boolean> = {}
  private cache: Map<string, boolean> = new Map()

  constructor() {
    // 환경 변수 오버라이드 로드
    this.overrides = getFeatureFlagOverrides()
    
    // 로컬 스토리지에서 오버라이드 로드 (개발 환경)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        const stored = localStorage.getItem('feature-flag-overrides')
        if (stored) {
          this.overrides = { ...this.overrides, ...JSON.parse(stored) }
        }
      } catch (error) {
        console.error('Failed to load feature flag overrides:', error)
      }
    }
  }

  isEnabled(flagKey: string, context?: FeatureFlagContext): boolean {
    // 캐시 확인
    const cacheKey = this.getCacheKey(flagKey, context)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // 오버라이드 확인
    if (this.overrides[flagKey] !== undefined) {
      const result = this.overrides[flagKey]
      this.cache.set(cacheKey, result)
      return result
    }

    // 플래그 설정 가져오기
    const flag = featureFlagConfig.flags[flagKey]
    if (!flag) {
      console.warn(`Feature flag not found: ${flagKey}`)
      return false
    }

    // 플래그 평가
    const result = this.evaluateFlag(flag, context)
    this.cache.set(cacheKey, result)
    return result
  }

  getAllFlags(context?: FeatureFlagContext): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    
    Object.keys(featureFlagConfig.flags).forEach(key => {
      result[key] = this.isEnabled(key, context)
    })
    
    return result
  }

  updateFlag(flagKey: string, value: boolean): void {
    this.overrides[flagKey] = value
    
    // 캐시 무효화
    this.cache.clear()
    
    // 개발 환경에서는 로컬 스토리지에 저장
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('feature-flag-overrides', JSON.stringify(this.overrides))
      } catch (error) {
        console.error('Failed to save feature flag overrides:', error)
      }
    }
  }

  reset(): void {
    this.overrides = getFeatureFlagOverrides()
    this.cache.clear()
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      localStorage.removeItem('feature-flag-overrides')
    }
  }

  private evaluateFlag(flag: FeatureFlag, context?: FeatureFlagContext): boolean {
    const ctx = context || this.getDefaultContext()

    // 환경 체크
    if (flag.enabledEnvironments && !flag.enabledEnvironments.includes(ctx.environment)) {
      return false
    }

    // 날짜 체크
    const now = new Date()
    if (flag.startDate && now < flag.startDate) {
      return false
    }
    if (flag.endDate && now > flag.endDate) {
      return false
    }

    // 특정 사용자 체크
    if (flag.enabledForUsers && ctx.userId) {
      if (flag.enabledForUsers.includes(ctx.userId)) {
        return true
      }
    }

    // 의존성 체크
    if (flag.dependencies) {
      for (const dep of flag.dependencies) {
        if (!this.isEnabled(dep, context)) {
          return false
        }
      }
    }

    // 롤아웃 퍼센티지 체크
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(ctx.userId || 'anonymous')
      const bucket = hash % 100
      return bucket < flag.rolloutPercentage
    }

    return flag.defaultValue
  }

  private getDefaultContext(): FeatureFlagContext {
    return {
      environment: (process.env.NODE_ENV || 'development') as any,
      userId: this.getCurrentUserId()
    }
  }

  private getCurrentUserId(): string | undefined {
    // 실제 구현에서는 사용자 스토어에서 가져오기
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }

  private getCacheKey(flagKey: string, context?: FeatureFlagContext): string {
    const ctx = context || this.getDefaultContext()
    return `${flagKey}:${ctx.userId || 'anonymous'}:${ctx.environment}`
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// 싱글톤 인스턴스
let instance: DefaultFeatureFlagProvider | null = null

export function getFeatureFlagProvider(): FeatureFlagProvider {
  if (!instance) {
    instance = new DefaultFeatureFlagProvider()
  }
  return instance
}