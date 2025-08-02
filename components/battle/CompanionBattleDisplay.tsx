'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { CompanionInstance, CompanionSkill } from '@/lib/types/companion'
import { getCompanionById } from '@/lib/data/companions'
import { calculateCombatStats, getMoodModifier } from '@/lib/helpers/companion-calculations'

interface CompanionBattleDisplayProps {
  companion: CompanionInstance | null
  isActive: boolean
  showDamage?: number
  showHeal?: number
  showBuff?: { stat: string; value: number }
  currentSkillCooldowns?: Map<string, number>
}

export default function CompanionBattleDisplay({
  companion,
  isActive,
  showDamage,
  showHeal,
  showBuff,
  currentSkillCooldowns = new Map()
}: CompanionBattleDisplayProps) {
  if (!companion) return null

  const companionData = getCompanionById(companion.companionId)
  if (!companionData) return null

  const combatStats = calculateCombatStats(companion)
  const moodModifier = getMoodModifier(companion.mood)
  const hpRatio = companion.currentStats.hp / companion.currentStats.maxHp

  // 기분별 상태 색상
  const moodColors = {
    happy: 'text-green-500',
    normal: 'text-gray-500',
    sad: 'text-blue-500',
    tired: 'text-purple-500',
    hungry: 'text-orange-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${isActive ? 'z-10' : 'z-0'}`}
    >
      {/* 컴패니언 카드 */}
      <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg ${
        isActive ? 'ring-2 ring-yellow-400' : ''
      }`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{companionData.emoji}</span>
            <div>
              <p className="font-medium text-sm">
                {companion.nickname || companionData.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lv.{companion.level}
              </p>
            </div>
          </div>
          <span className={`text-lg ${moodColors[companion.mood]}`}>
            {companion.mood === 'happy' && '😊'}
            {companion.mood === 'normal' && '😐'}
            {companion.mood === 'sad' && '😢'}
            {companion.mood === 'tired' && '😴'}
            {companion.mood === 'hungry' && '🤤'}
          </span>
        </div>

        {/* HP 바 */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>HP</span>
            <span>{companion.currentStats.hp}/{companion.currentStats.maxHp}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                hpRatio > 0.5 ? 'bg-green-500' : hpRatio > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${hpRatio * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 스탯 표시 */}
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="text-center">
            <span className="text-gray-500">⚔️</span>
            <span className="ml-1 font-medium">{combatStats.attack}</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500">🛡️</span>
            <span className="ml-1 font-medium">{combatStats.defense}</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500">💨</span>
            <span className="ml-1 font-medium">{combatStats.speed}</span>
          </div>
        </div>

        {/* 기분 보정 표시 */}
        {companion.mood !== 'normal' && (
          <div className="mt-2 text-xs text-center">
            <span className={moodColors[companion.mood]}>
              {companion.mood === 'happy' && '공격력 +20%'}
              {companion.mood === 'sad' && '공격력 -20%'}
              {companion.mood === 'tired' && '속도 -40%'}
              {companion.mood === 'hungry' && '공격력 -25%'}
            </span>
          </div>
        )}
      </div>

      {/* 데미지/힐 표시 */}
      <AnimatePresence>
        {showDamage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-red-500"
          >
            -{showDamage}
          </motion.div>
        )}
        {showHeal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-green-500"
          >
            +{showHeal}
          </motion.div>
        )}
        {showBuff && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium"
          >
            {showBuff.stat} +{showBuff.value}%
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스킬 쿨다운 표시 */}
      {currentSkillCooldowns.size > 0 && (
        <div className="mt-2 flex gap-1 justify-center">
          {Array.from(currentSkillCooldowns.entries()).map(([skillId, cooldown]) => {
            const skill = companionData.skills.find(s => s.id === skillId)
            if (!skill) return null
            
            return (
              <div
                key={skillId}
                className="relative w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
              >
                <span className="text-xs opacity-50">{skill.icon}</span>
                {cooldown > 0 && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{cooldown}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 활성 표시 */}
      {isActive && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-sm">⚡</span>
        </motion.div>
      )}
    </motion.div>
  )
}