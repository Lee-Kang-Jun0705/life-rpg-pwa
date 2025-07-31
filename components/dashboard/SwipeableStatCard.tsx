import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Stat, StatType, calculateProgress } from '@/lib/types/dashboard'
import { SwipeAction, GradientClass } from '@/lib/types/ui'
import { motion, AnimatePresence } from 'framer-motion'

interface SwipeableStatCardProps {
  statType: StatType
  stat: Stat | undefined
  isProcessing: boolean
  onAction: (statType: string, action: string) => void
}

const SWIPE_ACTIONS: { [key: string]: SwipeAction[] } = {
  health: [
    { direction: 'up', action: '운동하기', emoji: '🏃', color: 'bg-green-500' },
    { direction: 'down', action: '산책하기', emoji: '🚶', color: 'bg-green-400' },
    { direction: 'left', action: '물 마시기', emoji: '💧', color: 'bg-blue-400' },
    { direction: 'right', action: '음성기록', emoji: '🎤', color: 'bg-purple-500' }
  ],
  learning: [
    { direction: 'up', action: '책 읽기', emoji: '📖', color: 'bg-blue-500' },
    { direction: 'down', action: '복습하기', emoji: '📝', color: 'bg-blue-400' },
    { direction: 'left', action: '강의 듣기', emoji: '🎧', color: 'bg-purple-400' },
    { direction: 'right', action: '음성기록', emoji: '🎤', color: 'bg-purple-500' }
  ],
  relationship: [
    { direction: 'up', action: '안부 인사', emoji: '👋', color: 'bg-pink-500' },
    { direction: 'down', action: '친구 만나기', emoji: '👥', color: 'bg-pink-400' },
    { direction: 'left', action: '가족 시간', emoji: '👨‍👩‍👧‍👦', color: 'bg-red-400' },
    { direction: 'right', action: '음성기록', emoji: '🎤', color: 'bg-purple-500' }
  ],
  achievement: [
    { direction: 'up', action: '목표 설정', emoji: '🎯', color: 'bg-yellow-500' },
    { direction: 'down', action: '일정 정리', emoji: '📅', color: 'bg-yellow-400' },
    { direction: 'left', action: '업무 집중', emoji: '💼', color: 'bg-orange-400' },
    { direction: 'right', action: '음성기록', emoji: '🎤', color: 'bg-purple-500' }
  ]
}

