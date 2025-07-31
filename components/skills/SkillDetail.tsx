'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Skill, LearnedSkill } from '@/lib/types/skill-system'
import { 
  Zap, 
  Clock, 
  Target,
  TrendingUp,
  Shield,
  Swords,
  Heart,
  Flame,
  Snowflake,
  ChevronUp,
  Plus
} from 'lucide-react'

interface SkillDetailProps {
  skill: Skill
  learnedSkill?: LearnedSkill
  skillPoints: number
  onLearn: () => void
  onUpgrade: () => void
  onAssignToSlot: (slot: number) => void
}

export function SkillDetail({
  skill,
  learnedSkill,
  skillPoints,
  onLearn,
  onUpgrade,
  onAssignToSlot
}: SkillDetailProps) {
  const mpCost = typeof skill.mpCost === 'number' 
    ? skill.mpCost 
    : skill.mpCost.base + skill.mpCost.perLevel * ((learnedSkill?.level || 1) - 1)

  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'damage': return <Swords className="w-4 h-4" />
      case 'heal': return <Heart className="w-4 h-4" />
      case 'buff': return <Shield className="w-4 h-4" />
      case 'debuff': return <TrendingUp className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getElementIcon = (element?: string) => {
    switch (element) {
      case 'fire': return <Flame className="w-4 h-4 text-red-400" />
      case 'ice': return <Snowflake className="w-4 h-4 text-blue-400" />
      case 'lightning': return <Zap className="w-4 h-4 text-yellow-400" />
      default: return null
    }
  }

  const getTargetTypeText = (targetType: string) => {
    switch (targetType) {
      case 'self': return '자신'
      case 'singleEnemy': return '단일 적'
      case 'allEnemies': return '모든 적'
      case 'singleAlly': return '단일 아군'
      case 'allAllies': return '모든 아군'
      case 'randomEnemy': return '무작위 적'
      case 'area': return '지역'
      default: return targetType
    }
  }

  const canLearn = !learnedSkill && skillPoints >= 1
  const canUpgrade = learnedSkill && learnedSkill.level < skill.maxLevel && skillPoints >= (learnedSkill.level + 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6"
    >
      {/* 헤더 */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-5xl">{skill.icon}</div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{skill.name}</h2>
          <p className="text-gray-400 mt-1">{skill.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`
              px-3 py-1 rounded text-sm
              ${skill.category === 'attack' ? 'bg-red-600' :
                skill.category === 'defense' ? 'bg-blue-600' :
                skill.category === 'support' ? 'bg-green-600' :
                'bg-purple-600'
              }
            `}>
              {skill.category}
            </span>
            <span className="text-sm text-gray-500">
              {skill.type === 'active' ? '액티브' :
               skill.type === 'passive' ? '패시브' :
               skill.type === 'toggle' ? '토글' :
               '콤보'}
            </span>
          </div>
        </div>
      </div>

      {/* 레벨 정보 */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">스킬 레벨</span>
          <span className="text-lg">
            {learnedSkill ? `Lv.${learnedSkill.level} / ${skill.maxLevel}` : `최대 Lv.${skill.maxLevel}`}
          </span>
        </div>
        
        {/* 레벨 진행도 */}
        <div className="flex gap-1">
          {Array.from({ length: skill.maxLevel }).map((_, i) => (
            <div
              key={i}
              className={`
                flex-1 h-2 rounded
                ${i < (learnedSkill?.level || 0) 
                  ? 'bg-purple-500' 
                  : 'bg-gray-600'
                }
              `}
            />
          ))}
        </div>

        {/* 경험치 정보 */}
        {learnedSkill && learnedSkill.level < skill.maxLevel && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>경험치</span>
              <span>{learnedSkill.experience} / {learnedSkill.level * 100 * (learnedSkill.level + 1)}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1">
              <div 
                className="bg-purple-400 h-1 rounded-full"
                style={{ 
                  width: `${(learnedSkill.experience / (learnedSkill.level * 100 * (learnedSkill.level + 1))) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 스킬 정보 */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* MP 소비 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Zap className="w-4 h-4" />
              <span>MP 소비</span>
            </div>
            <div className="font-semibold text-blue-400">
              {mpCost} MP
            </div>
          </div>

          {/* 쿨다운 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span>쿨다운</span>
            </div>
            <div className="font-semibold">
              {skill.cooldown}초
            </div>
          </div>

          {/* 사거리 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Target className="w-4 h-4" />
              <span>사거리</span>
            </div>
            <div className="font-semibold">
              {skill.range}m
            </div>
          </div>

          {/* 대상 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Target className="w-4 h-4" />
              <span>대상</span>
            </div>
            <div className="font-semibold">
              {getTargetTypeText(skill.target)}
            </div>
          </div>
        </div>

        {/* 효과 */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            스킬 효과
          </h4>
          <div className="space-y-2">
            {skill.effects.map((effect, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {getEffectIcon(effect.type)}
                <div className="flex-1">
                  <span className="text-gray-300">
                    {effect.type === 'damage' && '피해'}
                    {effect.type === 'heal' && '회복'}
                    {effect.type === 'buff' && '버프'}
                    {effect.type === 'debuff' && '디버프'}
                    {effect.type === 'dot' && '지속 피해'}
                    {effect.type === 'stun' && '기절'}
                    {effect.type === 'slow' && '둔화'}
                  </span>
                  {typeof effect.value === 'number' && (
                    <span className="font-semibold ml-1">
                      {effect.value}
                    </span>
                  )}
                  {typeof effect.value === 'object' && 'base' in effect.value && (
                    <span className="font-semibold ml-1">
                      {effect.value.base} (+{effect.value.scaling * (learnedSkill?.level || 1)})
                    </span>
                  )}
                  {effect.duration && (
                    <span className="text-gray-500 ml-1">
                      ({effect.duration}초)
                    </span>
                  )}
                  {effect.chance && effect.chance < 100 && (
                    <span className="text-gray-500 ml-1">
                      ({effect.chance}% 확률)
                    </span>
                  )}
                  {getElementIcon(effect.element)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 요구사항 */}
        {skill.requirements && !learnedSkill && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">요구사항</h4>
            <div className="space-y-2 text-sm">
              {skill.requirements.level && (
                <div className="text-yellow-400">
                  • 레벨 {skill.requirements.level} 이상
                </div>
              )}
              {skill.requirements.skills && skill.requirements.skills.map((req, index) => (
                <div key={index} className="text-purple-400">
                  • {req.id} Lv.{req.level} 이상
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-3">
        {/* 학습/업그레이드 버튼 */}
        {!learnedSkill ? (
          <button
            onClick={onLearn}
            disabled={!canLearn}
            className={`
              w-full py-3 rounded-lg font-semibold transition-colors
              flex items-center justify-center gap-2
              ${canLearn
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
            data-testid="learn-skill-detail-btn"
          >
            <Plus className="w-5 h-5" />
            스킬 학습 (1 포인트)
          </button>
        ) : learnedSkill.level < skill.maxLevel && (
          <button
            onClick={onUpgrade}
            disabled={!canUpgrade}
            className={`
              w-full py-3 rounded-lg font-semibold transition-colors
              flex items-center justify-center gap-2
              ${canUpgrade
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
            data-testid="upgrade-skill-detail-btn"
          >
            <ChevronUp className="w-5 h-5" />
            레벨업 ({learnedSkill.level + 1} 포인트)
          </button>
        )}

        {/* 퀵슬롯 할당 */}
        {learnedSkill && skill.type !== 'passive' && (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onAssignToSlot(i + 1)}
                className={`
                  py-2 rounded text-sm transition-colors
                  ${learnedSkill.slot === i + 1
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }
                `}
                data-testid={`assign-slot-${i + 1}`}
              >
                슬롯 {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}