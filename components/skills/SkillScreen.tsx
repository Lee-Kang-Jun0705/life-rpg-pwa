'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SkillTree } from './SkillTree'
import { LearnedSkills } from './LearnedSkills'
import { SkillDetail } from './SkillDetail'
import { QuickSlots } from './QuickSlots'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { persistenceService } from '@/lib/services/persistence.service'
import type { Skill, LearnedSkill, SkillFilter } from '@/lib/types/skill-system'
import { 
  Sparkles, 
  BookOpen, 
  Zap,
  Grid3X3,
  ChevronLeft,
  RotateCcw,
  Search,
  Filter
} from 'lucide-react'

interface SkillScreenProps {
  onClose?: () => void
}

export function SkillScreen({ onClose }: SkillScreenProps) {
  const [activeTab, setActiveTab] = useState<'tree' | 'learned' | 'all'>('learned')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [learnedSkills, setLearnedSkills] = useState<LearnedSkill[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [quickSlots, setQuickSlots] = useState(skillManagementService.getQuickSlots())
  const [skillPoints, setSkillPoints] = useState(skillManagementService.getSkillPoints())
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<SkillFilter>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // 이미 스킬이 로드되어 있는지 확인
    const currentSkills = skillManagementService.getAllLearnedSkills()
    
    if (currentSkills.length === 0) {
      // 스킬이 없을 때만 저장된 데이터 불러오기
      persistenceService.loadSkills('player-1').then(() => {
        loadSkills()
      })
    } else {
      // 이미 로드되어 있으면 바로 사용
      loadSkills()
    }
  }, [])

  const loadSkills = () => {
    setLearnedSkills(skillManagementService.getAllLearnedSkills())
    setAllSkills(skillManagementService.getAllSkills())
    setQuickSlots(skillManagementService.getQuickSlots())
    setSkillPoints(skillManagementService.getSkillPoints())
  }

  const handleLearnSkill = async (skillId: string) => {
    const result = await skillManagementService.learnSkill(skillId)
    if (await result) {
      loadSkills()
    }
  }

  const handleUpgradeSkill = async (skillId: string) => {
    const result = await skillManagementService.upgradeSkill(skillId)
    if (await result) {
      loadSkills()
    }
  }

  const handleAssignToQuickSlot = async (skillId: string, slot: number) => {
    const result = await skillManagementService.assignToQuickSlot(skillId, slot)
    if (await result) {
      loadSkills()
    }
  }

  const handleRemoveFromQuickSlot = async (slot: number) => {
    const result = await skillManagementService.removeFromQuickSlot(slot)
    if (await result) {
      loadSkills()
    }
  }

  const handleResetSkills = () => {
    if (confirm('모든 스킬을 초기화하시겠습니까? 사용한 스킬 포인트는 돌려받습니다.')) {
      skillManagementService.resetSkills()
      loadSkills()
      // 자동 저장
      persistenceService.saveSkills('player-1')
    }
  }

  const getFilteredSkills = (): Skill[] => {
    let skills = activeTab === 'learned' 
      ? learnedSkills.map(ls => skillManagementService.getSkill(ls.skillId)!).filter(Boolean)
      : allSkills

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      skills = skills.filter(skill => 
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query)
      )
    }

    // 카테고리/타입 필터
    skills = skillManagementService.filterSkills({
      ...filter,
      learned: activeTab === 'learned' ? true : undefined
    })

    return skills
  }

  const filteredSkills = getFilteredSkills()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  data-testid="close-skills"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-500" />
                스킬
              </h1>
            </div>

            {/* 탭 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('learned')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'learned'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid="learned-tab"
              >
                <BookOpen className="w-5 h-5" />
                학습한 스킬
              </button>
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'tree'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid="tree-tab"
              >
                <Grid3X3 className="w-5 h-5" />
                스킬 트리
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                data-testid="all-tab"
              >
                <Zap className="w-5 h-5" />
                모든 스킬
              </button>
            </div>
          </div>

          {/* 스킬 정보 */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span data-testid="skill-points">
                  스킬 포인트: {skillPoints}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>
                  학습한 스킬: {learnedSkills.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 검색 */}
              {activeTab !== 'tree' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="스킬 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="search-input"
                  />
                </div>
              )}
              
              {/* 필터 버튼 */}
              {activeTab !== 'tree' && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showFilters ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  data-testid="toggle-filters"
                >
                  <Filter className="w-5 h-5" />
                </button>
              )}

              {/* 스킬 초기화 */}
              <button
                onClick={handleResetSkills}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="스킬 초기화"
                data-testid="reset-skills"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 스킬 목록/트리 */}
          <div className="lg:col-span-2">
            {activeTab === 'tree' ? (
              <SkillTree
                skills={allSkills}
                learnedSkills={learnedSkills}
                skillPoints={skillPoints}
                onSelectSkill={setSelectedSkill}
                onLearnSkill={handleLearnSkill}
              />
            ) : activeTab === 'learned' ? (
              <LearnedSkills
                learnedSkills={learnedSkills}
                onSelectSkill={setSelectedSkill}
                onUpgradeSkill={handleUpgradeSkill}
                skillPoints={skillPoints}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map(skill => {
                  const learned = learnedSkills.find(ls => ls.skillId === skill.id)
                  return (
                    <motion.div
                      key={skill.id}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        bg-gray-800 rounded-lg p-4 cursor-pointer
                        ${learned ? 'border-2 border-purple-500' : 'border-2 border-gray-700'}
                        hover:border-purple-400 transition-all
                      `}
                      onClick={() => setSelectedSkill(skill)}
                      data-testid="skill-item"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{skill.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{skill.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {skill.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-purple-400">
                              {skill.category}
                            </span>
                            <span className="text-gray-500">
                              Lv.{learned?.level || 0}/{skill.maxLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 정보 및 퀵슬롯 */}
          <div className="space-y-6">
            {/* 퀵슬롯 */}
            <QuickSlots
              slots={quickSlots}
              onAssignSkill={handleAssignToQuickSlot}
              onRemoveSkill={handleRemoveFromQuickSlot}
              selectedSkill={selectedSkill}
            />

            {/* 스킬 상세 */}
            {selectedSkill && (
              <SkillDetail
                skill={selectedSkill}
                learnedSkill={learnedSkills.find(ls => ls.skillId === selectedSkill.id)}
                skillPoints={skillPoints}
                onLearn={() => handleLearnSkill(selectedSkill.id)}
                onUpgrade={() => handleUpgradeSkill(selectedSkill.id)}
                onAssignToSlot={(slot) => handleAssignToQuickSlot(selectedSkill.id, slot)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}