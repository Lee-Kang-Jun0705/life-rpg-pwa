// AI 코치 관련 타입 정의

export interface GrowthAnalysis {
  statType: 'health' | 'learning' | 'relationship' | 'achievement'
  trend: 'improving' | 'stable' | 'declining'
  growthRate: number
  lastActive: Date
}

export interface ActivityPattern {
  averageActivitiesPerDay: number
  streakDays: number
  totalDays: number
  lastActivityDate: Date
  mostActiveTime?: string
  preferredActivity?: string
}

export interface PersonalizedAdvice {
  id: string
  category: 'health' | 'learning' | 'relationship' | 'achievement' | 'general'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  emoji: string
  createdAt: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AICoachResponse {
  message: string
  suggestions?: string[]
  emotionalSupport?: string
  nextSteps?: string[]
}
