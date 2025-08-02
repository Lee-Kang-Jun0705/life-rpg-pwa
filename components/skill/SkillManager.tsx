'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { skillService } from '@/lib/services/skill-service'
import { allSkills } from '@/lib/data/skills'
import type { Skill, LearnedSkill } from '@/lib/types/skill-system'
import { Book, Zap, Shield, Heart, Sparkles, Lock, CheckCircle, Plus } from 'lucide-react'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'

interface SkillManagerProps {
  userId: string
  onClose?: () => void
}

// 스킬 아이콘 가져오기
function getSkillCategoryIcon(category: string) {
  switch (category) {
    case 'attack': return <Zap className="w-4 h-4" />
    case 'defense': return <Shield className="w-4 h-4" />
    case 'support': return <Heart className="w-4 h-4" />
    case 'special': return <Sparkles className="w-4 h-4" />
    default: return <Book className="w-4 h-4" />
  }
}

// 스킬 카드 컴포넌트
function SkillCard({ 
  skill, 
  learned, 
  equipped,
  slotNumber,
  onLearn, 
  onUpgrade, 
  onEquip,
  canLearn,
  skillPoints 
}: { 
  skill: Skill
  learned?: LearnedSkill
  equipped: boolean
  slotNumber?: number
  onLearn: () => void
  onUpgrade: () => void
  onEquip: () => void
  canLearn: boolean
  skillPoints: number
}) {
  const isMaxLevel = learned && learned.level >= skill.maxLevel
  const canUpgrade = learned && !isMaxLevel && skillPoints > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        relative p-4 rounded-lg border-2 transition-all cursor-pointer
        ${learned 
          ? equipped 
            ? 'border-yellow-500 bg-yellow-500/10' 
            : 'border-green-500 bg-green-500/10'
          : canLearn 
            ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
            : 'border-gray-700 bg-gray-900/50 opacity-50'
        }
      `}
      onClick={learned && !equipped ? onEquip : undefined}
    >
      {/* 장착 슬롯 표시 */}
      {equipped && slotNumber && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
          {slotNumber}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* 스킬 아이콘 */}
        <div className="text-3xl">{skill.icon}</div>
        
        {/* 스킬 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{skill.name}</h3>
            {getSkillCategoryIcon(skill.category)}
            {learned && (
              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                Lv.{learned.level}/{skill.maxLevel}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-2">{skill.description}</p>
          
          {/* 스킬 효과 */}
          <div className="text-xs text-gray-500 space-y-1">
            {skill.mpCost && (
              <div>MP 소모: {typeof skill.mpCost === 'number' ? skill.mpCost : skill.mpCost.base}</div>
            )}
            {skill.cooldown > 0 && <div>쿨다운: {skill.cooldown}턴</div>}
            {skill.requirements?.level && !learned && (
              <div className="text-red-400">레벨 {skill.requirements.level} 필요</div>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-3 flex gap-2">
        {!learned && canLearn && (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation()
              onLearn()
            }}
            disabled={skillPoints <= 0}
          >
            <Plus className="w-3 h-3 mr-1" />
            학습 (1 SP)
          </Button>
        )}
        
        {learned && canUpgrade && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onUpgrade()
            }}
          >
            레벨업 (1 SP)
          </Button>
        )}
        
        {learned && equipped && (
          <div className="text-xs text-yellow-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            장착됨
          </div>
        )}
      </div>
    </motion.div>
  )
}

// 스킬 슬롯 컴포넌트
function SkillSlot({ 
  skill, 
  slotNumber,
  onClick 
}: { 
  skill: Skill | null
  slotNumber: number
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative w-16 h-16 rounded-lg border-2 transition-all
        ${skill 
          ? 'border-yellow-500 bg-yellow-500/20' 
          : 'border-gray-600 bg-gray-800/50 border-dashed'
        }
        flex items-center justify-center
      `}
    >
      {skill ? (
        <>
          <span className="text-2xl">{skill.icon}</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
            {slotNumber}
          </div>
        </>
      ) : (
        <span className="text-gray-500 text-xs">슬롯 {slotNumber}</span>
      )}
    </motion.button>
  )
}

