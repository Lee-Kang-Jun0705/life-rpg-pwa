/**
 * 설정 관련 타입 정의
 */

// AI 코치 모델 타입
export type AICoachModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro' | 'custom'

// AI 코치 톤/스타일
export type AICoachTone = 'friendly' | 'strict' | 'humorous' | 'mentor' | 'cheerleader'

// 언어 설정
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ar' | 'hi' | 'th' | 'vi' | 'id'

// 테마 설정
export type Theme = 'light' | 'dark' | 'system'

// AI 코치 설정
export interface AICoachSettings {
  enabled: boolean
  model: AICoachModel
  apiKey: string
  tone: AICoachTone
  customPrompt?: string
  dailyReminders: boolean
  motivationalMessages: boolean
  progressAnalysis: boolean
}

// 스탯 커스텀 설정
export interface StatCustomization {
  id: string // 고유 ID 추가
  type: 'health' | 'learning' | 'relationship' | 'achievement'
  name: string
  emoji: string
  color: string
  order: number
  enabled: boolean
}

// 알림 설정
export interface NotificationSettings {
  enabled: boolean
  dailyReminder: {
    enabled: boolean
    time: string // HH:mm format
  }
  achievementAlerts: boolean
  weeklyReport: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

// 백업 설정
export interface BackupSettings {
  autoBackup: boolean
  backupInterval: 'daily' | 'weekly' | 'monthly'
  lastBackupDate?: Date
  encryptBackup: boolean
}

// 접근성 설정
export interface AccessibilitySettings {
  largeText: boolean
  highContrast: boolean
  reduceMotion: boolean
  screenReaderOptimized: boolean
}

// 전체 설정
export interface Settings {
  // 프로필
  profile: {
    displayName: string
    email: string
    photoURL?: string
    bio?: string
  }

  // AI 코치
  aiCoach: AICoachSettings

  // 스탯 커스터마이징
  statCustomizations: StatCustomization[]

  // 일반 설정
  general: {
    language: Language
    soundEffects: boolean
  }

  // 알림
  notifications: NotificationSettings

  // 백업
  backup: BackupSettings

  // 접근성
  accessibility: AccessibilitySettings

  // 개인정보
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
    analyticsEnabled: boolean
  }

  // 버전 정보
  version: string
  lastUpdated: Date
}

// 기본 설정값
export const DEFAULT_SETTINGS: Settings = {
  profile: {
    displayName: '',
    email: ''
  },
  aiCoach: {
    enabled: false,
    model: 'gpt-3.5-turbo',
    apiKey: '',
    tone: 'friendly',
    dailyReminders: true,
    motivationalMessages: true,
    progressAnalysis: true
  },
  statCustomizations: [
    { id: 'stat-health-001', type: 'health', name: '건강', emoji: '💪', color: 'red', order: 0, enabled: true },
    { id: 'stat-learning-002', type: 'learning', name: '학습', emoji: '📚', color: 'blue', order: 1, enabled: true },
    { id: 'stat-relationship-003', type: 'relationship', name: '관계', emoji: '🤝', color: 'green', order: 2, enabled: true },
    { id: 'stat-achievement-004', type: 'achievement', name: '성취', emoji: '🏆', color: 'yellow', order: 3, enabled: true }
  ],
  general: {
    language: 'ko',
    soundEffects: true
  },
  notifications: {
    enabled: true,
    dailyReminder: {
      enabled: true,
      time: '09:00'
    },
    achievementAlerts: true,
    weeklyReport: true,
    soundEnabled: true,
    vibrationEnabled: true
  },
  backup: {
    autoBackup: true,
    backupInterval: 'weekly',
    encryptBackup: true
  },
  accessibility: {
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false
  },
  privacy: {
    shareProgress: false,
    publicProfile: false,
    analyticsEnabled: false
  },
  version: '1.0.0',
  lastUpdated: new Date()
}
