import React from 'react'
import { LevelUpCelebration } from '@/components/ui/LevelUpCelebration'

interface DashboardLayoutProps {
  children: React.ReactNode
  _levelUpData?: {
    show: boolean
    level: number
    statType: string
  } | null
  onLevelUpComplete: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  _levelUpData,
  onLevelUpComplete
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-candy-yellow/20 via-candy-pink/20 to-candy-blue/20 p-3 md:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>

      {/* 레벨업 축하 애니메이션 */}
      {_levelUpData && (
        <LevelUpCelebration
          show={_levelUpData.show}
          level={_levelUpData.level}
          statType={_levelUpData.statType}
          onComplete={onLevelUpComplete}
        />
      )}
    </div>
  )
}
