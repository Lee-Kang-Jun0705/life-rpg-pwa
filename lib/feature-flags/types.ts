/**
 * Feature Flag 시스템 타입 정의
 */

export interface FeatureFlag {
  key: string
  name: string
  description: string
  defaultValue: boolean
  // 배포 단계
  rolloutPercentage?: number
  // 특정 사용자에게만 활성화
  enabledForUsers?: string[]
  // 특정 환경에서만 활성화
  enabledEnvironments?: Array<'development' | 'staging' | 'production'>
  // 활성화 시작/종료 시간
  startDate?: Date
  endDate?: Date
  // 의존성 플래그
  dependencies?: string[]
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>
  // A/B 테스트 설정
  experiments?: {
    [key: string]: {
      variants: Array<{
        name: string
        percentage: number
        flagOverrides: Record<string, boolean>
      }>
    }
  }
}

export interface FeatureFlagContext {
  userId?: string
  environment: 'development' | 'staging' | 'production'
  userAttributes?: Record<string, unknown>
}

export interface FeatureFlagProvider {
  isEnabled(flagKey: string, context?: FeatureFlagContext): boolean
  getAllFlags(context?: FeatureFlagContext): Record<string, boolean>
  updateFlag(flagKey: string, value: boolean): void
  reset(): void
}