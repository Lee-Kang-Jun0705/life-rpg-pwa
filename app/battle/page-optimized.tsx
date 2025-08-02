'use client'

import { useState } from 'react'
import { useShop } from '@/lib/shop/shop-context'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { getMonstersByTier } from '@/lib/battle/monster-database'
import { AutoBattleScreen } from '@/components/battle/AutoBattleScreen'
import { OptimizedBattleTicketDisplay } from '@/components/battle/OptimizedBattleTicketDisplay'
import { OptimizedEnergyDisplay } from '@/components/energy/OptimizedEnergyDisplay'
import { DUNGEON_REWARD_ITEMS } from '@/lib/dungeon/reward-items'
import { RewardModal } from '@/components/dungeon/RewardModal'
import { BattleTicketService } from '@/lib/battle/ticket-service'
import { Sword, Trophy, Shield, Zap } from 'lucide-react'
import type { BattleResult, MonsterData } from '@/lib/types/battle-extended'
import { CollectionService } from '@/lib/collection/collection-service'
import { AchievementService } from '@/lib/achievements/achievement-service'

export default function BattlePage() {
  const { addCoins, addItemToInventory, coins } = useShop()
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null)
  const [isBattling, setIsBattling] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [earnedRewards, setEarnedRewards] = useState<{ exp: number; coins: number; items?: string[] } | null>(null)
  const [ticketCount, setTicketCount] = useState(0)

  const ticketService = BattleTicketService.getInstance()

  // 몬스터 티어별 그룹
  const monstersByTier = {
    common: getMonstersByTier('common'),
    elite: getMonstersByTier('elite'),
    boss: getMonstersByTier('boss'),
    legendary: getMonstersByTier('legendary')
  }

  const handleStartBattle = async(monsterId: string) => {
    // 티켓 체크는 AutoBattleScreen에서 수행
    setSelectedMonsterId(monsterId)
    setIsBattling(true)
  }

  const handleBattleEnd = async(result: BattleResult) => {
    setIsBattling(false)
    setSelectedMonsterId(null)

    if (result.winner === 'player' && result.rewards) {
      // 도감 서비스 초기화
      const collectionService = CollectionService.getInstance()
      const achievementService = AchievementService.getInstance()

      // 몬스터 처치 기록 (도감)
      if (selectedMonsterId) {
        await collectionService.recordMonsterDefeat(
          GAME_CONFIG.DEFAULT_USER_ID,
          selectedMonsterId
        )
      }

      // 업적 진행
      await achievementService.updateProgress(
        GAME_CONFIG.DEFAULT_USER_ID,
        'battles-won',
        1
      )

      // 특정 몬스터 처치 업적
      if (selectedMonsterId) {
        await achievementService.updateProgress(
          GAME_CONFIG.DEFAULT_USER_ID,
          `${selectedMonsterId}-slayer`,
          1
        )
      }

      // 보상 처리
      await addCoins(result.rewards.gold || 0)

      // 골드 획득 업적
      if (result.rewards.gold) {
        await achievementService.updateProgress(
          GAME_CONFIG.DEFAULT_USER_ID,
          'gold-earned',
          result.rewards.gold
        )
      }

      // 아이템 보상
      if (result.rewards.items) {
        for (const itemId of result.rewards.items) {
          const item = DUNGEON_REWARD_ITEMS.find(i => i.id === itemId)
          if (item) {
            await addItemToInventory({
              id: itemId,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              rarity: item.rarity,
              icon: item.icon
            })
          }
        }

        // 아이템 획득 업적
        await achievementService.updateProgress(
          GAME_CONFIG.DEFAULT_USER_ID,
          'items-collected',
          result.rewards.items.length
        )
      }

      setEarnedRewards({
        exp: 0, // 경험치는 제거
        coins: result.rewards.gold || 0,
        items: result.rewards.items
      })
      setShowRewardModal(true)
    }
  }

  if (isBattling && selectedMonsterId) {
    const allMonsters = [
      ...monstersByTier.common,
      ...monstersByTier.elite,
      ...monstersByTier.boss,
      ...monstersByTier.legendary
    ]
    const monster = allMonsters.find(m => m.id === selectedMonsterId)

    if (monster) {
      return (
        <AutoBattleScreen
          monster={monster}
          onBattleEnd={handleBattleEnd}
          userId={GAME_CONFIG.DEFAULT_USER_ID}
        />
      )
    }
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sword className="w-8 h-8 text-red-500" />
            배틀 아레나
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            몬스터를 처치하고 보상을 획득하세요
          </p>
        </div>

        {/* 리소스 표시 - 최적화된 컴포넌트 사용 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <OptimizedEnergyDisplay
            userId={GAME_CONFIG.DEFAULT_USER_ID}
          />
          <OptimizedBattleTicketDisplay
            userId={GAME_CONFIG.DEFAULT_USER_ID}
            onTicketChange={setTicketCount}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">코인</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{coins}</span>
            </div>
          </div>
        </div>

        {/* 몬스터 목록 */}
        <div className="space-y-8">
          {/* Common 몬스터 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              일반 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.common.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onSelect={() => handleStartBattle(monster.id)}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </div>

          {/* Elite 몬스터 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              정예 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.elite.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onSelect={() => handleStartBattle(monster.id)}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </div>

          {/* Boss 몬스터 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
              보스 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.boss.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onSelect={() => handleStartBattle(monster.id)}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </div>

          {/* Legendary 몬스터 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-orange-600 dark:text-orange-400">
              전설 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.legendary.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onSelect={() => handleStartBattle(monster.id)}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 보상 모달 */}
        {showRewardModal && earnedRewards && (
          <RewardModal
            exp={earnedRewards.exp}
            coins={earnedRewards.coins}
            items={earnedRewards.items}
            onClose={() => setShowRewardModal(false)}
          />
        )}
      </div>
    </div>
  )
}

// 몬스터 카드 컴포넌트
function MonsterCard({
  monster,
  onSelect,
  disabled
}: {
  monster: MonsterData
  onSelect: () => void
  disabled?: boolean
}) {
  const tierColors = {
    common: 'border-gray-300 bg-gray-50',
    elite: 'border-blue-300 bg-blue-50',
    boss: 'border-purple-300 bg-purple-50',
    legendary: 'border-orange-300 bg-orange-50'
  }

  return (
    <div
      className={`
        relative rounded-xl p-4 border-2 transition-all cursor-pointer
        ${tierColors[monster.tier]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'}
      `}
      onClick={() => !disabled && onSelect()}
    >
      {/* 몬스터 정보 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{monster.name}</h3>
          <p className="text-sm text-gray-600">Lv.{monster.level}</p>
        </div>
        <span className="text-2xl">{monster.icon}</span>
      </div>

      {/* 스탯 */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">체력</span>
          <span className="font-medium">{monster.health}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">공격력</span>
          <span className="font-medium">{monster.attack}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">방어력</span>
          <span className="font-medium">{monster.defense}</span>
        </div>
      </div>

      {/* 보상 정보 */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">경험치</span>
          <span className="font-medium text-green-600">{monster.exp}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">골드</span>
          <span className="font-medium text-yellow-600">{monster.goldReward}</span>
        </div>
      </div>

      {/* 티켓 부족 시 오버레이 */}
      {disabled && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
          <p className="text-white font-medium">티켓 필요</p>
        </div>
      )}
    </div>
  )
}
