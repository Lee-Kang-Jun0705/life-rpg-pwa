import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Stat, StatType, calculateProgress, calculateLevelDetails } from '@/lib/types/dashboard'

interface StatCardProps {
  statType: StatType
  stat: Stat | undefined
  isProcessing: boolean
  onClick: (statType: string) => void
}

export const StatCard = React.memo(function StatCard({ statType, stat, isProcessing, onClick }: StatCardProps) {
  // 메모이재이션된 계산값들
  const levelDetails = useMemo(() => calculateLevelDetails(stat?.experience || 0), [stat?.experience])
  const progress = useMemo(() => calculateProgress(stat?.experience || 0), [stat?.experience])
  const level = useMemo(() => levelDetails.level, [levelDetails])
  const currentExp = useMemo(() => levelDetails.currentLevelExp, [levelDetails])
  const nextLevelExp = useMemo(() => levelDetails.nextLevelExp, [levelDetails])

  const touchStartRef = useRef<number>(0)
  const touchEndRef = useRef<number>(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // 콜백 최적화
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
    touchEndRef.current = e.touches[0].clientX // 초기화
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const swipeDistance = touchEndRef.current - touchStartRef.current
    const minSwipeDistance = 50 // 최소 스와이프 거리

    if (Math.abs(swipeDistance) > minSwipeDistance && !isProcessing) {
      // 스와이프 감지 시 클릭 이벤트 트리거
      onClick(statType.type)

      // 시각적 피드백
      if (cardRef.current) {
        cardRef.current.classList.add('animate-pulse')
        setTimeout(() => {
          cardRef.current?.classList.remove('animate-pulse')
        }, 500)
      }
    }

    touchStartRef.current = 0
    touchEndRef.current = 0
  }, [isProcessing, onClick, statType.type])

  const handleClick = useCallback(() => {
    onClick(statType.type)
  }, [onClick, statType.type])

  return (
    <div
      ref={cardRef}
      className="relative group"
      data-testid="stat-card"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Button
        onClick={handleClick}
        variant={statType.variant}
        size="xl"
        disabled={isProcessing}
        className="w-full h-auto p-6 flex-col relative overflow-hidden transform transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {/* 진행도 배경 */}
        <div
          className="absolute inset-0 bg-white bg-opacity-20 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />

        <div className="relative z-10">
          <div className="text-4xl mb-2">{statType.emoji}</div>
          <div className="font-bold text-lg">{statType.name}</div>
          <div className="text-sm mt-2 opacity-90">
            <span>Lv.</span>
            <span>{level}</span>
          </div>
          <div className="text-xs opacity-75">
            <span>{currentExp}/{nextLevelExp}</span>
            <span> EXP</span>
          </div>

          {/* 진행도 바 */}
          <div className="w-full bg-black bg-opacity-20 rounded-full h-2 mt-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Button>

      {/* 호버 효과 - 클릭/스와이프 힌트 */}
      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity animate-pulse">
        +
      </div>

      {/* 스와이프 안내 (모바일) */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          ← 스와이프 →
        </span>
      </div>
    </div>
  )
})

// 메모이제이션을 위한 비교 함수
StatCard.displayName = 'StatCard'
