'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface LevelUpCelebrationProps {
  show: boolean
  level: number
  statType?: string
  onComplete?: () => void
}

export function LevelUpCelebration({ show, level, statType, onComplete }: LevelUpCelebrationProps) {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (show) {
      setIsAnimating(true)
      // 애니메이션 완료 후 콜백
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onComplete?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!mounted || !isAnimating) return null

  const getStatName = (type?: string) => {
    const names: { [key: string]: string } = {
      health: '건강',
      learning: '학습',
      relationship: '관계',
      achievement: '성취'
    }
    return type ? names[type] || type : ''
  }

  // 축하 메시지 배열
  const messages = [
    '🎉 축하합니다!',
    '🌟 대단해요!',
    '✨ 멋져요!',
    '🏆 최고예요!',
    '💪 강해졌어요!'
  ]
  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-candy-yellow/20 to-transparent animate-pulse" />
      
      {/* 불꽃놀이 파티클 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-firework"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <span className="text-2xl">
              {['✨', '⭐', '🌟', '💫', '🎊'][Math.floor(Math.random() * 5)]}
            </span>
          </div>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative animate-level-up">
        {/* 큰 이모지 */}
        <div className="text-center mb-4">
          <span className="text-8xl animate-bounce-in inline-block">
            🎉
          </span>
        </div>

        {/* 레벨업 텍스트 */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <h1 className="text-4xl font-black text-center mb-2 bg-gradient-to-r from-candy-yellow via-candy-orange to-candy-pink bg-clip-text text-transparent">
            LEVEL UP!
          </h1>
          
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {statType && `${getStatName(statType)} `}
              레벨 {level} 달성!
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {randomMessage}
            </p>
          </div>

          {/* 진행률 바 */}
          <div className="mt-6 w-48 mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-candy-blue to-candy-purple animate-progress-fill" />
            </div>
          </div>
        </div>

        {/* 추가 이펙트 */}
        <div className="absolute -inset-4 animate-spin-slow">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-candy-yellow/50 via-transparent to-candy-pink/50 blur-xl" />
        </div>
      </div>

      <style jsx>{`
        @keyframes firework {
          0% {
            transform: translateY(0) scale(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0);
            opacity: 0;
          }
        }

        @keyframes level-up {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes progress-fill {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-firework {
          animation: firework ease-out forwards;
        }

        .animate-level-up {
          animation: level-up 0.6s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        .animate-progress-fill {
          animation: progress-fill 1s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>,
    document.body
  )
}