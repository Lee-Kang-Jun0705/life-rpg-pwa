'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Filter, Search, TrendingUp, Gift, Lock } from 'lucide-react'
import { JRPGAchievementManager } from '@/lib/jrpg/achievement-manager'
import { AchievementCard } from './AchievementCard'
import { ACHIEVEMENT_CATEGORY_STYLES, type Achievement, type AchievementProgress } from '@/lib/jrpg/achievements-database'
import type { AchievementStats } from '@/lib/jrpg/achievement-manager'
import { soundManager } from '@/lib/jrpg/sound-system'
import { cn } from '@/lib/utils'

interface AchievementManagerProps {
  userId: string
  characterLevel: number
}

export function AchievementManager({ userId, characterLevel }: AchievementManagerProps) {
  const [achievementManager, setAchievementManager] = useState<JRPGAchievementManager | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<{
    achievement: Achievement
    progress?: AchievementProgress
    percentage: number
  } | null>(null)
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([])
  
  // 도전과제 매니저 초기화
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const manager = new JRPGAchievementManager(userId)
        await manager.loadProgress()
        
        // 일일 로그인 체크
        await manager.checkDailyLogin()
        
        // 레벨 도전과제 체크
        const unlocked = await manager.checkAchievement('level', undefined, characterLevel)
        if (unlocked.length > 0) {
          setNewUnlocks(unlocked)
        }
        
        setAchievementManager(manager)
        setStats(manager.getStats())
      } catch (error) {
        console.error('Failed to initialize achievement manager:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
  }, [userId, characterLevel])
  
  // 전역 이벤트 리스너
  useEffect(() => {
    if (!achievementManager) return
    
    const handleEvent = async (event: CustomEvent<{ type: string; amount?: number; rarity?: string; count?: number }>) => {
      let unlocked: Achievement[] = []
      
      switch (event.type) {
        case 'monster-killed':
          unlocked = await achievementManager.checkAchievement('kill')
          break
        case 'critical-hit':
          unlocked = await achievementManager.checkAchievement('critical')
          break
        case 'gold-earned':
          unlocked = await achievementManager.checkAchievement('gold', undefined, event.detail.amount)
          break
        case 'item-collected':
          unlocked = await achievementManager.checkAchievement('item', event.detail.rarity)
          break
        case 'quest-completed':
          unlocked = await achievementManager.checkAchievement('quest')
          break
        case 'dungeon-cleared':
          unlocked = await achievementManager.checkAchievement('dungeon', (event.detail as any).dungeonId)
          break
        case 'enhancement-success':
          unlocked = await achievementManager.checkAchievement('enhance', undefined, (event.detail as any).level)
          break
        case 'skill-learned':
          unlocked = await achievementManager.checkAchievement('skill', undefined, (event.detail as any).totalSkills)
          break
        case 'nightmare-boss-killed':
          unlocked = await achievementManager.checkAchievement('custom', 'nightmare_boss_kills')
          break
      }
      
      if (unlocked.length > 0) {
        setNewUnlocks(prev => [...prev, ...unlocked])
        setStats(achievementManager.getStats())
      }
    }
    
    // 이벤트 리스너 등록
    const events = [
      'monster-killed', 'critical-hit', 'gold-earned', 'item-collected',
      'quest-completed', 'dungeon-cleared', 'enhancement-success',
      'skill-learned', 'nightmare-boss-killed'
    ]
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleEvent as unknown as EventListener)
    })
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleEvent as unknown as EventListener)
      })
    }
  }, [achievementManager])
  
  // 도전과제 목록 가져오기
  const getFilteredAchievements = () => {
    if (!achievementManager) return []
    
    let achievements = achievementManager.getAchievements(
      selectedCategory === 'all' ? undefined : selectedCategory,
      showHidden
    )
    
    // 검색 필터
    if (searchTerm) {
      achievements = achievements.filter(({ achievement }) => 
        achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return achievements
  }
  
  // 보상 수령
  const handleClaimReward = async (achievementId: string) => {
    if (!achievementManager) return
    
    const success = await achievementManager.claimRewards(achievementId)
    if (success) {
      soundManager.playSFX('item_get')
      setStats(achievementManager.getStats())
      setSelectedAchievement(null)
      
      // UI 업데이트를 위해 재로드
      const achievements = getFilteredAchievements()
      const updated = achievements.find(a => a.achievement.id === achievementId)
      if (updated) {
        setSelectedAchievement(updated as any)
      }
      
      // 전역 리소스 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('resources-updated', {
        detail: { type: 'achievement-reward' }
      }))
    }
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
  
  const achievements = getFilteredAchievements()
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          도전과제
        </h2>
        
        {/* 통계 */}
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold">{stats.totalPoints}</span>
              <span className="text-gray-400">포인트</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">{stats.unlockedCount}</span>
              <span className="text-gray-400">/ {stats.totalCount}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 필터 */}
      <div className="space-y-4 mb-6">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              selectedCategory === 'all'
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            )}
          >
            전체
          </button>
          {Object.entries(ACHIEVEMENT_CATEGORY_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                selectedCategory === key
                  ? `${style.bgColor} ${style.color}`
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              {style.label}
            </button>
          ))}
        </div>
        
        {/* 검색 및 옵션 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="도전과제 검색..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
              showHidden
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            )}
          >
            <Lock className="w-4 h-4" />
            숨김
          </button>
        </div>
      </div>
      
      {/* 진행률 요약 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {Object.entries(stats.categoryProgress).map(([category, progress]) => {
            const style = ACHIEVEMENT_CATEGORY_STYLES[category as keyof typeof ACHIEVEMENT_CATEGORY_STYLES]
            const percentage = Math.round((progress.unlocked / progress.total) * 100)
            
            return (
              <div
                key={category}
                className="bg-gray-700/50 rounded-lg p-3 text-center"
              >
                <div className={cn("text-xs mb-1", style.color)}>
                  {style.label}
                </div>
                <div className="text-lg font-bold text-white">
                  {progress.unlocked}/{progress.total}
                </div>
                <div className="text-xs text-gray-400">
                  {percentage}%
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 도전과제 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(({ achievement, progress, percentage }) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            progress={progress as any}
            percentage={percentage}
            onClick={() => setSelectedAchievement({ achievement, progress: progress as any, percentage })}
          />
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          조건에 맞는 도전과제가 없습니다
        </div>
      )}
      
      {/* 새로운 해금 알림 */}
      <AnimatePresence>
        {newUnlocks.map((achievement, index) => (
          <motion.div
            key={`${achievement.id}-${index}`}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ delay: index * 0.2 }}
            className="fixed bottom-4 right-4 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 shadow-2xl max-w-sm"
            onAnimationComplete={() => {
              setTimeout(() => {
                setNewUnlocks(prev => prev.filter(a => a.id !== achievement.id))
              }, 3000)
            }}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-bold">도전과제 달성!</h3>
                <p className="text-yellow-100">{achievement.name}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 상세 모달 */}
      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-xl max-w-2xl w-full p-6"
            >
              <AchievementCard
                achievement={selectedAchievement.achievement}
                progress={selectedAchievement.progress}
                percentage={selectedAchievement.percentage}
                compact={false}
              />
              
              {/* 액션 버튼 */}
              <div className="flex gap-3 mt-6">
                {selectedAchievement.progress?.unlockedAt && 
                 !(selectedAchievement.progress as any)?.claimed && 
                 selectedAchievement.achievement.rewards && (
                  <button
                    onClick={() => handleClaimReward(selectedAchievement.achievement.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-bold hover:from-yellow-700 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    보상 수령
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}