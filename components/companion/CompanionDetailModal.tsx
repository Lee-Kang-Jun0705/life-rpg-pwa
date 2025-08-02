'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompanionInstance } from '@/lib/types/companion'
import { getCompanionById } from '@/lib/data/companions'
import { companionService } from '@/lib/services/companion.service'
import { companionSkillService } from '@/lib/services/companion-skill.service'
import { 
  calculateCompanionPower, 
  calculateLevelProgress,
  getNextSkillUnlock,
  canEvolve,
  getActivityCost
} from '@/lib/helpers/companion-calculations'

interface CompanionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  companion: CompanionInstance
  onActivityPerformed?: () => void
}

export default function CompanionDetailModal({
  isOpen,
  onClose,
  companion,
  onActivityPerformed
}: CompanionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'activities' | 'info'>('stats')
  const [performingActivity, setPerformingActivity] = useState(false)

  const companionData = getCompanionById(companion.companionId)
  if (!companionData) return null

  const power = calculateCompanionPower(companion)
  const levelProgress = calculateLevelProgress(companion)
  const nextSkill = getNextSkillUnlock(companion)
  const evolutionStatus = canEvolve(companion)
  const passiveEffects = companionSkillService.getPassiveEffects(companion)

  const handleActivity = async (activityType: CompanionActivity['type']) => {
    setPerformingActivity(true)
    
    try {
      const result = companionService.performActivity('current-user', companion.id, activityType)
      if (result && onActivityPerformed) {
        onActivityPerformed()
      }
    } catch (error) {
      console.error('Failed to perform activity:', error)
    } finally {
      setPerformingActivity(false)
    }
  }

  const tabs = [
    { id: 'stats', label: '스탯', icon: '📊' },
    { id: 'skills', label: '스킬', icon: '⚡' },
    { id: 'activities', label: '활동', icon: '🎮' },
    { id: 'info', label: '정보', icon: '📖' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{companionData.emoji}</span>
                  <div>
                    <h2 className="text-xl font-bold">
                      {companion.nickname || companionData.name}
                    </h2>
                    <p className="text-sm opacity-90">
                      Lv.{companion.level} {companionData.species}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  {/* 전투력 */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">전투력</span>
                      <span className="text-2xl font-bold">{power.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 경험치 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">경험치</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {companion.exp}/{companion.expToNext} ({levelProgress}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* 스탯 목록 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>❤️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">체력</span>
                      </div>
                      <p className="text-xl font-bold">{companion.currentStats.maxHp}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>⚔️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">공격력</span>
                      </div>
                      <p className="text-xl font-bold">{companion.currentStats.attack}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>🛡️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">방어력</span>
                      </div>
                      <p className="text-xl font-bold">{companion.currentStats.defense}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>💨</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">속도</span>
                      </div>
                      <p className="text-xl font-bold">{companion.currentStats.speed}</p>
                    </div>
                  </div>

                  {/* 패시브 효과 */}
                  {Object.keys(passiveEffects.statBonuses).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">패시브 보너스</p>
                      <div className="space-y-1">
                        {Object.entries(passiveEffects.statBonuses).map(([stat, value]) => (
                          <p key={stat} className="text-sm text-blue-600 dark:text-blue-400">
                            +{value}% {stat}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {/* 언락된 스킬 */}
                  <div>
                    <h3 className="font-medium mb-3">보유 스킬</h3>
                    <div className="space-y-3">
                      {companionData.skills
                        .filter(skill => companion.unlockedSkills.includes(skill.id))
                        .map(skill => (
                          <div 
                            key={skill.id}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{skill.icon}</span>
                              <div className="flex-1">
                                <h4 className="font-medium">{skill.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {skill.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className={`px-2 py-1 rounded ${
                                    skill.type === 'active' 
                                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  }`}>
                                    {skill.type === 'active' ? '액티브' : '패시브'}
                                  </span>
                                  {skill.cooldown && (
                                    <span className="text-gray-500">
                                      쿨다운: {skill.cooldown}턴
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* 다음 스킬 */}
                  {nextSkill.skill && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">다음 스킬 언락</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{nextSkill.skill.icon}</span>
                        <div>
                          <p className="font-medium">{nextSkill.skill.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Lv.{nextSkill.skill.unlockLevel} 필요 (앞으로 {nextSkill.levelsNeeded}레벨)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 특성 */}
                  <div>
                    <h3 className="font-medium mb-3">특성</h3>
                    <div className="space-y-2">
                      {companionData.traits.map(trait => (
                        <div 
                          key={trait.id}
                          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3"
                        >
                          <h4 className="font-medium text-sm">{trait.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {trait.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-4">
                  {/* 상태 표시 */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">충성도</p>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full bg-red-500"
                          style={{ width: `${companion.loyalty}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium">{companion.loyalty}/100</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">배고픔</p>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full bg-orange-500"
                          style={{ width: `${companion.hunger}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium">{companion.hunger}/100</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">피로도</p>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${companion.fatigue}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium">{companion.fatigue}/100</p>
                    </div>
                  </div>

                  {/* 활동 버튼 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleActivity('feed')}
                      disabled={performingActivity || companion.hunger >= 100}
                      className="bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-4 transition-colors"
                    >
                      <span className="text-3xl mb-2 block">🍖</span>
                      <p className="font-medium">먹이 주기</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        배고픔 +30
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        비용: 50 골드
                      </p>
                    </button>

                    <button
                      onClick={() => handleActivity('play')}
                      disabled={performingActivity || companion.fatigue > 80}
                      className="bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-4 transition-colors"
                    >
                      <span className="text-3xl mb-2 block">🎾</span>
                      <p className="font-medium">놀아주기</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        충성도 +10, 피로도 +10
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        무료
                      </p>
                    </button>

                    <button
                      onClick={() => handleActivity('train')}
                      disabled={performingActivity || companion.fatigue > 70}
                      className="bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-4 transition-colors"
                    >
                      <span className="text-3xl mb-2 block">💪</span>
                      <p className="font-medium">훈련하기</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        경험치 +50, 피로도 +20
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        비용: 100 골드
                      </p>
                    </button>

                    <button
                      onClick={() => handleActivity('rest')}
                      disabled={performingActivity}
                      className="bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-4 transition-colors"
                    >
                      <span className="text-3xl mb-2 block">😴</span>
                      <p className="font-medium">휴식하기</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        피로도 -40
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        무료
                      </p>
                    </button>

                    <button
                      onClick={() => handleActivity('gift')}
                      disabled={performingActivity}
                      className="bg-pink-100 dark:bg-pink-900/20 hover:bg-pink-200 dark:hover:bg-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg p-4 transition-colors col-span-2"
                    >
                      <span className="text-3xl mb-2 block">🎁</span>
                      <p className="font-medium">선물하기</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        충성도 +20
                      </p>
                      <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                        비용: 200 골드
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-4">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="font-medium mb-3">기본 정보</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">종족</span>
                        <span className="font-medium">{companionData.species}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">희귀도</span>
                        <span className="font-medium capitalize">{companionData.rarity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">타입</span>
                        <span className="font-medium">
                          {companionData.type === 'offensive' && '공격형'}
                          {companionData.type === 'defensive' && '방어형'}
                          {companionData.type === 'support' && '지원형'}
                          {companionData.type === 'balanced' && '균형형'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">속성</span>
                        <span className="font-medium">
                          {companionData.element === 'fire' && '🔥 불'}
                          {companionData.element === 'water' && '💧 물'}
                          {companionData.element === 'earth' && '🌍 땅'}
                          {companionData.element === 'wind' && '🌪️ 바람'}
                          {companionData.element === 'light' && '✨ 빛'}
                          {companionData.element === 'dark' && '🌑 어둠'}
                          {companionData.element === 'normal' && '⚪ 무속성'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  <div>
                    <h3 className="font-medium mb-3">설명</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {companionData.description}
                    </p>
                  </div>

                  {/* 전투 통계 */}
                  <div>
                    <h3 className="font-medium mb-3">전투 기록</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {companion.battleStats.victories}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">승리</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {companion.battleStats.defeats}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">패배</p>
                      </div>
                    </div>
                  </div>

                  {/* 진화 정보 */}
                  {companionData.evolution && (
                    <div>
                      <h3 className="font-medium mb-3">진화</h3>
                      <div className={`rounded-lg p-4 ${
                        evolutionStatus.canEvolve
                          ? 'bg-purple-50 dark:bg-purple-900/20'
                          : 'bg-gray-50 dark:bg-gray-700/50'
                      }`}>
                        <p className="text-sm mb-2">
                          {evolutionStatus.canEvolve 
                            ? '✨ 진화 가능!' 
                            : `🔒 ${evolutionStatus.reason}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          필요 레벨: {companionData.evolution.requiredLevel}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 획득 정보 */}
                  <div>
                    <h3 className="font-medium mb-3">획득 정보</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      획득일: {new Date(companion.obtainedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}