import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Stat, StatType, calculateProgress, calculateLevelDetails } from '@/lib/types/dashboard'
import { GradientClass } from '@/lib/types/ui'
import { StatActionModal } from './StatActionModal'

interface StatActionCardProps {
  statType: StatType
  stat: Stat | undefined
  isProcessing: boolean
  onAction: (statType: string, action: string) => void
}

export const StatActionCard = React.memo(function StatActionCard({ 
  statType, 
  stat, 
  isProcessing, 
  onAction 
}: StatActionCardProps) {
  const levelDetails = calculateLevelDetails(stat?.experience || 0)
  const progress = calculateProgress(stat?.experience || 0)
  const [showModal, setShowModal] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // 그라데이션 클래스 매핑
  const gradientClasses: Record<string, GradientClass> = {
    health: 'gradient-health',
    learning: 'gradient-learning',
    relationship: 'gradient-relationship',
    achievement: 'gradient-achievement',
  } as const

  const handleClick = useCallback(() => {
    if (!isProcessing) {
      setShowModal(true)
    }
  }, [isProcessing])

  const handleAction = useCallback((action: string) => {
    onAction(statType.type, action)
    
    // 시각적 피드백
    if (cardRef.current) {
      cardRef.current.classList.add('animate-rubber-band')
      setTimeout(() => {
        cardRef.current?.classList.remove('animate-rubber-band')
      }, 800)
    }
  }, [onAction, statType.type])

  return (
    <>
      <div 
        ref={cardRef}
        data-testid="stat-card"
        className={`relative group touch-none select-none transition-transform duration-200 ${isPressed ? 'scale-95' : ''}`}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
      >
        <div className={`w-full h-auto min-h-[140px] md:min-h-[200px] p-4 md:p-8 rounded-[2.5rem] relative overflow-hidden transform transition-all duration-300 hover:scale-105 ${gradientClasses[statType.type]} shadow-[0_8px_0_rgba(0,0,0,0.2),0_12px_25px_rgba(0,0,0,0.15)] ${isPressed ? 'shadow-[0_4px_0_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.15)] translate-y-[4px]' : ''} ${isProcessing ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}>
          <Button
            onClick={handleClick}
            variant="ghost"
            size="xl"
            disabled={isProcessing}
            className="w-full h-full p-0 bg-transparent hover:bg-transparent border-0 shadow-none rounded-none"
          >
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 text-6xl md:text-8xl rotate-12">✨</div>
              <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-5xl md:text-6xl -rotate-12">⭐</div>
            </div>
            
            
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-5xl md:text-8xl mb-1 md:mb-3 animate-float">{statType.emoji}</div>
              <div className="text-lg md:text-2xl font-black text-white drop-shadow-lg mb-0.5 md:mb-1">{statType.name}</div>
              <div className="text-xl md:text-3xl font-black text-white drop-shadow-lg">Lv.{levelDetails.level}</div>
              <div className="text-xs md:text-base text-white/90">{levelDetails.currentLevelExp}/{levelDetails.nextLevelExp} EXP</div>
              
              {/* 진행도 바 */}
              <div className="w-full max-w-[120px] md:max-w-[140px] bg-white/20 backdrop-blur-sm rounded-full h-3 md:h-4 mt-2 md:mt-4 overflow-hidden">
                <div 
                  className="bg-white rounded-full h-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </Button>
        </div>
        
        {/* 클릭 힌트 (모바일에서는 보이지 않음) */}
        <div className="absolute inset-0 pointer-events-none hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
            클릭하여 활동 선택
          </div>
        </div>
      </div>

      {/* 액션 선택 모달 */}
      <StatActionModal
        isOpen={showModal}
        statType={showModal ? statType : null}
        onClose={() => setShowModal(false)}
        onAction={handleAction}
      />
    </>
  )
})