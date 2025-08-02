export interface GrowthAnalysis {
  statType: string
  growthRate: number
  trend: 'improving' | 'stable' | 'declining'
  lastActivityDate: Date | null
  totalActivities: number
  suggestions: string[]
}

export interface ActivityPattern {
  mostActiveTime: string
  averageActivitiesPerDay: number
  streakDays: number
  mostFrequentActivity: string
  weakDays: string[]
}

export interface PersonalizedAdvice {
  type: 'strength' | 'weakness' | 'opportunity' | 'habit'
  title: string
  description: string
  actionItems: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChartDataPoint {
  date: string
  health: number
  learning: number
  relationship: number
  achievement: number
  total: number
}

export interface RadarDataPoint {
  stat: string
  level: number
  fullMark: number
}
