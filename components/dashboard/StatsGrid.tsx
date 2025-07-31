import React from 'react'
import { Stat, StatType } from '@/lib/types/dashboard'
import { StatActionCard } from './StatActionCard'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'

interface StatsGridProps {
  statTypes: StatType[]
  stats: Stat[]
  isProcessing: Set<string>
  onStatAction: (_statType: string, _action: string) => void
}

export const StatsGrid = React.memo(function StatsGrid({ 
  statTypes, 
  stats, 
  isProcessing, 
  onStatAction 
}: StatsGridProps) {
  return (
    <SectionErrorBoundary sectionName="스탯 카드">
      <div className="mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">스탯 올리기</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        {statTypes.map((statType, index) => {
          const stat = stats.find(s => s.type === statType.type)
          return (
            <div
              key={statType.id}
              className="animate-bounce-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <StatActionCard
                statType={statType}
                stat={stat}
                isProcessing={isProcessing.has(statType.type)}
                onAction={onStatAction}
              />
            </div>
          )
        })}
      </div>
    </SectionErrorBoundary>
  )
})