'use client'

import { useState } from 'react'
import { Quest } from '@/lib/types/quest'
import { QuestCard } from './QuestCard'
import { QuestDetails } from './QuestDetails'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestListProps {
  quests: Quest[]
  title: string
  emptyMessage?: string
}

export function QuestList({ quests, title, emptyMessage = "퀘스트가 없습니다" }: QuestListProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'in_progress' | 'completed'>('all')

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') return true
    if (filter === 'available') return quest.status === 'available'
    if (filter === 'in_progress') return quest.status === 'in_progress'
    if (filter === 'completed') return quest.status === 'completed' || quest.status === 'claimed'
    return true
  })

  const filterOptions = [
    { value: 'all' as const, label: '전체' },
    { value: 'available' as const, label: '수행 가능' },
    { value: 'in_progress' as const, label: '진행 중' },
    { value: 'completed' as const, label: '완료됨' }
  ]

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        
        {/* 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full transition-colors",
                  filter === option.value
                    ? "bg-purple-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 퀘스트 목록 */}
      {filteredQuests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClick={() => setSelectedQuest(quest)}
              isActive={selectedQuest?.id === quest.id}
            />
          ))}
        </div>
      )}

      {/* 퀘스트 상세 모달 */}
      {selectedQuest && (
        <QuestDetails
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
        />
      )}
    </div>
  )
}