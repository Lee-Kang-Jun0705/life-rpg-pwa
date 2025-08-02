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
      // 보상 처리
      await addCoins(result.rewards.gold || 0)

      // 경험치 분배
      const totalExp = result.experience || 0
      const expPerStat = Math.floor(totalExp / 4)
      const statTypes: ('health' | 'learning' | 'relationship' | 'achievement')[] =
        ['health', 'learning', 'relationship', 'achievement']

      for (const statType of statTypes) {
        await dbHelpers.addActivity({
          userId: GAME_CONFIG.DEFAULT_USER_ID,
          statType,
          activityName: '전투 승리 보상',
          description: `몬스터 처치`,
          experience: expPerStat,
          timestamp: new Date()
        })
      }

      // 아이템 보상
      if (result.rewards.items && result.rewards.items.length > 0) {
        for (const itemId of result.rewards.items) {
          const rewardItem = DUNGEON_REWARD_ITEMS[itemId]
          if (rewardItem) {
            await addItemToInventory(rewardItem, 1)
          }
        }
      }

      setEarnedRewards({
        exp: totalExp,
        coins: result.rewards.gold || 0,
        items: [...result.rewards.items]
      })
      setShowRewardModal(true)
    }
  }

  const handlePurchaseTickets = async() => {
    if (coins < 100) {
      alert('골드가 부족합니다')
      return
    }

    try {
      // 골드 차감
      await addCoins(-100)

      // 티켓 구매
      const amount = await ticketService.purchaseTickets(
        GAME_CONFIG.DEFAULT_USER_ID,
        100
      )

      alert(`티켓 ${amount}장을 구매했습니다`)
    } catch (error) {
      alert(error instanceof Error ? error.message : '티켓 구매 실패')
    }
  }

  if (isBattling && selectedMonsterId) {
    return (
      <AutoBattleScreen
        monsterId={selectedMonsterId}
        onBattleEnd={handleBattleEnd}
      />
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                ⚔️ 자동전투
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                티켓을 사용해 몬스터와 전투하고 보상을 획득하세요!
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-64">
                <OptimizedEnergyDisplay userId={GAME_CONFIG.DEFAULT_USER_ID} />
              </div>
              <div className="w-64">
                <OptimizedBattleTicketDisplay
                  userId={GAME_CONFIG.DEFAULT_USER_ID}
                  onTicketChange={setTicketCount}
                  onPurchase={handlePurchaseTickets}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 전투 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                자동전투 시스템
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                전투 티켓을 소비하여 자동전투를 진행합니다.
                캐릭터가 자동으로 스킬을 사용하여 전투를 수행하며,
                속도 조절이 가능합니다. 전투에서 승리하면 경험치, 골드, 아이템을 획득할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 몬스터 목록 */}
        <div className="space-y-8">
          {/* 일반 몬스터 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-green-500">
              🟢 일반 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.common.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onBattle={handleStartBattle}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </section>

          {/* 엘리트 몬스터 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-blue-500">
              🔵 엘리트 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.elite.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onBattle={handleStartBattle}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </section>

          {/* 보스 몬스터 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-purple-500">
              🟣 보스 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.boss.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onBattle={handleStartBattle}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </section>

          {/* 전설 몬스터 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-orange-500">
              🟠 전설 몬스터
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monstersByTier.legendary.map(monster => (
                <MonsterCard
                  key={monster.id}
                  monster={monster}
                  onBattle={handleStartBattle}
                  disabled={ticketCount <= 0}
                />
              ))}
            </div>
          </section>
        </div>

        <RewardModal
          isOpen={showRewardModal}
          onClose={() => {
            setShowRewardModal(false)
            setEarnedRewards(null)
          }}
          rewards={earnedRewards}
        />
      </div>
    </div>
  )
}

// 몬스터 카드 컴포넌트
function MonsterCard({
  monster,
  onBattle,
  disabled
}: {
  monster: MonsterData
  _onBattle: (monsterId: string) => void
  disabled: boolean
}) {
  const tierColors: Record<string, string> = {
    common: 'border-green-500',
    elite: 'border-blue-500',
    boss: 'border-purple-500',
    legendary: 'border-orange-500'
  }

  const tierBgColors: Record<string, string> = {
    common: 'bg-green-50 dark:bg-green-900/20',
    elite: 'bg-blue-50 dark:bg-blue-900/20',
    boss: 'bg-purple-50 dark:bg-purple-900/20',
    legendary: 'bg-orange-50 dark:bg-orange-900/20'
  }

  const tierColor = tierColors[monster.tier as string] || tierColors.common
  const tierBgColor = tierBgColors[monster.tier as string] || tierBgColors.common

  return (
    <div className={`border-2 ${tierColor} rounded-lg p-4 ${tierBgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{monster.emoji || '👾'}</span>
          <div>
            <h3 className="font-bold text-lg">{monster.name}</h3>
            <p className="text-sm text-gray-600">Lv.{monster.level}</p>
          </div>
        </div>
      </div>

      {/* 스탯 표시 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-gray-500" />
          <span>HP: {monster.stats.hp}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Sword className="w-4 h-4 text-gray-500" />
          <span>공격력: {monster.stats.attack}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-gray-500" />
          <span>속도: {monster.stats.speed}</span>
        </div>
      </div>

      {/* 보상 표시 */}
      <div className="bg-white/50 dark:bg-black/20 rounded p-2 mb-3">
        <p className="text-xs font-semibold mb-1">보상</p>
        <div className="flex items-center gap-2 text-xs">
          <span>⚡ {monster.rewards?.experience || monster.rewards?.exp || 0} EXP</span>
          <span>💰 {monster.rewards?.gold || 0} 골드</span>
        </div>
      </div>

      {/* 원소 속성 */}
      {monster.element && (
        <div className="text-xs text-gray-600 mb-3">
          원소: {monster.element === 'fire' ? '🔥 화염' :
            monster.element === 'ice' ? '❄️ 빙결' :
              monster.element === 'electric' ? '⚡ 전기' :
                monster.element === 'wind' ? '🌪️ 바람' :
                  monster.element === 'earth' ? '🗿 대지' :
                    monster.element === 'water' ? '💧 물' :
                      monster.element === 'dark' ? '🌑 어둠' :
                        monster.element === 'light' ? '✨ 빛' : '무속성'}
        </div>
      )}

      <button
        onClick={() => onBattle(monster.id)}
        disabled={disabled}
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {disabled ? '티켓 부족' : '전투 시작'}
      </button>
    </div>
  )
}
