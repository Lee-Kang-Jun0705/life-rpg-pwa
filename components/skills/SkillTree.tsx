'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Skill, LearnedSkill } from '@/lib/types/skill-system'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { Lock, Check, ChevronRight } from 'lucide-react'

interface SkillTreeProps {
  skills: Skill[]
  learnedSkills: LearnedSkill[]
  skillPoints: number
  onSelectSkill: (skill: Skill) => void
  onLearnSkill: (skillId: string) => void
}

export function SkillTree({
  skills,
  learnedSkills,
  skillPoints,
  onSelectSkill,
  onLearnSkill
}: SkillTreeProps) {
  // 카테고리별로 스킬 그룹화
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  // 스킬 학습 가능 여부 확인
  const canLearnSkill = (skill: Skill): boolean => {
    // 이미 학습한 경우
    if (learnedSkills.find(ls => ls.skillId === skill.id)) {
      return false
    }

    // 스킬 포인트 부족
    if (skillPoints < 1) {
      return false
    }

    // 요구사항 확인
    if (skill.requirements) {
      // 레벨 요구사항
      if (skill.requirements.level) {
        // TODO: 실제 플레이어 레벨 확인
        const playerLevel = 10
        if (playerLevel < skill.requirements.level) {
          return false
        }
      }

      // 선행 스킬 요구사항
      if (skill.requirements.skills) {
        for (const req of skill.requirements.skills) {
          const learned = learnedSkills.find(ls => ls.skillId === req.id)
          if (!learned || learned.level < req.level) {
            return false
          }
        }
      }
    }

    return true
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attack': return '⚔️'
      case 'defense': return '🛡️'
      case 'support': return '💚'
      case 'special': return '✨'
      default: return '📚'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attack': return 'from-red-600 to-orange-600'
      case 'defense': return 'from-blue-600 to-cyan-600'
      case 'support': return 'from-green-600 to-emerald-600'
      case 'special': return 'from-purple-600 to-pink-600'
      default: return 'from-gray-600 to-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <div key={category} className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-3xl">{getCategoryIcon(category)}</span>
            <span className="capitalize">{category} 스킬</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySkills.map(skill => {
              const learned = learnedSkills.find(ls => ls.skillId === skill.id)
              const canLearn = canLearnSkill(skill)
              const isLocked = !learned && !canLearn

              return (
                <motion.div
                  key={skill.id}
                  whileHover={{ scale: isLocked ? 1 : 1.02 }}
                  className={`
                    relative rounded-lg p-4 cursor-pointer transition-all
                    ${learned
                  ? `bg-gradient-to-br ${getCategoryColor(category)} bg-opacity-20`
                  : isLocked
                    ? 'bg-gray-700 opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600'
                }
                    ${learned ? 'border-2 border-purple-500' : 'border-2 border-gray-600'}
                  `}
                  onClick={() => !isLocked && onSelectSkill(skill)}
                  data-testid="skill-tree-node"
                >
                  {/* 잠금 오버레이 */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{skill.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        {skill.name}
                        {learned && (
                          <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                            Lv.{learned.level}/{skill.maxLevel}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {skill.description}
                      </p>

                      {/* 요구사항 */}
                      {!learned && skill.requirements && (
                        <div className="mt-2 text-xs space-y-1">
                          {skill.requirements.level && (
                            <div className="text-yellow-400">
                              레벨 {skill.requirements.level} 필요
                            </div>
                          )}
                          {skill.requirements.skills && (
                            <div className="text-purple-400">
                              선행 스킬 필요
                            </div>
                          )}
                        </div>
                      )}

                      {/* 학습 버튼 */}
                      {!learned && canLearn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onLearnSkill(skill.id)
                          }}
                          className="mt-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                          data-testid="learn-skill-btn"
                        >
                          학습하기 (1 포인트)
                        </button>
                      )}
                    </div>

                    {/* 학습 완료 표시 */}
                    {learned && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* 선행 스킬 연결선 (시각적 표현) */}
                  {skill.requirements?.skills && (
                    <div className="absolute -left-px top-1/2 -translate-y-1/2">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}

      {/* 빈 상태 */}
      {Object.keys(skillsByCategory).length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-400">스킬이 없습니다</p>
        </div>
      )}
    </div>
  )
}
