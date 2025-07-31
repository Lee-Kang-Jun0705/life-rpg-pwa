'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DailyContentService } from '@/lib/daily/daily-content-service'
import { EnergyService } from '@/lib/energy/energy-service'
import { useShop } from '@/lib/shop/shop-context'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { DUNGEON_REWARD_ITEMS } from '@/lib/dungeon/reward-items'
import type { DailyContentState, DailyMission } from '@/lib/types/daily-content'
import { DailyMissionCard } from '@/components/daily/DailyMissionCard'
import { LoginRewardCalendar } from '@/components/daily/LoginRewardCalendar'
import { motion } from 'framer-motion'
import { Calendar, Target, Gift, Trophy, Sparkles, Clock, Check, Circle } from 'lucide-react'
import { useToast, toastHelpers } from '@/components/ui/Toast'

export function DailyTab() {
  const [dailyContent, setDailyContent] = useState<DailyContentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addCoins, addItemToInventory } = useShop()
  const { toast } = useToast()
  const dailyService = DailyContentService.getInstance()
  const energyService = EnergyService.getInstance()

  const loadDailyContent = useCallback(async () => {
    try {
      setIsLoading(true)
      const content = await dailyService.initializeDailyContent(GAME_CONFIG.DEFAULT_USER_ID)
      setDailyContent(content)
    } catch (error) {
      console.error('Failed to load daily content:', error)
      setError('일일 콘텐츠를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [dailyService])

  // 일일 콘텐츠 로드
  useEffect(() => {
    loadDailyContent()
  }, [loadDailyContent])

  // 미션 진행도 업데이트
  const handleMissionProgress = async (missionId: string, progress: number) => {
    if (!dailyContent) return

    try {
      const result = await dailyService.updateMissionProgress(
        GAME_CONFIG.DEFAULT_USER_ID,
        missionId,
        progress
      )

      // 상태 새로고침
      await loadDailyContent()

      if (result.completed && result.rewards) {
        // 자동으로 보상 지급
        await handleMissionComplete(missionId)
      }
    } catch (error) {
      console.error('Failed to update mission progress:', error)
    }
  }

  // 미션 완료 처리
  const handleMissionComplete = async (missionId: string) => {
    if (!dailyContent) return

    const mission = dailyContent.missions.find(m => m.id === missionId)
    if (!mission || !mission.isCompleted) return

    try {
      // 보상 지급
      if (mission.rewards.gold) {
        await addCoins(mission.rewards.gold)
      }

      if (mission.rewards.exp) {
        const expPerStat = Math.floor(mission.rewards.exp / 4)
        const statTypes: ('health' | 'learning' | 'relationship' | 'achievement')[] = 
          ['health', 'learning', 'relationship', 'achievement']
        
        for (const statType of statTypes) {
          await dbHelpers.addActivity({
            userId: GAME_CONFIG.DEFAULT_USER_ID,
            statType,
            activityName: '일일 미션 완료',
            description: mission.title,
            experience: expPerStat,
            timestamp: new Date(),
            synced: false
          })
        }
      }

      if (mission.rewards.energy) {
        await energyService.restoreEnergy(
          GAME_CONFIG.DEFAULT_USER_ID,
          mission.rewards.energy,
          `일일 미션 보상: ${mission.title}`
        )
      }

      if (mission.rewards.items) {
        for (const itemId of mission.rewards.items) {
          const rewardItem = DUNGEON_REWARD_ITEMS[itemId]
          if (rewardItem) {
            await addItemToInventory(rewardItem, 1)
          }
        }
      }

      // 주간 도전과제 업데이트
      await dailyService.updateWeeklyChallengeProgress(
        GAME_CONFIG.DEFAULT_USER_ID,
        'weekly-1',
        1
      )

      // 상태 새로고침
      await loadDailyContent()

      // Toast 알림
      toast(toastHelpers.success(
        '미션 완료!',
        `${mission.title} 미션을 완료했습니다. 보상을 획득했습니다!`,
        { duration: 4000 }
      ))
    } catch (error) {
      console.error('Failed to complete mission:', error)
      toast(toastHelpers.error(
        '미션 완료 실패',
        '미션 완료 처리 중 오류가 발생했습니다.',
        { duration: 4000 }
      ))
    }
  }

  // 출석 보상 수령
  const handleClaimLoginReward = async (day: number) => {
    if (!dailyContent) return

    try {
      const rewards = await dailyService.claimLoginReward(
        GAME_CONFIG.DEFAULT_USER_ID,
        day
      )

      if (rewards) {
        // 보상 지급
        if (rewards.gold) {
          await addCoins(rewards.gold)
        }

        if (rewards.exp) {
          const expPerStat = Math.floor(rewards.exp / 4)
          const statTypes: ('health' | 'learning' | 'relationship' | 'achievement')[] = 
            ['health', 'learning', 'relationship', 'achievement']
          
          for (const statType of statTypes) {
            await dbHelpers.addActivity({
              userId: GAME_CONFIG.DEFAULT_USER_ID,
              statType,
              activityName: '출석 보상',
              description: `${day}일차 출석`,
              experience: expPerStat,
              timestamp: new Date(),
              synced: false
            })
          }
        }

        if (rewards.energy) {
          await energyService.restoreEnergy(
            GAME_CONFIG.DEFAULT_USER_ID,
            rewards.energy,
            `출석 보상: ${day}일차`
          )
        }

        if (rewards.tickets) {
          // TODO: 티켓 지급 구현
        }

        if (rewards.items) {
          for (const itemId of rewards.items) {
            const rewardItem = DUNGEON_REWARD_ITEMS[itemId]
            if (rewardItem) {
              await addItemToInventory(rewardItem, 1)
            }
          }
        }

        // 상태 새로고침
        await loadDailyContent()

        // Toast 알림
        toast(toastHelpers.success(
          '출석 보상 획득!',
          `${day}일차 출석 보상을 받았습니다!`,
          { duration: 4000 }
        ))
      }
    } catch (error) {
      console.error('Failed to claim login reward:', error)
      toast(toastHelpers.error(
        '출석 보상 수령 실패',
        '보상 수령 중 오류가 발생했습니다.',
        { duration: 4000 }
      ))
    }
  }

  // 주간 도전과제 보상 수령
  const handleClaimWeeklyReward = async () => {
    if (!dailyContent || !dailyContent.weeklyChallenge) return

    try {
      const rewards = await dailyService.claimWeeklyChallengeReward(
        GAME_CONFIG.DEFAULT_USER_ID
      )

      if (rewards) {
        // 보상 지급 로직
        await addCoins(rewards.gold)
        
        // 경험치 지급
        const expPerStat = Math.floor(rewards.exp / 4)
        const statTypes: ('health' | 'learning' | 'relationship' | 'achievement')[] = 
          ['health', 'learning', 'relationship', 'achievement']
        
        for (const statType of statTypes) {
          await dbHelpers.addActivity({
            userId: GAME_CONFIG.DEFAULT_USER_ID,
            statType,
            activityName: '주간 도전과제 완료',
            description: '주간 마스터',
            experience: expPerStat,
            timestamp: new Date(),
            synced: false
          })
        }

        // 아이템 지급
        for (const itemId of rewards.items) {
          const rewardItem = DUNGEON_REWARD_ITEMS[itemId]
          if (rewardItem) {
            await addItemToInventory(rewardItem, 1)
          }
        }

        // 상태 새로고침
        await loadDailyContent()

        // Toast 알림
        toast(toastHelpers.success(
          '주간 도전과제 완료!',
          '주간 도전과제 보상을 모두 획득했습니다!',
          { duration: 5000 }
        ))
      }
    } catch (error) {
      console.error('Failed to claim weekly reward:', error)
      toast(toastHelpers.error(
        '주간 보상 수령 실패',
        '보상 수령 중 오류가 발생했습니다.',
        { duration: 4000 }
      ))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error || !dailyContent) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500">{error || '콘텐츠를 불러올 수 없습니다'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 출석 보상 */}
      <section>
        <LoginRewardCalendar
          loginRewards={dailyContent.loginRewards}
          currentStreak={dailyContent.loginStreak}
          onClaimReward={handleClaimLoginReward}
        />
      </section>

      {/* 일일 미션 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            일일 미션
          </h2>
          <div className="text-sm text-gray-500">
            완료: {dailyContent.missions.filter(m => m.isCompleted).length} / {dailyContent.missions.length}
          </div>
        </div>
        
        <div className="space-y-4">
          {dailyContent.missions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DailyMissionCard
                mission={mission}
                onProgress={handleMissionProgress}
                onComplete={handleMissionComplete}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 요일별 던전 */}
      {dailyContent.dailyDungeons.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            오늘의 특별 던전
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyContent.dailyDungeons.map(dungeon => (
              <motion.div
                key={dungeon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700"
              >
                <h3 className="text-xl font-bold mb-2">{dungeon.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {dungeon.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>경험치 배율</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      x{dungeon.bonusRewards.expMultiplier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>골드 배율</span>
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">
                      x{dungeon.bonusRewards.goldMultiplier}
                    </span>
                  </div>
                  {dungeon.bonusRewards.guaranteedItems && (
                    <div className="text-sm">
                      <span>보장 아이템: </span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {dungeon.bonusRewards.guaranteedItems.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {dungeon.attempts} / {dungeon.maxAttempts} 시도
                  </span>
                  <button
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    disabled={!dungeon.isAvailable}
                  >
                    던전 탭으로 이동
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 주간 도전과제 */}
      {dailyContent.weeklyChallenge && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-500" />
            주간 도전과제
          </h2>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border-2 border-orange-300 dark:border-orange-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {dailyContent.weeklyChallenge.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {dailyContent.weeklyChallenge.description}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {Math.floor(dailyContent.weeklyChallenge.progress)}%
                </div>
                <div className="text-xs text-gray-500">진행도</div>
              </div>
            </div>
            
            {/* 미션 목록 */}
            <div className="space-y-3 mb-4">
              {dailyContent.weeklyChallenge.missions.map(mission => (
                <div
                  key={mission.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    mission.completed
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {mission.completed ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={mission.completed ? 'line-through text-gray-500' : ''}>
                      {mission.description}
                    </span>
                  </div>
                  <span className="font-medium">
                    {mission.current} / {mission.target}
                  </span>
                </div>
              ))}
            </div>
            
            {/* 보상 */}
            <div className="border-t border-orange-200 dark:border-orange-800 pt-4">
              <h4 className="font-semibold mb-2">완료 보상</h4>
              <div className="flex flex-wrap gap-3 text-sm mb-4">
                <span>🏆 {dailyContent.weeklyChallenge.rewards.exp} EXP</span>
                <span>💰 {dailyContent.weeklyChallenge.rewards.gold} 골드</span>
                {dailyContent.weeklyChallenge.rewards.items.map((item, i) => (
                  <span key={i}>📦 {item}</span>
                ))}
                {dailyContent.weeklyChallenge.rewards.title && (
                  <span>🏅 칭호: {dailyContent.weeklyChallenge.rewards.title}</span>
                )}
              </div>
              
              {dailyContent.weeklyChallenge.isCompleted && (
                <button
                  onClick={handleClaimWeeklyReward}
                  disabled={dailyContent.weeklyChallenge.isClaimed}
                  className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {dailyContent.weeklyChallenge.isClaimed ? '수령 완료' : '보상 수령'}
                </button>
              )}
            </div>
            
            {/* 남은 시간 */}
            <div className="flex items-center justify-end mt-4 text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                {Math.floor(
                  (new Date(dailyContent.weeklyChallenge.endDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
                )}일 남음
              </span>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  )
}