'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react'

export function RecordsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  // 기간 필터
  const periods = [
    { id: 'all', name: '전체' },
    { id: 'daily', name: '일일' },
    { id: 'weekly', name: '주간' },
    { id: 'monthly', name: '월간' }
  ]

  // 기록 데이터
  const records = {
    personal: [
      { label: '최고 레벨', value: 15, icon: '⭐' },
      { label: '총 활동 수', value: 342, icon: '📝' },
      { label: '연속 출석', value: 7, unit: '일', icon: '🔥' },
      { label: '총 전투 승리', value: 156, icon: '⚔️' },
      { label: '획득한 골드', value: '12.5K', icon: '💰' },
      { label: '완료한 업적', value: 24, icon: '🏆' }
    ],
    rankings: [
      { rank: 1, name: '전설의 용사', level: 42, score: 15420, change: 0 },
      { rank: 2, name: '마법사', level: 38, score: 14200, change: 1 },
      { rank: 3, name: '성기사', level: 36, score: 13800, change: -1 },
      { rank: 4, name: '암살자', level: 35, score: 13500, change: 2 },
      { rank: 5, name: '나 (You)', level: 15, score: 8200, change: 0, isMe: true },
      { rank: 6, name: '궁수', level: 32, score: 12900, change: -2 },
      { rank: 7, name: '전사', level: 30, score: 12100, change: 1 },
      { rank: 8, name: '성직자', level: 28, score: 11500, change: -1 }
    ],
    achievements: [
      { date: '2025-07-27', title: '레벨 15 달성!', type: 'level', icon: '🎉' },
      { date: '2025-07-26', title: '100번째 전투 승리', type: 'combat', icon: '⚔️' },
      { date: '2025-07-25', title: '7일 연속 출석', type: 'streak', icon: '🔥' },
      { date: '2025-07-24', title: '첫 레어 아이템 획득', type: 'item', icon: '💎' },
      { date: '2025-07-23', title: '친구 5명 달성', type: 'social', icon: '👥' }
    ]
  }

  // 랭킹 변화 표시
  const getRankChangeIcon = (change: number) => {
    if (change > 0) return '▲'
    if (change < 0) return '▼'
    return '－'
  }

  const getRankChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* 개인 기록 */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          나의 기록
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {records.personal.map((record, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-3xl mb-2">{record.icon}</div>
              <div className="text-2xl font-bold text-purple-600">
                {record.value}{record.unit || ''}
              </div>
              <div className="text-sm text-gray-600">{record.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 랭킹 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            전체 랭킹
          </h3>
          <div className="flex gap-2">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedPeriod === period.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {records.rankings.map((player) => (
            <div
              key={player.rank}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.isMe 
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500' 
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 순위 */}
                <div className={`text-2xl font-bold ${
                  player.rank === 1 ? 'text-yellow-500' :
                  player.rank === 2 ? 'text-gray-400' :
                  player.rank === 3 ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  #{player.rank}
                </div>
                
                {/* 플레이어 정보 */}
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-600">Lv.{player.level}</div>
                </div>
              </div>

              {/* 점수 및 변화 */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold">{player.score.toLocaleString()}</div>
                  <div className={`text-sm ${getRankChangeColor(player.change)}`}>
                    {getRankChangeIcon(player.change)} {Math.abs(player.change) || ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 최근 업적 */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          최근 활동
        </h3>
        <div className="space-y-3">
          {records.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <div className="font-semibold">{achievement.title}</div>
                <div className="text-sm text-gray-600">{achievement.date}</div>
              </div>
              <Badge variant="secondary">{achievement.type}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}