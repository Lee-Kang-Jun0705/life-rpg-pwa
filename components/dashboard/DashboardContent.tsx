import React from 'react'
import { STAT_TYPES } from '@/lib/types/dashboard'
import { StatsOverview } from './StatsOverview'
import { SectionErrorBoundary } from '@/components/ErrorBoundary'
import { DashboardHeader } from './DashboardHeader'
import { StatsGrid } from './StatsGrid'
import { ActivitySummary } from './ActivitySummary'
import type { Stat } from '@/lib/types/dashboard'
import type { CalculatedStats } from '@/hooks/useDashboard/types'

interface DashboardContentProps {
  stats: Stat[]
  _calculatedStats: CalculatedStats
  _isProcessing: Set<string>
  onStatAction: (_statType: string, _action: string) => void
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  stats,
  calculatedStats,
  isProcessing,
  onStatAction
}) => {
  return (
    <>
      {/* 게임적 헤더 */}
      <DashboardHeader />

      {/* 프로그레스 요약 */}
      <SectionErrorBoundary sectionName="통계 요약">
        <StatsOverview stats={calculatedStats} />
      </SectionErrorBoundary>

      {/* 스탯 버튼들 */}
      <StatsGrid
        statTypes={STAT_TYPES}
        stats={stats}
        isProcessing={isProcessing}
        onStatAction={onStatAction}
      />

      {/* 활동 요약 */}
      <ActivitySummary totalActivities={calculatedStats.totalActivities} />
    </>
  )
}
