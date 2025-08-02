'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { skillService } from '@/lib/services/skill-service'
import { allSkills } from '@/lib/data/skills'
import type { Skill } from '@/lib/types/skill-system'
import { cn } from '@/lib/utils'

interface SkillButtonsProps {
  userId: string
  playerMp: number
  maxMp: number
  onSkillUse: (skillId: string) => void
  disabled?: boolean
}

export function SkillButtons({ userId, playerMp, maxMp, onSkillUse, disabled }: SkillButtonsProps) {
  const [equippedSkills, setEquippedSkills] = useState<(Skill | null)[]>([])
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  
  useEffect(() => {
    // 장착된 스킬 가져오기
    const skills = skillService.getEquippedSkills(userId)
    setEquippedSkills(skills)
    
    // 쿨다운 정보 가져오기
    const playerData = skillService.getPlayerSkills(userId)
    setCooldowns(playerData.cooldowns)
  }, [userId])
  
  // 스킬 사용 가능 여부 확인
  const canUseSkill = (skill: Skill | null): boolean => {
    if (!skill || disabled) return false
    
    // MP 확인
    const mpCost = typeof skill.mpCost === 'number' 
      ? skill.mpCost 
      : skill.mpCost.base
    if (playerMp < mpCost) return false
    
    // 쿨다운 확인
    if (cooldowns[skill.id] > 0) return false
    
    return true
  }
  
  return (
    <div className="space-y-2">
      {/* MP 바 */}
      <div className="bg-gray-800 rounded-lg p-2" role="region" aria-label="MP 상태">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-blue-400">MP</span>
          <span className="text-white" aria-label={`MP ${playerMp} / ${maxMp}`}>{playerMp}/{maxMp}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={playerMp} aria-valuemin={0} aria-valuemax={maxMp} aria-label="MP 게이지">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
            initial={{ width: '100%' }}
            animate={{ width: `${(playerMp / maxMp) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* 스킬 버튼들 */}
      <div className="grid grid-cols-4 gap-2">
        {equippedSkills.map((skill, index) => {
          if (!skill) {
            return (
              <div
                key={index}
                className="aspect-square bg-gray-800/50 rounded-lg border-2 border-gray-700 border-dashed flex items-center justify-center"
              >
                <span className="text-gray-600 text-xs">{index + 1}</span>
              </div>
            )
          }
          
          const canUse = canUseSkill(skill)
          const cooldown = cooldowns[skill.id] || 0
          const mpCost = typeof skill.mpCost === 'number' ? skill.mpCost : skill.mpCost.base
          
          return (
            <motion.button
              key={skill.id}
              whileHover={canUse ? { scale: 1.05 } : {}}
              whileTap={canUse ? { scale: 0.95 } : {}}
              onClick={() => canUse && onSkillUse(skill.id)}
              disabled={!canUse}
              aria-label={`${skill.name} 스킬 사용 (MP ${mpCost} 소모)${cooldown > 0 ? `, 쿨다운 ${cooldown}턴 남음` : ''}${playerMp < mpCost ? ', MP 부족' : ''}`}
              className={cn(
                "relative aspect-square rounded-lg border-2 transition-all",
                canUse
                  ? "border-blue-500 bg-gradient-to-br from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20"
                  : "border-gray-700 bg-gray-800/50 opacity-50"
              )}
            >
              {/* 스킬 아이콘 */}
              <div className="text-2xl" aria-hidden="true">{skill.icon}</div>
              
              {/* 스킬 번호 */}
              <div className="absolute top-0 left-0 w-5 h-5 bg-gray-900 rounded-br-lg flex items-center justify-center text-xs font-bold" aria-hidden="true">
                {index + 1}
              </div>
              
              {/* MP 비용 */}
              <div className="absolute bottom-0 right-0 bg-blue-900/80 px-1 rounded-tl text-xs text-blue-300" aria-hidden="true">
                {mpCost}
              </div>
              
              {/* 쿨다운 오버레이 */}
              {cooldown > 0 && (
                <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <span className="text-white font-bold">{cooldown}</span>
                </div>
              )}
              
              {/* MP 부족 표시 */}
              {playerMp < mpCost && cooldown === 0 && (
                <div className="absolute inset-0 bg-red-900/30 rounded-lg" aria-hidden="true" />
              )}
            </motion.button>
          )
        })}
      </div>
      
      {/* 기본 공격 버튼 */}
      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={() => !disabled && onSkillUse('basic_attack')}
        disabled={disabled}
        aria-label="기본 공격 사용 (MP 소모 없음)"
        className={cn(
          "w-full py-2 rounded-lg border-2 transition-all",
          !disabled
            ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
            : "border-gray-700 bg-gray-900/50 text-gray-600"
        )}
      >
        기본 공격
      </motion.button>
    </div>
  )
}