export function SkillManager({ userId, onClose }: SkillManagerProps) {
  const [playerSkills, setPlayerSkills] = useState(skillService.getPlayerSkills(userId))
  const [characterLevel, setCharacterLevel] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  // 캐릭터 레벨 로드
  useEffect(() => {
    const loadCharacterLevel = async () => {
      try {
        const stats = await dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
        }
      } catch (error) {
        console.error('Failed to load character level:', error)
      }
    }
    loadCharacterLevel()
  }, [])

  // 스킬 데이터 새로고침
  const refreshSkills = () => {
    setPlayerSkills(skillService.getPlayerSkills(userId))
  }

  // 스킬 변경 감지
  useEffect(() => {
    const handleSkillsChange = () => {
      refreshSkills()
    }

    window.addEventListener('skills-changed', handleSkillsChange)
    return () => {
      window.removeEventListener('skills-changed', handleSkillsChange)
    }
  }, [userId])

  // 스킬 학습
  const handleLearnSkill = (skillId: string) => {
    if (skillService.learnSkill(userId, skillId)) {
      refreshSkills()
    }
  }

  // 스킬 업그레이드
  const handleUpgradeSkill = (skillId: string) => {
    if (skillService.upgradeSkill(userId, skillId)) {
      refreshSkills()
    }
  }

  // 스킬 장착
  const handleEquipSkill = (skillId: string) => {
    if (selectedSlot !== null) {
      if (skillService.equipSkill(userId, skillId, selectedSlot)) {
        setSelectedSlot(null)
        refreshSkills()
      }
    } else {
      // 빈 슬롯 찾아서 장착
      const emptySlotIndex = playerSkills.equippedSkills.findIndex(s => s === null)
      if (emptySlotIndex !== -1) {
        if (skillService.equipSkill(userId, skillId, emptySlotIndex + 1)) {
          refreshSkills()
        }
      }
    }
  }

  // 장착된 스킬 가져오기
  const equippedSkills = skillService.getEquippedSkills(userId)

  // 학습한 스킬 맵
  const learnedSkillsMap = new Map(
    playerSkills.learnedSkills.map(ls => [ls.skillId, ls])
  )

  // 장착된 스킬 맵
  const equippedSkillsSet = new Set(playerSkills.equippedSkills.filter(Boolean))

  // 학습 가능한 스킬
  const availableSkills = skillService.getAvailableSkills(userId, characterLevel)

  // 카테고리별 스킬 필터링
  const filteredSkills = selectedCategory === 'all' 
    ? [...Object.values(allSkills)]
    : Object.values(allSkills).filter(skill => skill.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6" />
          스킬 관리
        </h2>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            닫기
          </Button>
        )}
      </div>

      {/* 스킬 포인트 & 장착 슬롯 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 스킬 포인트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">스킬 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {playerSkills.skillPoints} SP
            </div>
            <p className="text-sm text-gray-400 mt-2">
              레벨업 시 1 포인트씩 획득
            </p>
          </CardContent>
        </Card>

        {/* 장착 슬롯 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">장착된 스킬</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {equippedSkills.map((skill, index) => (
                <SkillSlot
                  key={index}
                  skill={skill}
                  slotNumber={index + 1}
                  onClick={() => setSelectedSlot(selectedSlot === index + 1 ? null : index + 1)}
                />
              ))}
            </div>
            {selectedSlot && (
              <p className="text-sm text-yellow-400 mt-2">
                슬롯 {selectedSlot}에 장착할 스킬을 선택하세요
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedCategory === 'all' ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          전체
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'attack' ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory('attack')}
        >
          <Zap className="w-3 h-3 mr-1" />
          공격
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'defense' ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory('defense')}
        >
          <Shield className="w-3 h-3 mr-1" />
          방어
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'support' ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory('support')}
        >
          <Heart className="w-3 h-3 mr-1" />
          지원
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'special' ? 'primary' : 'outline'}
          onClick={() => setSelectedCategory('special')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          특수
        </Button>
      </div>

      {/* 스킬 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSkills.map(skill => {
          const learned = learnedSkillsMap.get(skill.id)
          const equipped = equippedSkillsSet.has(skill.id)
          const slotNumber = equipped ? playerSkills.equippedSkills.indexOf(skill.id) + 1 : undefined
          const canLearn = availableSkills.some(s => s.id === skill.id)

          return (
            <SkillCard
              key={skill.id}
              skill={skill}
              learned={learned}
              equipped={equipped}
              slotNumber={slotNumber}
              onLearn={() => handleLearnSkill(skill.id)}
              onUpgrade={() => handleUpgradeSkill(skill.id)}
              onEquip={() => handleEquipSkill(skill.id)}
              canLearn={canLearn}
              skillPoints={playerSkills.skillPoints}
            />
          )
        })}
      </div>
    </div>
  )
}