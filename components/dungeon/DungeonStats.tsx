'use client'

import { DungeonStats as DungeonStatsType } from '@/lib/dungeon'
import { Card } from '@/components/ui/Card'

interface DungeonStatsProps {
  stats: DungeonStatsType | null
}

export function DungeonStats({ stats }: DungeonStatsProps) {
  if (!stats) return null

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">던전 통계</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-500">{stats.totalCompleted}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">완료한 던전</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">{stats.successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">성공률</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-500">{stats.currentStreak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">현재 연속</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-500">{stats.bestStreak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">최고 기록</div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <h4 className="font-semibold mb-3">누적 보상</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <div>
              <div className="font-semibold">{stats.totalRewardsEarned.exp}</div>
              <div className="text-gray-500">총 경험치</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <div>
              <div className="font-semibold">{stats.totalRewardsEarned.coins}</div>
              <div className="text-gray-500">총 코인</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <div>
              <div className="font-semibold">{stats.totalRewardsEarned.items}</div>
              <div className="text-gray-500">총 아이템</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}