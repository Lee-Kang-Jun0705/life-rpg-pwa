export type LeaderboardCategory = 'overall' | 'health' | 'learning' | 'relationship' | 'achievement' | 'dungeons'

export interface LeaderboardEntry {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rank: number
  score: number
  level: number
  previousRank?: number
  stats?: {
    health: number
    learning: number
    relationship: number
    achievement: number
  }
  dungeonStats?: {
    completed: number
    successRate: number
  }
  lastActivityDate: Date
}

export interface LeaderboardFilter {
  category: LeaderboardCategory
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'all-time'
}

export interface LeaderboardData {
  category: LeaderboardCategory
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'all-time'
  entries: LeaderboardEntry[]
  lastUpdated: Date
  userRank?: number // 현재 사용자의 순위
}

export interface LeaderboardStats {
  totalPlayers: number
  activeToday: number
  topPerformers: {
    daily: LeaderboardEntry | null
    weekly: LeaderboardEntry | null
    monthly: LeaderboardEntry | null
  }
}