export const SwipeableStatCard = React.memo(function SwipeableStatCard({ statType, stat, isProcessing, onAction }: SwipeableStatCardProps) {
  const progress = calculateProgress(stat?.experience || 0)
  const [showAction, setShowAction] = useState<SwipeAction | null>(null)
  const [isSwipingLocked, setIsSwipingLocked] = useState(false)
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null)
  const [isPressed, setIsPressed] = useState(false)
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // useMemo로 actions 최적화
  const actions = useMemo(() => 
    SWIPE_ACTIONS[statType.type] || [], 
    [statType.type]
  )
  
  // 그라데이션 클래스 매핑 (타입 안정성 개선)
  const gradientClasses: Record<string, GradientClass> = {
    health: 'gradient-health',
    learning: 'gradient-learning',
    relationship: 'gradient-relationship',
    achievement: 'gradient-achievement',
  } as const

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isProcessing || isSwipingLocked) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
    setIsPressed(true)
  }, [isProcessing, isSwipingLocked])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isProcessing || isSwipingLocked) return
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x
    const deltaY = e.touches[0].clientY - touchStartRef.current.y
    const threshold = 30
    
    let detectedAction: SwipeAction | null = null
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 좌우 스와이프
      if (deltaX > threshold) {
        detectedAction = actions.find(a => a.direction === 'right') || null
      } else if (deltaX < -threshold) {
        detectedAction = actions.find(a => a.direction === 'left') || null
      }
    } else {
      // 상하 스와이프
      if (deltaY < -threshold) {
        detectedAction = actions.find(a => a.direction === 'up') || null
      } else if (deltaY > threshold) {
        detectedAction = actions.find(a => a.direction === 'down') || null
      }
    }
    
    if (detectedAction && detectedAction !== showAction) {
      setShowAction(detectedAction)
    }
  }, [actions, isProcessing, isSwipingLocked, showAction])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isProcessing || isSwipingLocked) return
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    
    const deltaX = touchEnd.x - touchStartRef.current.x
    const deltaY = touchEnd.y - touchStartRef.current.y
    const threshold = 50
    
    let finalAction: SwipeAction | null = null
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      // 좌우 스와이프
      if (deltaX > 0) {
        finalAction = actions.find(a => a.direction === 'right') || null
      } else {
        finalAction = actions.find(a => a.direction === 'left') || null
      }
    } else if (Math.abs(deltaY) > threshold) {
      // 상하 스와이프
      if (deltaY < 0) {
        finalAction = actions.find(a => a.direction === 'up') || null
      } else {
        finalAction = actions.find(a => a.direction === 'down') || null
      }
    }
    
    if (finalAction) {
      setIsSwipingLocked(true)
      onAction(statType.type, finalAction.action)
      
      // 시각적 피드백
      if (cardRef.current) {
        cardRef.current.classList.add('animate-rubber-band')
        setTimeout(() => {
          cardRef.current?.classList.remove('animate-rubber-band')
          setIsSwipingLocked(false)
        }, 800)
      }
    }
    
    // 상태 초기화
    touchStartRef.current = null
    setIsPressed(false)
    setTimeout(() => setShowAction(null), 300)
  }, [actions, isProcessing, isSwipingLocked, onAction, statType.type])

  const handleClick = () => {
    if (!isProcessing && !isSwipingLocked) {
      onAction(statType.type, '기본활동')
    }
  }

  // 데스크톱 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isProcessing || isSwipingLocked) return
    setMouseStart({ x: e.clientX, y: e.clientY })
    setIsPressed(true)
  }, [isProcessing, isSwipingLocked])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseStart || isProcessing || isSwipingLocked) return
    
    const deltaX = e.clientX - mouseStart.x
    const deltaY = e.clientY - mouseStart.y
    const threshold = 30
    
    let detectedAction: SwipeAction | null = null
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) {
        detectedAction = actions.find(a => a.direction === 'right') || null
      } else if (deltaX < -threshold) {
        detectedAction = actions.find(a => a.direction === 'left') || null
      }
    } else {
      if (deltaY < -threshold) {
        detectedAction = actions.find(a => a.direction === 'up') || null
      } else if (deltaY > threshold) {
        detectedAction = actions.find(a => a.direction === 'down') || null
      }
    }
    
    if (detectedAction && detectedAction !== showAction) {
      setShowAction(detectedAction)
    }
  }, [actions, isProcessing, isSwipingLocked, mouseStart, showAction])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseStart || isProcessing || isSwipingLocked) return
    
    const deltaX = e.clientX - mouseStart.x
    const deltaY = e.clientY - mouseStart.y
    const threshold = 50
    
    let finalAction: SwipeAction | null = null
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        finalAction = actions.find(a => a.direction === 'right') || null
      } else {
        finalAction = actions.find(a => a.direction === 'left') || null
      }
    } else if (Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        finalAction = actions.find(a => a.direction === 'up') || null
      } else {
        finalAction = actions.find(a => a.direction === 'down') || null
      }
    }
    
    if (finalAction) {
      setIsSwipingLocked(true)
      onAction(statType.type, finalAction.action)
      
      if (cardRef.current) {
        cardRef.current.classList.add('animate-bounce')
        setTimeout(() => {
          cardRef.current?.classList.remove('animate-bounce')
          setIsSwipingLocked(false)
        }, 500)
      }
    }
    
    setMouseStart(null)
    setTimeout(() => setShowAction(null), 300)
  }, [actions, isProcessing, isSwipingLocked, mouseStart, onAction, statType.type])

  return (
    <div 
      ref={cardRef}
      data-testid={`stat-card-${statType.type}`}
      className={`relative group touch-none select-none transition-transform duration-200 ${isPressed ? 'scale-95' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMouseStart(null)
        setShowAction(null)
        setIsPressed(false)
      }}
    >
      <div className={`w-full h-auto min-h-[140px] p-6 rounded-[2.5rem] relative overflow-hidden transform transition-all duration-300 hover:scale-105 ${gradientClasses[statType.type]} shadow-[0_8px_0_rgba(0,0,0,0.2),0_12px_25px_rgba(0,0,0,0.15)] ${isPressed ? 'shadow-[0_4px_0_rgba(0,0,0,0.2),0_6px_12px_rgba(0,0,0,0.15)] translate-y-[4px]' : ''} ${isProcessing || isSwipingLocked ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}>
        <Button
          onClick={handleClick}
          variant="ghost"
          size="xl"
          disabled={isProcessing || isSwipingLocked}
          className="w-full h-full p-0 bg-transparent hover:bg-transparent border-0 shadow-none rounded-none"
        >
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-8xl rotate-12">✨</div>
            <div className="absolute bottom-4 left-4 text-6xl -rotate-12">⭐</div>
          </div>
          
          {/* 진행도 배경 */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-30 transition-all duration-500"
            style={{ height: `${progress}%` }}
          />
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="text-6xl md:text-7xl mb-2 animate-float">{statType.emoji}</div>
            <div className="text-xl font-black text-white drop-shadow-lg">Lv.{stat?.level || 1}</div>
            
            {/* 진행도 바 */}
            <div className="w-full max-w-[120px] bg-white/20 backdrop-blur-sm rounded-full h-3 mt-3 overflow-hidden">
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
      
      {/* 스와이프 방향 표시 */}
      <AnimatePresence>
        {showAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 ${showAction.color} bg-opacity-95 rounded-[3rem] flex items-center justify-center pointer-events-none z-20 backdrop-blur-md`}
          >
            <div className="text-center text-white animate-bounce-in">
              <div className="emoji-giant mb-4">{showAction.emoji}</div>
              <div className="text-3xl font-black drop-shadow-lg">{showAction.action}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 스와이프 가이드 (데스크톱) */}
      <div className="absolute inset-0 pointer-events-none hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative w-32 h-32">
          {actions.map((action, index) => {
            const positions = {
              up: 'top-0 left-1/2 -translate-x-1/2',
              down: 'bottom-0 left-1/2 -translate-x-1/2',
              left: 'left-0 top-1/2 -translate-y-1/2',
              right: 'right-0 top-1/2 -translate-y-1/2'
            }
            
            return (
              <div
                key={`swipe-guide-${statType.type}-${action.direction}-${action.action}`}
                className={`absolute ${positions[action.direction]} text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap`}
              >
                {action.emoji} {action.action}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})