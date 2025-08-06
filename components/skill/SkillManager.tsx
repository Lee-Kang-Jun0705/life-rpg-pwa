'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Zap, Shield, Heart, Sparkles, Lock, CheckCircle, Plus, Droplet, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import { jrpgDbHelpers } from '@/lib/jrpg/database-helpers'
import { SKILL_DATABASE } from '@/lib/jrpg/skills-database'
import { JRPGSkillCard } from './JRPGSkillCard'
import type { SkillInstance } from '@/lib/jrpg/types'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SkillManagerProps {
  userId: string
  onClose?: () => void
}

// MP 계산 헬퍼
function calculateMaxMp(level: number): number {
  return 100 + level * 10
}

// 스킬 슬롯 컴포넌트
function SkillSlot({ 
  skill, 
  slotNumber,
  onClick,
  isJRPG = true
}: { 
  skill: SkillInstance | null
  slotNumber: number
  onClick: () => void
  isJRPG?: boolean
}) {
  const skillDef = skill ? SKILL_DATABASE[skill.skillId] : null
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative w-16 h-16 rounded-lg border-2 transition-all",
        skill 
          ? 'border-yellow-500 bg-yellow-500/20' 
          : 'border-gray-600 bg-gray-800/50 border-dashed',
        "flex items-center justify-center"
      )}
    >
      {skillDef ? (
        <>
          <span className="text-2xl">{skillDef.icon}</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
            {slotNumber}
          </div>
          {skill.cooldownRemaining > 0 && (
            <div className="absolute inset-0 bg-gray-900/70 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">{skill.cooldownRemaining}</span>
            </div>
          )}
        </>
      ) : (
        <span className="text-gray-500 text-xs">슬롯 {slotNumber}</span>
      )}
    </motion.button>
  )
}

