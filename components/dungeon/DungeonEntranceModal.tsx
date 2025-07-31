'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Dungeon, DungeonStage } from '@/lib/types/dungeon'
import type { Character } from '@/lib/types/game-core'
import { 
  X, 
  Sword, 
  Shield, 
  Zap, 
  Heart,
  Star,
  AlertCircle,
  ChevronRight,
  Users,
  Clock,
  Trophy,
  Sparkles
} from 'lucide-react'
import { ENERGY_CONFIG } from '@/lib/constants/progression.constants'

interface DungeonEntranceModalProps {
  dungeon: Dungeon
  character: Character
  isOpen: boolean
  onClose: () => void
  onEnter: (difficulty: string) => void
}

export function DungeonEntranceModal({ 
  dungeon, 
  character,
  isOpen, 
  onClose, 
  onEnter 
}: DungeonEntranceModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(dungeon.difficulty)
  const [estimatedTime, setEstimatedTime] = useState(0)
  
  useEffect(() => {
    // 예상 소요 시간 계산 (스테이지당 2-3분)
    const baseTime = dungeon.stages * 2.5
    const difficultyMultiplier: Record<string, number> = {
      easy: 0.8,
      normal: 1,
      hard: 1.3,
      nightmare: 1.6,
      hell: 2,
      expert: 1.8
    }
    const multiplier = difficultyMultiplier[selectedDifficulty] || 1
    
    setEstimatedTime(Math.round(baseTime * multiplier))
  }, [dungeon.stages, selectedDifficulty])

  const canEnter = () => {
    return character.level >= dungeon.requirements.level &&
           character.energy >= dungeon.requirements.energy
  }

  const getDifficultyRewards = (difficulty: string) => {
    const multipliers: Record<string, { exp: number; gold: number; dropRate: number }> = {
      easy: { exp: 0.8, gold: 0.8, dropRate: 0.9 },
      normal: { exp: 1, gold: 1, dropRate: 1 },
      hard: { exp: 1.5, gold: 1.5, dropRate: 1.2 },
      nightmare: { exp: 2, gold: 2, dropRate: 1.5 },
      hell: { exp: 3, gold: 3, dropRate: 2 },
      expert: { exp: 2.5, gold: 2.5, dropRate: 1.8 },
      legendary: { exp: 5, gold: 5, dropRate: 3 }
    }
    return multipliers[difficulty] || multipliers.normal
  }

  const rewards = getDifficultyRewards(selectedDifficulty)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
          data-testid="dungeon-enter-modal"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="relative p-6 border-b border-gray-700">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-2">{dungeon.name}</h2>
              <p className="text-gray-400">{dungeon.description}</p>
            </div>

            {/* 던전 정보 */}
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Shield className="w-4 h-4" />
                    스테이지
                  </div>
                  <div className="font-bold">{dungeon.stages}</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    필요 에너지
                  </div>
                  <div className="font-bold" data-testid="energy-cost">
                    {dungeon.requirements.energy} 에너지
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Star className="w-4 h-4" />
                    필요 레벨
                  </div>
                  <div className="font-bold">Lv.{dungeon.requirements.level}</div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    예상 시간
                  </div>
                  <div className="font-bold">{estimatedTime}분</div>
                </div>
              </div>

              {/* 난이도 선택 */}
              {(['easy', 'normal', 'hard', 'expert', 'legendary'] as const).length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">난이도 선택</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(['easy', 'normal', 'hard', 'expert', 'legendary'] as const).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedDifficulty === diff
                            ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-semibold capitalize mb-1">{diff}</div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>경험치 x{getDifficultyRewards(diff).exp}</div>
                          <div>골드 x{getDifficultyRewards(diff).gold}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 보상 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  예상 보상
                </h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                  {/* 기본 보상 */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">경험치</span>
                    <span className="font-semibold text-green-400">
                      +{Math.round(dungeon.rewards.exp * rewards.exp)}
                      <span className="text-sm text-gray-400 ml-2">
                        (x{rewards.exp})
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">골드</span>
                    <span className="font-semibold text-yellow-400">
                      +{Math.round(dungeon.rewards.gold * rewards.gold)}
                      <span className="text-sm text-gray-400 ml-2">
                        (x{rewards.gold})
                      </span>
                    </span>
                  </div>

                  {/* 아이템 드롭 */}
                  {dungeon.rewards.items && dungeon.rewards.items.length > 0 && (
                    <div className="pt-2 border-t border-gray-600">
                      <div className="text-sm text-gray-400 mb-2">드롭 가능 아이템</div>
                      <div className="flex flex-wrap gap-2">
                        {dungeon.rewards.items.map((item, index) => (
                          <div 
                            key={index}
                            className="px-2 py-1 bg-gray-600 rounded text-xs"
                          >
                            {item.name} ({Math.round(item.dropRate * rewards.dropRate * 100)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 첫 클리어 보상 */}
                  {dungeon.rewards.firstClearBonus && (
                    <div className="pt-2 border-t border-gray-600">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold">첫 클리어 보상</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <div>경험치 +{dungeon.rewards.firstClearBonus.exp}</div>
                        <div>골드 +{dungeon.rewards.firstClearBonus.gold}</div>
                        {dungeon.rewards.firstClearBonus.items?.map((item, index) => (
                          <div key={index}>{item.icon} {item.name}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 플레이어 상태 체크 */}
              <div className="space-y-2">
                {/* 레벨 체크 */}
                {character.level < dungeon.requirements.level && (
                  <div className="flex items-center gap-2 p-3 bg-red-900 bg-opacity-20 rounded-lg text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>레벨이 부족합니다. (현재: Lv.{character.level})</span>
                  </div>
                )}
                
                {/* 에너지 체크 */}
                {character.energy < dungeon.requirements.energy && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-900 bg-opacity-20 rounded-lg text-yellow-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>에너지가 부족합니다. (현재: {character.energy}/{character.maxEnergy})</span>
                  </div>
                )}

                {/* 현재 에너지 표시 */}
                <div className="bg-gray-700 rounded-lg p-3" data-testid="current-energy">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">현재 에너지</span>
                    <span className="text-sm">
                      {character.energy}/{character.maxEnergy}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${(character.energy / character.maxEnergy) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 권장 전투력 */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="flex items-center gap-2 font-semibold mb-2">
                  <Users className="w-5 h-5" />
                  권장 전투력
                </h4>
                <div className="text-2xl font-bold text-yellow-400">
                  {dungeon.recommendedCombatPower}+
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => onEnter(selectedDifficulty)}
                  disabled={!canEnter()}
                  className={`flex-1 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    canEnter()
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  data-testid="enter-dungeon-btn"
                >
                  <Sword className="w-5 h-5" />
                  던전 입장
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}