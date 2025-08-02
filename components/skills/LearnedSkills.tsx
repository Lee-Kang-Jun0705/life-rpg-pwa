'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { LearnedSkill, Skill } from '@/lib/types/skill-system'
import { skillManagementService } from '@/lib/services/skill-management.service'
import {
  TrendingUp,
  Zap,
  Clock,
  Target,
  ChevronUp
} from 'lucide-react'

interface LearnedSkillsProps {
  learnedSkills: LearnedSkill[]
  onSelectSkill: (skill: Skill) => void
  onUpgradeSkill: (skillId: string) => void
  skillPoints: number
}

export function LearnedSkills({
  learnedSkills,
  onSelectSkill,
  onUpgradeSkill,
  skillPoints
}: LearnedSkillsProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attack': return 'bg-red-500'
      case 'defense': return 'bg-blue-500'
      case 'support': return 'bg-green-500'
      case 'special': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'active': return <Zap className="w-4 h-4" />
      case 'passive': return <Target className="w-4 h-4" />
      case 'toggle': return <Clock className="w-4 h-4" />
      case 'combo': return <TrendingUp className="w-4 h-4" />
      default: return null
    }
  }

  const canUpgradeSkill = (skill: Skill, learned: LearnedSkill): boolean => {
    if (learned.level >= skill.maxLevel) {
      return false
    }
    const pointsRequired = learned.level + 1
    return skillPoints >= pointsRequired
  }

  if (learnedSkills.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-800 rounded-xl">
        <div className="text-6xl mb-4">📚</div>
        <p className="text-gray-400 mb-2">아직 학습한 스킬이 없습니다</p>
        <p className="text-sm text-gray-500">스킬 트리에서 새로운 스킬을 학습해보세요</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {learnedSkills.map((learned, index) => {
        const skill = skillManagementService.getSkill(learned.skillId)
        if (!skill) {
          return null
        }

        const canUpgrade = canUpgradeSkill(skill, learned)
        const mpCost = typeof skill.mpCost === 'number'
          ? skill.mpCost
          : skill.mpCost.base + skill.mpCost.perLevel * (learned.level - 1)

        return (
          <motion.div
            key={learned.skillId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition-all"
            onClick={() => onSelectSkill(skill)}
            data-testid="skill-item"
          >
            <div className="flex items-start gap-4">
              {/* 스킬 아이콘 */}
              <div className="relative">
                <div className="text-4xl">{skill.icon}</div>
                {/* 쿨다운 표시 */}
                {learned.cooldownRemaining > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {Math.ceil(learned.cooldownRemaining)}s
                    </span>
                  </div>
                )}
              </div>

              {/* 스킬 정보 */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {skill.name}
                      <span className={`
                        px-2 py-0.5 rounded text-xs text-white
                        ${getCategoryColor(skill.category)}
                      `}>
                        {skill.category}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {skill.description}
                    </p>
                  </div>

                  {/* 스킬 타입 아이콘 */}
                  <div className="text-gray-500">
                    {getTypeIcon(skill.type)}
                  </div>
                </div>

                {/* 스킬 스탯 */}
                <div className="flex items-center gap-4 mt-3 text-xs">
                  {/* 레벨 */}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Lv.</span>
                    <span className="font-semibold">{learned.level}</span>
                    <span className="text-gray-500">/ {skill.maxLevel}</span>
                  </div>

                  {/* MP 소비 */}
                  {mpCost > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">MP</span>
                      <span>{mpCost}</span>
                    </div>
                  )}

                  {/* 쿨다운 */}
                  {skill.cooldown > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{skill.cooldown}s</span>
                    </div>
                  )}

                  {/* 사거리 */}
                  {skill.range > 0 && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-gray-500" />
                      <span>{skill.range}m</span>
                    </div>
                  )}
                </div>

                {/* 경험치 바 */}
                {learned.level < skill.maxLevel && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">경험치</span>
                      <span className="text-gray-400">
                        {learned.experience} / {(learned.level * 100 * (learned.level + 1))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(learned.experience / (learned.level * 100 * (learned.level + 1))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 업그레이드 버튼 */}
                {learned.level < skill.maxLevel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (canUpgrade) {
                        onUpgradeSkill(skill.id)
                      }
                    }}
                    disabled={!canUpgrade}
                    className={`
                      mt-3 px-3 py-1 rounded text-sm transition-colors
                      flex items-center gap-1
                      ${canUpgrade
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                    `}
                    data-testid="upgrade-skill-btn"
                  >
                    <ChevronUp className="w-4 h-4" />
                    레벨업 ({learned.level + 1} 포인트)
                  </button>
                )}

                {/* 토글 상태 */}
                {skill.type === 'toggle' && (
                  <div className="mt-2">
                    <span className={`
                      px-2 py-1 rounded text-xs
                      ${learned.isActive
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                  }
                    `}>
                      {learned.isActive ? '활성화됨' : '비활성화됨'}
                    </span>
                  </div>
                )}

                {/* 퀵슬롯 표시 */}
                {learned.slot && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-purple-600 rounded text-xs">
                      퀵슬롯 {learned.slot}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