export function SkillManager({ userId, onClose }: SkillManagerProps) {
  // JRPG 스킬 시스템 상태
  const [characterLevel, setCharacterLevel] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [jrpgSkills, setJrpgSkills] = useState<SkillInstance[]>([])
  const [equippedJRPGSkills, setEquippedJRPGSkills] = useState<(SkillInstance | null)[]>([null, null, null, null, null, null, null, null])
  const [currentMp, setCurrentMp] = useState(100)
  const [maxMp, setMaxMp] = useState(100)
  const [skillPoints, setSkillPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // 캐릭터 레벨 및 MP 로드
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        const stats = await dbHelpers.getStats(userId)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
          const mp = calculateMaxMp(level)
          setMaxMp(mp)
          setCurrentMp(mp)
          
          // 스킬 포인트 = 레벨 - 1 (1레벨 때는 0 SP)
          setSkillPoints(Math.max(0, level - 1))
        }
      } catch (error) {
        console.error('Failed to load character data:', error)
      }
    }
    loadCharacterData()
  }, [userId])

  // JRPG 스킬 데이터 로드
  const loadJRPGSkills = useCallback(async () => {
    setIsLoading(true)
    try {
      const skillData = await jrpgDbHelpers.getJRPGSkills(userId)
      if (skillData && skillData.skills && Array.isArray(skillData.skills)) {
        setJrpgSkills(skillData.skills)
        
        // 장착된 스킬 매핑
        const equipped = new Array(8).fill(null)
        skillData.skills.forEach(skill => {
          if (skill.equippedSlot !== undefined && skill.equippedSlot >= 0 && skill.equippedSlot < 8) {
            equipped[skill.equippedSlot] = skill
          }
        })
        setEquippedJRPGSkills(equipped)
      } else {
        setJrpgSkills([])
        setEquippedJRPGSkills(new Array(8).fill(null))
      }
        
      // 사용한 스킬 포인트 계산
      if (skillData && skillData.skills && Array.isArray(skillData.skills)) {
        const usedSP = skillData.skills.reduce((sum, skill) => sum + skill.level - 1, 0) // 레벨 1은 무료
        setSkillPoints(Math.max(0, characterLevel - 1 - usedSP))
      } else {
        setSkillPoints(Math.max(0, characterLevel - 1))
      }
    } catch (error) {
      console.error('Failed to load JRPG skills:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, characterLevel])

  useEffect(() => {
    loadJRPGSkills()
  }, [loadJRPGSkills])


  // JRPG 스킬 학습
  const handleLearnJRPGSkill = async (skillId: string) => {
    if (skillPoints <= 0) return
    
    const success = await jrpgDbHelpers.learnSkill(userId, skillId)
    if (success) {
      loadJRPGSkills()
      
      // 스킬 학습 이벤트 발송
      const totalSkills = jrpgSkills?.length || 0
      window.dispatchEvent(new CustomEvent('skill-learned', { 
        detail: { 
          skillId: skillId,
          totalSkills: totalSkills + 1
        } 
      }))
    }
  }

  // JRPG 스킬 업그레이드
  const handleUpgradeJRPGSkill = async (skill: SkillInstance) => {
    if (skillPoints <= 0 || skill.level >= SKILL_DATABASE[skill.skillId].maxLevel) return
    
    const success = await jrpgDbHelpers.upgradeSkill(userId, skill.skillId)
    if (success) {
      loadJRPGSkills()
    }
  }

  // JRPG 스킬 장착
  const handleEquipJRPGSkill = async (skill: SkillInstance) => {
    console.log('[SkillManager] handleEquipJRPGSkill called', { skill, selectedSlot })
    
    if (selectedSlot === null) {
      // 빈 슬롯 찾기
      const emptySlotIndex = equippedJRPGSkills.findIndex(s => s === null)
      console.log('[SkillManager] 빈 슬롯 찾기:', { emptySlotIndex, equippedJRPGSkills })
      
      if (emptySlotIndex !== -1) {
        const success = await jrpgDbHelpers.equipSkill(userId, skill.skillId, emptySlotIndex)
        console.log('[SkillManager] 스킬 장착 결과:', success)
        if (success) {
          loadJRPGSkills()
        }
      } else {
        console.log('[SkillManager] 빈 슬롯이 없습니다')
      }
    } else {
      const success = await jrpgDbHelpers.equipSkill(userId, skill.skillId, selectedSlot - 1)
      console.log('[SkillManager] 특정 슬롯에 장착 결과:', success)
      if (success) {
        setSelectedSlot(null)
        loadJRPGSkills()
      }
    }
  }

  // JRPG 스킬 장착 해제
  const handleUnequipJRPGSkill = async (slotIndex: number) => {
    const skill = equippedJRPGSkills[slotIndex]
    if (!skill) return
    
    const success = await jrpgDbHelpers.unequipSkill(userId, skill.skillId)
    if (success) {
      loadJRPGSkills()
    }
  }

  // MP 회복 (턴마다 5% 회복)
  const recoverMp = () => {
    const recovery = Math.floor(maxMp * 0.05)
    setCurrentMp(prev => Math.min(maxMp, prev + recovery))
  }

  // 학습한 스킬 맵
  const learnedJRPGSkillsMap = useMemo(() => {
    if (!jrpgSkills || !Array.isArray(jrpgSkills)) {
      return new Map()
    }
    return new Map(jrpgSkills.map(skill => [skill.skillId, skill]))
  }, [jrpgSkills])

  // 필터링된 JRPG 스킬
  const filteredJRPGSkills = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.values(SKILL_DATABASE)
    }
    return Object.values(SKILL_DATABASE).filter(skill => skill.category === selectedCategory)
  }, [selectedCategory])


  // JRPG 스킬 시스템 렌더링
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

      {/* MP & SP 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MP 바 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-400" />
              마나 포인트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>MP</span>
                <span className="text-blue-400">{currentMp} / {maxMp}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentMp / maxMp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-400">턴마다 5% 회복</p>
            </div>
          </CardContent>
        </Card>

        {/* 스킬 포인트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">스킬 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {skillPoints} SP
            </div>
            <p className="text-sm text-gray-400 mt-2">
              레벨업 시 1 포인트씩 획득
            </p>
          </CardContent>
        </Card>

        {/* 캐릭터 레벨 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">캐릭터 레벨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              Lv.{characterLevel}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              대시보드 스탯 레벨의 합
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 장착 슬롯 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">장착된 스킬 (8슬롯)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {equippedJRPGSkills.map((skill, index) => (
              <SkillSlot
                key={index}
                skill={skill}
                slotNumber={index + 1}
                onClick={() => {
                  if (skill) {
                    handleUnequipJRPGSkill(index)
                  } else {
                    setSelectedSlot(selectedSlot === index + 1 ? null : index + 1)
                  }
                }}
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

      {/* 카테고리 필터 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          전체
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'physical' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('physical')}
        >
          <Zap className="w-3 h-3 mr-1" />
          물리
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'magic' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('magic')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          마법
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'support' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('support')}
        >
          <Heart className="w-3 h-3 mr-1" />
          지원
        </Button>
        <Button
          size="sm"
          variant={selectedCategory === 'ultimate' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('ultimate')}
        >
          <Shield className="w-3 h-3 mr-1" />
          궁극기
        </Button>
      </div>

      {/* 스킬 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredJRPGSkills.map(skill => {
            const learned = learnedJRPGSkillsMap.get(skill.id)
            const isEquipped = learned && equippedJRPGSkills.some(s => s?.skillId === learned.skillId)
            const slotNumber = isEquipped ? equippedJRPGSkills.findIndex(s => s?.skillId === learned?.skillId) + 1 : undefined
            
            return (
              <JRPGSkillCard
                key={skill.id}
                skill={skill}
                learned={learned}
                isEquipped={isEquipped}
                slotNumber={slotNumber}
                characterLevel={characterLevel}
                currentMp={currentMp}
                onClick={() => learned && handleEquipJRPGSkill(learned)}
                onLearn={() => handleLearnJRPGSkill(skill.id)}
                onUpgrade={() => learned && handleUpgradeJRPGSkill(learned)}
                disabled={false}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}