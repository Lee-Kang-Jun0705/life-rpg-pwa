'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DUNGEON_REWARD_ITEMS } from '@/lib/dungeon/reward-items'
import confetti from 'canvas-confetti'

interface RewardModalProps {
  isOpen: boolean
  onClose: () => void
  rewards: {
    exp: number
    coins: number
    items?: string[]
  } | null
}

export function RewardModal({ isOpen, onClose, rewards }: RewardModalProps) {
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (isOpen && rewards) {
      // 축하 효과
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      // 단계별 애니메이션
      const timers = [
        setTimeout(() => setAnimationStep(1), 300),
        setTimeout(() => setAnimationStep(2), 800),
        setTimeout(() => setAnimationStep(3), 1300)
      ]

      return () => {
        timers.forEach(timer => clearTimeout(timer))
        setAnimationStep(0)
      }
    }
  }, [isOpen, rewards])

  if (!rewards) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center space-y-6">
        <div className="text-6xl animate-bounce">🎉</div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          던전 클리어!
        </h2>

        <p className="text-gray-600 dark:text-gray-400">
          축하합니다! 모든 도전 과제를 완료했습니다!
        </p>

        <div className="space-y-4">
          <div className={`transform transition-all duration-500 ${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                +{rewards.exp} EXP
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                경험치 획득
              </div>
            </div>
          </div>

          <div className={`transform transition-all duration-500 ${animationStep >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg p-4">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                +{rewards.coins} 코인
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                코인 획득
              </div>
            </div>
          </div>

          {rewards.items && rewards.items.length > 0 && (
            <div className={`transform transition-all duration-500 ${animationStep >= 3 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4">
                <div className="text-4xl mb-2">📦</div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  아이템 {rewards.items.length}개 획득!
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                  {rewards.items.map(itemId => {
                    const item = DUNGEON_REWARD_ITEMS[itemId]
                    return item ? (
                      <div key={itemId} className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full"
          size="lg"
        >
          확인
        </Button>
      </div>
    </Modal>
  )
}