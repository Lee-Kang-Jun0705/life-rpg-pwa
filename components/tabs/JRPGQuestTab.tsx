'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scroll, Star, Calendar, Gift, Sparkles, Filter, Search, Book } from 'lucide-react'
import { JRPGQuestManager } from '@/lib/jrpg/quest-manager'
import { JRPGQuestCard, JRPGQuestDetails } from '@/components/quest/JRPGQuestCard'
import { QUEST_DATABASE, QUEST_CATEGORY_STYLES, type JRPGQuest, type QuestProgress } from '@/lib/jrpg/quests-database'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { useUserStore } from '@/lib/stores/userStore'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { cn } from '@/lib/utils'
import { soundManager } from '@/lib/jrpg/sound-system'

export function JRPGQuestTab() {
  const user = useUserStore(state => state.user)
  const userId = user?.id || GAME_CONFIG.DEFAULT_USER_ID
  const { addCoins } = useUserStore()
  
  const [questManager, setQuestManager] = useState<JRPGQuestManager | null>(null)
  const [characterLevel, setCharacterLevel] = useState(1)
  const [activeCategory, setActiveCategory] = useState<JRPGQuest['category'] | 'all'>('main')
  const [selectedQuest, setSelectedQuest] = useState<JRPGQuest | null>(null)
  const [questProgress, setQuestProgress] = useState<Map<string, QuestProgress>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  
  // 캐릭터 레벨 로드
  useEffect(() => {
    const loadCharacterLevel = async () => {
      try {
        const stats = await dbHelpers.getStats(userId)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
        }
      } catch (error) {
        console.error('Failed to load character level:', error)
      }
    }
    
    loadCharacterLevel()
  }, [userId])
  
  // 퀘스트 매니저 초기화
  useEffect(() => {
    const initQuestManager = async () => {
      setIsLoading(true)
      try {
        const manager = new JRPGQuestManager(userId, characterLevel)
        await manager.loadProgress()
        
        // 새 사용자를 위한 튜토리얼 퀘스트 자동 시작
        const activeQuests = manager.getActiveQuests()
        const completedQuests = manager.getCompletedQuests()
        
        if (activeQuests.length === 0 && completedQuests.length === 0) {
          // 튜토리얼 퀘스트 자동 시작
          const tutorialQuests = ['quest_tutorial_1', 'quest_daily_health']
          for (const questId of tutorialQuests) {
            await manager.acceptQuest(questId)
          }
        }
        
        setQuestManager(manager)
        refreshQuests(manager)
      } catch (error) {
        console.error('Failed to initialize quest manager:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (characterLevel >= 0) { // 레벨 0부터 허용
      initQuestManager()
    }
  }, [userId, characterLevel])
  
  // 퀘스트 목록 새로고침
  const refreshQuests = (manager: JRPGQuestManager) => {
    const progress = new Map<string, QuestProgress>()
    
    // 진행 중인 퀘스트
    manager.getActiveQuests().forEach(({ quest, progress: prog }) => {
      progress.set(quest.id, prog)
    })
    
    // 완료된 퀘스트
    manager.getCompletedQuests().forEach(({ quest, progress: prog }) => {
      progress.set(quest.id, prog)
    })
    
    setQuestProgress(progress)
  }
  
  // 퀘스트 수락
  const handleAcceptQuest = async (questId: string) => {
    if (!questManager) return
    
    const success = await questManager.acceptQuest(questId)
    if (success) {
      refreshQuests(questManager)
      setSelectedQuest(null)
    }
  }
  
  // 보상 수령
  const handleClaimRewards = async (questId: string) => {
    if (!questManager) return
    
    const rewards = await questManager.claimRewards(questId)
    if (rewards) {
      // 골드 지급
      if (rewards.gold > 0) {
        addCoins(rewards.gold)
      }
      
      // 보상 알림
      alert(`보상 획득!\n경험치: +${rewards.exp}\n골드: +${rewards.gold}`)
      
      refreshQuests(questManager)
      setSelectedQuest(null)
    }
  }
  
  // 퀘스트 필터링
  const getFilteredQuests = (): Array<{ quest: JRPGQuest; progress?: QuestProgress; locked?: boolean; lockReason?: string }> => {
    if (!questManager) return []
    
    const quests: Array<{ quest: JRPGQuest; progress?: QuestProgress; locked?: boolean; lockReason?: string }> = []
    
    // 모든 퀘스트 확인
    Object.values(QUEST_DATABASE).forEach(quest => {
      // 카테고리 필터
      if (activeCategory !== 'all' && quest.category !== activeCategory) return
      
      // 검색 필터
      if (searchTerm && !quest.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !quest.description.toLowerCase().includes(searchTerm.toLowerCase())) return
      
      const progress = questProgress.get(quest.id)
      
      // 완료된 퀘스트 필터
      if (!showCompleted && progress && (progress.status === 'completed' || progress.status === 'claimed')) {
        // 반복 가능한 퀘스트는 표시
        if (!quest.isRepeatable) return
      }
      
      // 요구사항 확인
      let locked = false
      let lockReason = ''
      
      if (quest.requirements.level && characterLevel < quest.requirements.level) {
        locked = true
        lockReason = `레벨 ${quest.requirements.level} 필요`
      }
      
      if (quest.requirements.questIds) {
        const uncompletedPrereqs = quest.requirements.questIds.filter(id => {
          const prereqProgress = questProgress.get(id)
          return !prereqProgress || prereqProgress.status !== 'claimed'
        })
        
        if (uncompletedPrereqs.length > 0) {
          locked = true
          lockReason = '선행 퀘스트 완료 필요'
        }
      }
      
      // 이벤트 퀘스트 만료 확인
      if (quest.expiresAt && new Date() > quest.expiresAt) {
        locked = true
        lockReason = '이벤트 종료'
      }
      
      quests.push({ quest, progress, locked, lockReason })
    })
    
    // 정렬: 진행중 > 수락가능 > 잠김 > 완료
    quests.sort((a, b) => {
      const aStatus = a.progress?.status || 'available'
      const bStatus = b.progress?.status || 'available'
      
      const statusOrder = { active: 0, available: 1, completed: 2, claimed: 3 }
      const aOrder = statusOrder[aStatus] || 99
      const bOrder = statusOrder[bStatus] || 99
      
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.locked !== b.locked) return a.locked ? 1 : -1
      
      return 0
    })
    
    return quests
  }
  
  // 카테고리별 통계
  const getCategoryStats = (category: JRPGQuest['category']) => {
    if (!questManager) return { active: 0, completed: 0, total: 0 }
    
    const stats = questManager.getQuestCountByCategory(category)
    const total = Object.values(QUEST_DATABASE).filter(q => q.category === category).length
    
    return {
      active: stats.active,
      completed: stats.completed,
      total
    }
  }
  
  // 전체 진행률
  const getOverallProgress = () => {
    let totalQuests = 0
    let completedQuests = 0
    
    questProgress.forEach((progress) => {
      totalQuests++
      if (progress.status === 'claimed') {
        completedQuests++
      }
    })
    
    return totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  }
  
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  const categories = [
    { id: 'all' as const, label: '전체', icon: Book },
    { id: 'main' as const, label: '메인', icon: Star },
    { id: 'side' as const, label: '사이드', icon: Scroll },
    { id: 'daily' as const, label: '일일', icon: Calendar },
    { id: 'event' as const, label: '이벤트', icon: Sparkles }
  ]
  
  return (
    <div className="space-y-6">
      {/* 퀘스트 통계 */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Book className="w-6 h-6 text-purple-400" />
              퀘스트 저널
            </h2>
            <p className="text-sm text-gray-300 mt-1">당신의 영웅적인 여정을 기록합니다</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">전체 진행률</p>
            <p className="text-2xl font-bold text-white">{getOverallProgress()}%</p>
          </div>
        </div>
        
        {/* 카테고리별 진행 상황 */}
        <div className="grid grid-cols-4 gap-3">
          {['main', 'side', 'daily', 'event'].map(category => {
            const stats = getCategoryStats(category as JRPGQuest['category'])
            const style = QUEST_CATEGORY_STYLES[category as JRPGQuest['category']]
            
            return (
              <div key={category} className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{style.icon}</div>
                <p className="text-xs text-gray-400 mb-1">{category === 'main' ? '메인' : category === 'side' ? '사이드' : category === 'daily' ? '일일' : '이벤트'}</p>
                <p className="text-sm font-bold text-white">
                  {stats.completed}/{stats.total}
                </p>
                {stats.active > 0 && (
                  <p className="text-xs text-blue-400">진행 중 {stats.active}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 필터 및 검색 */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 카테고리 탭 */}
          <div className="flex gap-2 flex-1">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                    activeCategory === category.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* 검색 및 필터 */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="퀘스트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                showCompleted
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              완료
            </button>
          </div>
        </div>
      </div>
      
      {/* 퀘스트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getFilteredQuests().map(({ quest, progress, locked, lockReason }) => (
          <JRPGQuestCard
            key={quest.id}
            quest={quest}
            progress={progress}
            locked={locked}
            lockReason={lockReason}
            selected={selectedQuest?.id === quest.id}
            onClick={() => setSelectedQuest(quest)}
            onAccept={() => handleAcceptQuest(quest.id)}
            onClaim={() => handleClaimRewards(quest.id)}
          />
        ))}
      </div>
      
      {/* 퀘스트가 없을 때 */}
      {getFilteredQuests().length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">조건에 맞는 퀘스트가 없습니다</p>
        </div>
      )}
      
      {/* 퀘스트 상세 모달 */}
      <AnimatePresence>
        {selectedQuest && (
          <JRPGQuestDetails
            quest={selectedQuest}
            progress={questProgress.get(selectedQuest.id)}
            onClose={() => setSelectedQuest(null)}
            onAccept={() => handleAcceptQuest(selectedQuest.id)}
            onClaim={() => handleClaimRewards(selectedQuest.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}