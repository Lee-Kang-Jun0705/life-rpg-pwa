'use client'

import { Card } from '@/components/ui/Card'
import { LeaderboardStats as StatsType } from '@/lib/leaderboard'

interface LeaderboardStatsProps {
  stats: StatsType | null
}

export function LeaderboardStats({ stats }: LeaderboardStatsProps) {
  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 전체 플레이어 수 */}
      <Card className="p-6 text-center">
        <div className="text-4xl mb-2">👥</div>
        <div className="text-3xl font-bold">{stats.totalPlayers}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          전체 플레이어
        </div>
      </Card>

      {/* 오늘 활동한 플레이어 */}
      <Card className="p-6 text-center">
        <div className="text-4xl mb-2">🔥</div>
        <div className="text-3xl font-bold">{stats.activeToday}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          오늘 활동
        </div>
      </Card>

      {/* 최고 기록 보유자 */}
      <Card className="p-6">
        <div className="text-lg font-semibold mb-3">🏆 최고 기록</div>
        <div className="space-y-2 text-sm">
          {stats.topPerformers.daily && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">일간</span>
              <span className="font-medium flex items-center gap-1">
                <span>{stats.topPerformers.daily.userAvatar}</span>
                <span>{stats.topPerformers.daily.userName}</span>
              </span>
            </div>
          )}
          {stats.topPerformers.weekly && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">주간</span>
              <span className="font-medium flex items-center gap-1">
                <span>{stats.topPerformers.weekly.userAvatar}</span>
                <span>{stats.topPerformers.weekly.userName}</span>
              </span>
            </div>
          )}
          {stats.topPerformers.monthly && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">월간</span>
              <span className="font-medium flex items-center gap-1">
                <span>{stats.topPerformers.monthly.userAvatar}</span>
                <span>{stats.topPerformers.monthly.userName}</span>
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
