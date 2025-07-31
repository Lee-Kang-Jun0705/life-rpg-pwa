'use client'

import { Button } from '@/components/ui/Button'
import { LeaderboardCategory, LeaderboardFilter as FilterType } from '@/lib/leaderboard'

interface LeaderboardFilterProps {
  currentFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function LeaderboardFilter({ currentFilter, onFilterChange }: LeaderboardFilterProps) {
  const categories: { value: LeaderboardCategory; label: string; icon: string }[] = [
    { value: 'overall', label: '종합', icon: '🏅' },
    { value: 'health', label: '건강', icon: '❤️' },
    { value: 'learning', label: '학습', icon: '📚' },
    { value: 'relationship', label: '관계', icon: '🤝' },
    { value: 'achievement', label: '성취', icon: '🏆' },
    { value: 'dungeons', label: '던전', icon: '⚔️' }
  ]

  const timeFrames: { value: 'daily' | 'weekly' | 'monthly' | 'all-time'; label: string }[] = [
    { value: 'daily', label: '일간' },
    { value: 'weekly', label: '주간' },
    { value: 'monthly', label: '월간' },
    { value: 'all-time', label: '전체' }
  ]

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
          카테고리
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.value}
              variant={currentFilter.category === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...currentFilter, category: category.value })}
              className="gap-1"
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 기간 필터 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
          기간
        </h3>
        <div className="flex gap-2">
          {timeFrames.map(timeFrame => (
            <Button
              key={timeFrame.value}
              variant={currentFilter.timeFrame === timeFrame.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ ...currentFilter, timeFrame: timeFrame.value })}
            >
              {timeFrame.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}