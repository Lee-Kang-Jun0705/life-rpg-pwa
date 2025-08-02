export type PersonalizationMode = 'light' | 'pro'

export interface PersonalizationSettings {
  mode: PersonalizationMode
  preferences: UserPreferences
  storagePolicy: StoragePolicy
  lastUpdated: Date
}

export interface UserPreferences {
  // 코칭 스타일
  coachingStyle: {
    directness: number      // 1-10: 1=부드럽게, 10=직설적으로
    detailLevel: number     // 1-10: 1=간단히, 10=자세히
    emotionalSupport: number // 1-10: 감정적 지원 정도
  }

  // 선호하는 피드백
  feedbackPreferences: {
    tone: 'supportive' | 'challenging' | 'balanced'
    frequency: 'minimal' | 'moderate' | 'frequent'
    format: 'text' | 'visual' | 'mixed'
  }

  // 민감한 주제
  sensitivities: string[]

  // 주요 목표
  primaryGoal: string
  secondaryGoals: string[]
}

export interface StoragePolicy {
  maxStorageMB: number
  activityHistoryDays: number
  interactionHistoryCount: number
  patternUpdateFrequency: 'realtime' | 'daily' | 'weekly'
  dataGranularity: 'basic' | 'detailed'
}

// 라이트 모드 데이터
export interface LightModeData {
  timestamp: Date
  type: string
  quality: string
  completed: boolean
  context: {
    hour: number
    dayOfWeek: number
  }
}

// 프로 모드 데이터
export interface ProModeData extends LightModeData {
  fullDescription: string
  duration?: number
  location?: string
  tags?: string[]

  detailedContext: {
    weather?: string
    previousActivity?: string
    energyLevel?: number
    mood?: string
    socialContext?: string
    deviceInfo?: string
  }

  media?: {
    photos?: string[]
    photoAnalysis?: string
  }

  metrics?: {
    heartRate?: number
    caloriesBurned?: number
    distanceCovered?: number
    repsCompleted?: number
  }
}

// 패턴 분석 결과
export interface LightPatterns {
  basicStats: {
    avgActivitiesPerDay: number
    topActivities: string[]
    bestTimeSlot: string
    completionRate: number
  }

  simplePatterns: {
    morningPerson: boolean
    weekendWarrior: boolean
    consistencyScore: number
  }

  basicRecommendations: {
    nextBestTime: string
    suggestedActivity: string
    motivationTip: string
  }
}

export interface ProPatterns extends LightPatterns {
  advancedStats: {
    hourlyHeatmap: Record<number, number>
    weeklyProgressTrend: number[]
    seasonalPatterns: string[]
    correlations: Record<string, number>
  }

  deepPatterns: {
    activitySequences: string[][]
    contextualSuccess: Record<string, number>
    burnoutPrediction: number
    plateauDetection: boolean
    motivationCycles: string[]
    stressPatterns: string[]
  }

  proInsights: {
    yearlyGrowthCurve: number[]
    skillProgressionMap: Record<string, number>
    personalRecords: Record<string, number | string | Date>
    futureProjections: Record<string, number>
  }

  precisionRecommendations: {
    microAdjustments: string[]
    personalizedPrograms: Array<{
      name: string
      description: string
      duration: number
      activities: string[]
    }>
    recoveryProtocol: string
    challengeCalibration: number
  }
}

// 저장 공간 사용량
export interface StorageUsage {
  totalMB: number
  activityDataMB: number
  patternDataMB: number
  mediaDataMB: number
  breakdown: {
    activities: number
    interactions: number
    patterns: number
    media: number
  }
}

// 모드별 설정 상수
export const MODE_CONFIGS = {
  light: {
    maxStorageMB: 10,
    activityHistoryDays: 30,
    interactionHistoryCount: 100,
    patternUpdateFrequency: 'weekly' as const,
    dataGranularity: 'basic' as const
  },
  pro: {
    maxStorageMB: 100,
    activityHistoryDays: 365,
    interactionHistoryCount: 1000,
    patternUpdateFrequency: 'realtime' as const,
    dataGranularity: 'detailed' as const
  }
} as const
