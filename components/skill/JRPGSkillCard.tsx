// JRPG 스킬 카드 컴포넌트
import { motion } from 'framer-motion'
import { Zap, Shield, Heart, Sparkles, Flame, Snowflake, Zap as Thunder, Leaf, Sun, Moon, Stars } from 'lucide-react'
import type { SkillDefinition, SkillInstance } from '@/lib/jrpg/types'
import { cn } from '@/lib/utils'

interface JRPGSkillCardProps {
  skill: SkillDefinition
  learned?: SkillInstance
  isEquipped?: boolean
  slotNumber?: number
  characterLevel: number
  currentMp?: number
  onClick?: () => void
  onLearn?: () => void
  onUpgrade?: () => void
  disabled?: boolean
}

// 원소별 아이콘
const ELEMENT_ICONS = {
  physical: Zap,
  fire: Flame,
  ice: Snowflake,
  thunder: Thunder,
  nature: Leaf,
  light: Sun,
  dark: Moon,
  arcane: Stars
}

// 원소별 색상
const ELEMENT_COLORS = {
  physical: 'text-gray-400',
  fire: 'text-red-400',
  ice: 'text-blue-400',
  thunder: 'text-yellow-400',
  nature: 'text-green-400',
  light: 'text-yellow-200',
  dark: 'text-purple-400',
  arcane: 'text-pink-400'
}

export function JRPGSkillCard({
  skill,
  learned,
  isEquipped,
  slotNumber,
  characterLevel,
  currentMp = 0,
  onClick,
  onLearn,
  onUpgrade,
  disabled
}: JRPGSkillCardProps) {
  const ElementIcon = ELEMENT_ICONS[skill.element]
  const elementColor = ELEMENT_COLORS[skill.element]
  
  const isLocked = characterLevel < skill.unlockLevel
  const isMaxLevel = learned && learned.level >= skill.maxLevel
  const canAffordMp = currentMp >= (skill.baseMpCost - skill.mpReductionPerLevel * (learned?.level || 1 - 1))
  const isOnCooldown = learned && learned.cooldownRemaining > 0
  
  const mpCost = Math.max(1, skill.baseMpCost - skill.mpReductionPerLevel * (learned?.level || 1 - 1))
  const cooldown = Math.max(1, skill.baseCooldown - skill.cooldownReduction * (learned?.level || 1 - 1))
  
  return (
    <motion.div
      whileHover={!disabled && !isLocked ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLocked ? { scale: 0.98 } : {}}
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all cursor-pointer',
        learned ? (
          isEquipped ? 'border-yellow-500 bg-yellow-500/10' : 'border-green-500 bg-green-500/10'
        ) : isLocked ? 'border-gray-700 bg-gray-900/50 opacity-50' : 'border-gray-600 bg-gray-800/50 hover:border-gray-500',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={!disabled && !isLocked && learned && !isEquipped ? onClick : undefined}
    >
      {/* 장착 슬롯 표시 */}
      {isEquipped && slotNumber && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
          {slotNumber}
        </div>
      )}
      
      {/* 쿨다운 오버레이 */}
      {isOnCooldown && (
        <div className="absolute inset-0 bg-gray-900/70 rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{learned?.cooldownRemaining}</span>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        {/* 스킬 아이콘 */}
        <div className={cn('text-3xl', elementColor)}>
          <ElementIcon className="w-8 h-8" />
        </div>
        
        {/* 스킬 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{skill.name}</h3>
            <span className={cn('text-xs', elementColor)}>{skill.element}</span>
            {learned && (
              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                Lv.{learned.level}/{skill.maxLevel}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-2">{skill.description}</p>
          
          {/* 스킬 효과 */}
          <div className="text-xs text-gray-500 space-y-1">
            {/* 데미지/힐량 */}
            {skill.baseDamage && (
              <div>
                데미지: {skill.baseDamage + (skill.damagePerLevel || 0) * (learned?.level || 1 - 1)}
              </div>
            )}
            {skill.baseHeal && (
              <div className="text-green-400">
                회복량: {skill.baseHeal + (skill.healPerLevel || 0) * (learned?.level || 1 - 1)}
              </div>
            )}
            
            {/* MP 소모 */}
            <div className={cn(!canAffordMp && 'text-red-400')}>
              MP 소모: {mpCost}
            </div>
            
            {/* 쿨다운 */}
            {skill.baseCooldown > 0 && (
              <div>쿨다운: {cooldown}턴</div>
            )}
            
            {/* 레벨 요구사항 */}
            {!learned && isLocked && (
              <div className="text-red-400">레벨 {skill.unlockLevel} 필요</div>
            )}
            
            {/* 특수 효과 */}
            {learned && learned.level >= 5 && skill.specialEffects?.level5 && (
              <div className="text-blue-400">★ {skill.specialEffects.level5}</div>
            )}
            {learned && learned.level >= 10 && skill.specialEffects?.level10 && (
              <div className="text-purple-400">★★ {skill.specialEffects.level10}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* 액션 버튼 */}
      {!isLocked && (
        <div className="mt-3 flex gap-2">
          {!learned && onLearn && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLearn()
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
            >
              학습 (1 SP)
            </button>
          )}
          
          {learned && !isMaxLevel && onUpgrade && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUpgrade()
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-bold"
            >
              레벨업 (1 SP)
            </button>
          )}
          
          {learned && !isEquipped && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onClick) onClick()
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
            >
              장착하기
            </button>
          )}
          
          {learned && isEquipped && (
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <span>슬롯 {slotNumber}에 장착됨</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}