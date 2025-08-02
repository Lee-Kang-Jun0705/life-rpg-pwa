'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { CombatResult } from '@/lib/types/combat-system'
import type { GeneratedItem } from '@/lib/types/item-system'
import type { DungeonProgress } from '@/lib/types/dungeon'
import {
  Trophy,
  Star,
  Coins,
  Sparkles,
  Package,
  ChevronRight,
  RotateCcw,
  Home,
  Sword,
  Shield,
  Zap,
  Target,
  TrendingUp,
  X
} from 'lucide-react'
import { soundService, playSound } from '@/lib/services/sound.service'
import { inventoryService } from '@/lib/services/inventory.service'

interface DungeonResultScreenProps {
  result: 'victory' | 'defeat'
  combatResult?: CombatResult
  dungeonProgress?: DungeonProgress
  rewards?: {
    exp: number
    gold: number
    items: GeneratedItem[]
  }
  onContinue?: () => void
  onRetry?: () => void
  onExit?: () => void
}

export function DungeonResultScreen({
  result,
  combatResult,
  dungeonProgress,
  rewards,
  onContinue,
  onRetry,
  onExit
}: DungeonResultScreenProps) {
  const [showItemDetails, setShowItemDetails] = useState<GeneratedItem | null>(null)
  const [claimedItems, setClaimedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (result === 'victory') {
      // 승리 효과음
      playSound('victory_bgm')

      // 컨페티 효과
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    } else {
      // 패배 효과음
      playSound('defeat')
    }
  }, [result])

  const calculateStars = (): number => {
    if (result !== 'victory' || !combatResult || !dungeonProgress) {
      return 0
    }

    let stars = 1 // 기본 1성

    // 빠른 클리어
    if (dungeonProgress.completionTime < 300000) {
      stars++
    } // 5분 이내

    // 무피해 또는 최소 피해
    if (dungeonProgress.survivedWithFullHP ||
        combatResult.statistics?.totalDamageTaken < 100) {
      stars++
    }

    return Math.min(stars, 3)
  }

  const stars = calculateStars()

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const claimAllItems = () => {
    if (rewards?.items) {
      // 인벤토리에 아이템 추가
      rewards.items.forEach(item => {
        inventoryService.addItem(item)
      })

      setClaimedItems(new Set(rewards.items.map(item => item.uniqueId)))
      playSound('item_pickup')
    }
  }

  if (result === 'victory') {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4"
        data-testid="battle-result"
      >
        <div className="max-w-4xl mx-auto py-8">
          {/* 승리 헤더 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-5xl font-bold mb-2">VICTORY!</h1>
            <p className="text-xl text-gray-300">던전 클리어!</p>
          </motion.div>

          {/* 별점 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-4 mb-8"
            data-testid="dungeon-stars"
          >
            {[1, 2, 3].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: star <= stars ? 1 : 0.8,
                  rotate: 0
                }}
                transition={{
                  delay: 0.5 + star * 0.2,
                  type: 'spring',
                  stiffness: 200
                }}
              >
                <Star
                  className={`w-16 h-16 ${
                    star <= stars
                      ? 'text-yellow-500 fill-yellow-500 star-filled'
                      : 'text-gray-600'
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* 전투 통계 */}
          {combatResult?.statistics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gray-800 rounded-xl p-6 mb-6"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                전투 통계
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-3" data-testid="damage-dealt">
                  <div className="text-sm text-gray-400">가한 피해</div>
                  <div className="text-2xl font-bold text-red-400">
                    {combatResult.statistics.totalDamageDealt}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3" data-testid="damage-taken">
                  <div className="text-sm text-gray-400">받은 피해</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {combatResult.statistics.totalDamageTaken}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3" data-testid="critical-hits">
                  <div className="text-sm text-gray-400">치명타</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {combatResult.statistics.criticalHits}
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3" data-testid="skills-used">
                  <div className="text-sm text-gray-400">스킬 사용</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {combatResult.statistics.skillsUsed}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 보상 */}
          {rewards && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-gray-800 rounded-xl p-6 mb-6"
              data-testid="total-rewards"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                획득 보상
              </h3>

              {/* 경험치와 골드 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                  className="bg-gray-700 rounded-lg p-4 flex items-center gap-3"
                  data-testid="reward-exp"
                >
                  <div className="p-3 bg-green-500 bg-opacity-20 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">경험치</div>
                    <div className="text-2xl font-bold text-green-400">
                      +{rewards.exp}
                    </div>
                  </div>
                </div>

                <div
                  className="bg-gray-700 rounded-lg p-4 flex items-center gap-3"
                  data-testid="reward-gold"
                >
                  <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                    <Coins className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">골드</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      +{rewards.gold}
                    </div>
                  </div>
                </div>
              </div>

              {/* 아이템 */}
              {rewards.items.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">획득 아이템</h4>
                    <button
                      onClick={claimAllItems}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                      data-testid="claim-all-items"
                    >
                      모두 획득
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rewards.items.map((item) => (
                      <motion.div
                        key={item.uniqueId}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all ${
                          claimedItems.has(item.uniqueId) ? 'opacity-50' : ''
                        }`}
                        onClick={() => {
                          if (!claimedItems.has(item.uniqueId)) {
                            inventoryService.addItem(item)
                            setClaimedItems(prev => new Set([...prev, item.uniqueId]))
                            playSound('item_pickup')
                          }
                          setShowItemDetails(item)
                        }}
                        data-testid="dropped-item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{item.icon || '🎁'}</div>
                          <div className="flex-1">
                            <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              Lv.{item.level} • {item.type}
                            </div>
                          </div>
                          {!claimedItems.has(item.uniqueId) && (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex gap-4"
          >
            {dungeonProgress && dungeonProgress.currentStage < dungeonProgress.totalStages && (
              <button
                onClick={onContinue}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                data-testid="next-stage-btn"
              >
                다음 스테이지
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {(!dungeonProgress || dungeonProgress.currentStage >= dungeonProgress.totalStages) && (
              <button
                onClick={onExit}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                data-testid="dungeon-complete"
              >
                <Home className="w-6 h-6" />
                던전 나가기
              </button>
            )}
          </motion.div>
        </div>

        {/* 아이템 상세 모달 */}
        <AnimatePresence>
          {showItemDetails && (
            <ItemDetailModal
              item={showItemDetails}
              onClose={() => setShowItemDetails(null)}
            />
          )}
        </AnimatePresence>

        {/* 아이템 추가 알림 */}
        {claimedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg"
            data-testid="items-added-notification"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>{claimedItems.size}개 아이템이 인벤토리에 추가되었습니다!</span>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  // 패배 화면
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-900 to-red-950 text-white p-4"
      data-testid="defeat-screen"
    >
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <X className="w-24 h-24 mx-auto mb-4 text-red-500" />
          <h1 className="text-5xl font-bold mb-2">DEFEAT</h1>
          <p className="text-xl text-gray-300">던전 공략 실패...</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl p-6 mb-6"
        >
          <p className="text-center text-gray-300 mb-6">
            더 강해진 후 다시 도전해보세요!
          </p>

          <div className="flex gap-4">
            <button
              onClick={onRetry}
              className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="retry-btn"
            >
              <RotateCcw className="w-6 h-6" />
              다시 도전
            </button>

            <button
              onClick={onExit}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="exit-dungeon-btn"
            >
              <Home className="w-6 h-6" />
              던전 나가기
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// 아이템 상세 모달 컴포넌트
function ItemDetailModal({
  item,
  onClose
}: {
  item: GeneratedItem
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="item-tooltip"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{item.name}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4" data-testid="item-stats">
          {/* 기본 정보 */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{item.icon || '🎁'}</div>
            <div>
              <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
              </div>
              <div className="text-sm text-gray-400">
                Lv.{item.level} {item.type}
              </div>
            </div>
          </div>

          {/* 기본 스탯 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">기본 스탯</h4>
            <div className="space-y-1 text-sm">
              {item.baseStats.attack && (
                <div className="flex justify-between">
                  <span className="text-gray-400">공격력</span>
                  <span className="text-red-400">+{item.baseStats.attack}</span>
                </div>
              )}
              {item.baseStats.defense && (
                <div className="flex justify-between">
                  <span className="text-gray-400">방어력</span>
                  <span className="text-blue-400">+{item.baseStats.defense}</span>
                </div>
              )}
              {item.baseStats.hp && (
                <div className="flex justify-between">
                  <span className="text-gray-400">체력</span>
                  <span className="text-green-400">+{item.baseStats.hp}</span>
                </div>
              )}
            </div>
          </div>

          {/* 랜덤 스탯 */}
          {item.randomStats && item.randomStats.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2">추가 옵션</h4>
              <div className="space-y-1 text-sm">
                {item.randomStats.map((stat, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-400">{stat.type}</span>
                    <span className="text-purple-400">
                      +{stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 특수 효과 */}
          {item.specialEffects && item.specialEffects.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-semibold mb-2">특수 효과</h4>
              <div className="space-y-2 text-sm">
                {item.specialEffects.map((effect, index) => (
                  <div key={index} className="text-yellow-400">
                    {effect.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// 타입 가드 함수
function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-orange-400'
  }
  return colors[rarity] || 'text-gray-400'
}
