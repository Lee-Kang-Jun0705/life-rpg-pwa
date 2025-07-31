'use client'

import { LeaderboardEntry as LeaderboardEntryType } from '@/lib/leaderboard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType
  isCurrentUser?: boolean
}

export function LeaderboardEntry({ entry, isCurrentUser }: LeaderboardEntryProps) {
  // 순위에 따른 메달 아이콘
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  // 순위 변동 표시
  const getRankChange = () => {
    if (!entry.previousRank) return null
    
    const change = entry.previousRank - entry.rank
    if (change > 0) {
      return (
        <div className="flex items-center text-green-500 text-sm">
          <span>▲</span>
          <span className="ml-1">{change}</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-500 text-sm">
          <span>▼</span>
          <span className="ml-1">{Math.abs(change)}</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-gray-400 text-sm">
          <span>-</span>
        </div>
      )
    }
  }

  return (
    <Card className={`p-4 ${isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 순위 */}
          <div className="text-center min-w-[50px]">
            {getRankIcon(entry.rank) ? (
              <div className="text-2xl">{getRankIcon(entry.rank)}</div>
            ) : (
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                #{entry.rank}
              </div>
            )}
          </div>

          {/* 아바타와 이름 */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">{entry.userAvatar || '👤'}</div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {entry.userName}
                {isCurrentUser && (
                  <Badge variant="primary" size="sm">나</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Lv.{entry.level}
              </div>
            </div>
          </div>
        </div>

        {/* 점수와 순위 변동 */}
        <div className="flex items-center gap-4">
          {getRankChange()}
          <div className="text-right">
            <div className="text-2xl font-bold">{entry.score.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">점</div>
          </div>
        </div>
      </div>

      {/* 스탯 정보 (선택적으로 표시) */}
      {entry.stats && (
        <div className="mt-3 pt-3 border-t dark:border-gray-700">
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="text-red-500">❤️ {entry.stats.health}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-500">📚 {entry.stats.learning}</div>
            </div>
            <div className="text-center">
              <div className="text-green-500">🤝 {entry.stats.relationship}</div>
            </div>
            <div className="text-center">
              <div className="text-purple-500">🏆 {entry.stats.achievement}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}