'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sword, Shield, Heart, Star, ChevronRight, X, Loader2 } from 'lucide-react'
import { JRPGBattleManager, type BattleState } from '@/lib/jrpg/battle-manager'
import { PokemonAutoBattleUI } from '@/components/dungeon/PokemonAutoBattleUI'
import { AutoBattleManager } from '@/lib/jrpg/auto-battle-manager'
import { JRPGQuestManager } from '@/lib/jrpg/quest-manager'
import { MONSTER_DATABASE } from '@/lib/jrpg/monsters-database'
import { ITEM_DATABASE } from '@/lib/jrpg/items-database'
import { jrpgDbHelpers } from '@/lib/jrpg/database-helpers'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { useUserStore } from '@/lib/stores/userStore'
import { createScaledMonster } from '@/lib/jrpg/monster-scaling'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { Difficulty, DIFFICULTY_MODIFIERS } from '@/lib/jrpg/types'
import { soundManager } from '@/lib/jrpg/sound-system'
import type { SkillInstance, ItemInstance } from '@/lib/jrpg/types'
import { useToast } from '@/components/ui/Toast'

// 던전 정의
const DUNGEONS = [
  {
    id: 'beginner',
    name: '초보자의 숲',
    description: '초보 모험가를 위한 안전한 숲',
    recommendedLevel: 1,
    floors: 5,
    monsters: ['monster_001', 'monster_002'],
    boss: 'monster_003'
  },
  {
    id: 'cave',
    name: '어둠의 동굴',
    description: '위험한 몬스터가 서식하는 동굴',
    recommendedLevel: 5,
    floors: 7,
    monsters: ['monster_003', 'monster_004'],
    boss: 'monster_005'
  },
  {
    id: 'tower',
    name: '마법사의 탑',
    description: '강력한 마법 생물들이 지키는 탑',
    recommendedLevel: 10,
    floors: 10,
    monsters: ['monster_005', 'monster_006'],
    boss: 'monster_007'
  }
]

interface DungeonProgress {
  dungeonId: string
  currentFloor: number
  totalGold: number
  totalExp: number
}

export function DungeonBattleTab() {
  const user = useUserStore(state => state.user)
  const userId = user?.id || GAME_CONFIG.DEFAULT_USER_ID
  const { addCoins } = useUserStore()
  const { toast } = useToast()
  
  const [selectedDungeon, setSelectedDungeon] = useState<typeof DUNGEONS[0] | null>(null)
  const [currentProgress, setCurrentProgress] = useState<DungeonProgress | null>(null)
  const [battleManager, setBattleManager] = useState<JRPGBattleManager | null>(null)
  const [autoBattleManager, setAutoBattleManager] = useState<AutoBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [characterLevel, setCharacterLevel] = useState(1)
  const [equippedSkills, setEquippedSkills] = useState<SkillInstance[]>([])
  const [inventory, setInventory] = useState<ItemInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [questManager, setQuestManager] = useState<JRPGQuestManager | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.NORMAL)
  
  // 캐릭터 데이터 로드
  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        // 레벨 계산
        const stats = await dbHelpers.getStats(userId)
        if (stats && stats.length > 0) {
          const level = calculateCharacterLevel(stats)
          setCharacterLevel(level)
          
          // 퀘스트 매니저 초기화
          const manager = new JRPGQuestManager(userId, level)
          await manager.loadProgress()
          setQuestManager(manager)
        }
        
        // 장착된 스킬 로드
        const skills = await jrpgDbHelpers.getJRPGSkills(userId)
        if (skills && skills.skills && Array.isArray(skills.skills)) {
          // equippedSkills 배열에서 실제 스킬 찾기
          const equippedSkillIds = skills.equippedSkills || []
          const equipped = equippedSkillIds
            .map((skillId, index) => {
              const skill = skills.skills.find(s => s.skillId === skillId)
              if (skill) {
                return { ...skill, equippedSlot: index }
              }
              return null
            })
            .filter(s => s !== null) as SkillInstance[]
          setEquippedSkills(equipped)
        } else {
          setEquippedSkills([])
        }
        
        // 인벤토리 로드
        const inv = await jrpgDbHelpers.getJRPGInventory(userId)
        if (inv && inv.items && Array.isArray(inv.items)) {
          setInventory(inv.items.filter(item => {
            const itemDef = ITEM_DATABASE[item.itemId]
            return itemDef?.type === 'consumable'
          }))
        } else {
          setInventory([])
        }
      } catch (error) {
        console.error('Failed to load character data:', error)
      }
    }
    
    loadCharacterData()
  }, [userId])
  
  // 던전 선택
  const selectDungeon = (dungeon: typeof DUNGEONS[0]) => {
    setSelectedDungeon(dungeon)
    setCurrentProgress({
      dungeonId: dungeon.id,
      currentFloor: 1,
      totalGold: 0,
      totalExp: 0
    })
    // 던전 진입 BGM (던전 탭에서는 비활성화)
    // soundManager.playBGM('dungeon', true)
  }
  
  // 전투 시작
  const startBattle = useCallback(async () => {
    if (!selectedDungeon || !currentProgress) return
    
    setIsLoading(true)
    
    try {
      // 몬스터 선택 (보스 층이면 보스, 아니면 일반 몬스터)
      const isBossFloor = currentProgress.currentFloor === selectedDungeon.floors
      const monsterIds = isBossFloor 
        ? [selectedDungeon.boss]
        : selectedDungeon.monsters
        
      // 몬스터 스케일링 적용
      const scaledMonster = createScaledMonster(
        selectedDungeon.id,
        selectedDungeon.level,
        currentProgress.currentFloor,
        selectedDifficulty
      )
      
      if (!scaledMonster) {
        console.error('Failed to create scaled monster')
        return
      }
      
      console.log('[DungeonBattleTab] Starting battle with scaled monster:', {
        id: scaledMonster.id,
        name: scaledMonster.name,
        level: scaledMonster.level,
        stats: scaledMonster.stats,
        difficulty: selectedDifficulty,
        floor: currentProgress.currentFloor
      })
      
      // 전투 매니저 생성 - 스케일된 몬스터 사용
      const manager = new JRPGBattleManager(
        userId,
        characterLevel || 1, // 기본값 1로 설정하여 NaN 방지
        [scaledMonster],
        (state) => setBattleState(state),
        selectedDifficulty
      )
      
      // 플레이어 스킬 로드 (이미 equippedSkills를 DB에서 로드함)
      await manager.loadPlayerSkills()
      
      setBattleManager(manager)
      
      // 자동전투 매니저 생성
      const autoManager = new AutoBattleManager(
        manager,
        (state) => setBattleState(state),
        1000 // 기본 속도
      )
      setAutoBattleManager(autoManager)
      
      // 자동전투 시작
      setTimeout(() => {
        autoManager.start()
      }, 1000)
      
      // 보스전인지 확인하고 BGM 변경
      if (isBossFloor) {
        // soundManager.playBGM('boss', true)
      } else {
        // soundManager.playBGM('battle', true)
      }
    } catch (error) {
      console.error('Failed to start battle:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDungeon, currentProgress, userId, characterLevel, selectedDifficulty, equippedSkills])
  
  
  // 전투 종료 처리
  const handleBattleEnd = useCallback(async () => {
    if (!battleManager || !battleState || !currentProgress || !selectedDungeon) return
    
    const result = battleManager.getResult()
    
    if (battleState.result === 'victory' && result) {
      // 몬스터 처치로 퀘스트 진행 업데이트
      if (questManager) {
        for (const enemy of battleState.enemyUnits) {
          if (enemy.currentHp <= 0) {
            // 몬스터 ID 찾기
            const monsterDef = Object.entries(MONSTER_DATABASE).find(([id, def]) => def.name === enemy.name)
            if (monsterDef) {
              await questManager.updateQuestProgress('defeat', monsterDef[0], 1)
            }
          }
        }
      }
      
      // 난이도 보상 배율 적용
      const difficultyMod = DIFFICULTY_MODIFIERS[selectedDifficulty]
      const modifiedGold = Math.floor(result.gold * difficultyMod.rewardMultiplier)
      const modifiedExp = Math.floor(result.exp * difficultyMod.rewardMultiplier)
      
      // 보상 지급
      setCurrentProgress(prev => prev ? {
        ...prev,
        totalGold: prev.totalGold + modifiedGold,
        totalExp: prev.totalExp + modifiedExp
      } : null)
      
      // 코인 추가
      addCoins(modifiedGold)
      soundManager.playSFX('gold_get')
      
      // 골드 획득 이벤트 발송
      window.dispatchEvent(new CustomEvent('gold-earned', { detail: { amount: modifiedGold } }))
      
      // 아이템 드롭 처리
      if (result.items && result.items.length > 0) {
        for (const drop of result.items) {
          await jrpgDbHelpers.addItemToInventory(userId, drop.itemId, 1)
          
          // 아이템 획득 이벤트 발송
          const itemDef = ITEM_DATABASE[drop.itemId]
          if (itemDef) {
            window.dispatchEvent(new CustomEvent('item-collected', { 
              detail: { 
                itemId: drop.itemId, 
                rarity: drop.rarity || itemDef.rarity,
                itemName: itemDef.name 
              } 
            }))
          }
        }
        
        // 드롭 아이템 알림
        const itemNames = result.items.map(drop => {
          const itemDef = ITEM_DATABASE[drop.itemId]
          return itemDef ? itemDef.name : '알 수 없는 아이템'
        }).join(', ')
        
        console.log(`아이템 획득: ${itemNames}`)
      }
      
      // 다음 층으로
      if (currentProgress.currentFloor < selectedDungeon.floors) {
        setCurrentProgress(prev => prev ? {
          ...prev,
          currentFloor: prev.currentFloor + 1
        } : null)
        setBattleManager(null)
        setBattleState(null)
        // 던전 BGM으로 복귀
        // soundManager.playBGM('dungeon', true)
      } else {
        // 던전 클리어
        soundManager.playSFX('quest_complete')
        
        // 던전 클리어 이벤트 발송
        window.dispatchEvent(new CustomEvent('dungeon-cleared', { 
          detail: { 
            dungeonId: selectedDungeon.id,
            dungeonName: selectedDungeon.name,
            difficulty: selectedDifficulty
          } 
        }))
        
        setTimeout(() => {
          alert(`던전 클리어! 총 보상: ${currentProgress.totalGold + modifiedGold} 골드, ${currentProgress.totalExp + modifiedExp} 경험치`)
          exitDungeon()
        }, 2000)
      }
    } else {
      // 패배 또는 도망
      setTimeout(() => {
        exitDungeon()
      }, 2000)
    }
  }, [battleManager, battleState, currentProgress, selectedDungeon, addCoins, questManager])
  
  // 던전 나가기
  const exitDungeon = () => {
    // 자동전투 중지
    if (autoBattleManager) {
      autoBattleManager.stop()
      setAutoBattleManager(null)
    }
    
    setSelectedDungeon(null)
    setCurrentProgress(null)
    setBattleManager(null)
    setBattleState(null)
    // 타운 BGM으로 복귀
    // soundManager.playBGM('town', true)
  }
  
  // 전투 상태 변경 감지
  useEffect(() => {
    if (battleState?.result) {
      handleBattleEnd()
    }
  }, [battleState?.result, handleBattleEnd])
  
  // 던전 목록 화면
  if (!selectedDungeon) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-4">던전 탐험</h2>
        
        {/* 난이도 선택 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-3">난이도 선택</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(Difficulty).map(diff => {
              const modifier = DIFFICULTY_MODIFIERS[diff]
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDifficulty === diff
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold text-white mb-1">
                    {diff === Difficulty.EASY && '초급'}
                    {diff === Difficulty.NORMAL && '중급'}
                    {diff === Difficulty.HARD && '상급'}
                    {diff === Difficulty.NIGHTMARE && '악몽'}
                  </div>
                  <div className="text-xs text-gray-400">
                    <div>데미지: {Math.round(modifier.damageMultiplier * 100)}%</div>
                    <div>보상: {Math.round(modifier.rewardMultiplier * 100)}%</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DUNGEONS.map(dungeon => (
            <motion.div
              key={dungeon.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => selectDungeon(dungeon)}
            >
              <h3 className="text-xl font-bold text-white mb-2">{dungeon.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{dungeon.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">권장 레벨</span>
                  <span className={characterLevel >= dungeon.recommendedLevel ? 'text-green-400' : 'text-red-400'}>
                    Lv.{dungeon.recommendedLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">층수</span>
                  <span className="text-white">{dungeon.floors}층</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }
  
  // 전투 화면
  if (battleState) {
    return (
      <PokemonAutoBattleUI
        battleState={battleState}
        onExit={exitDungeon}
        battleManager={battleManager}
        autoBattleManager={autoBattleManager}
        damageEvents={battleState.damageEvents}
        skillEvents={battleState.skillEvents}
      />
    )
  }
  
  // 던전 진행 화면
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedDungeon.name}</h2>
          <p className="text-gray-400">{currentProgress?.currentFloor}층 / {selectedDungeon.floors}층</p>
        </div>
        <button
          onClick={exitDungeon}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* 진행 상황 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">획득 골드</span>
          </div>
          <div className="text-2xl font-bold text-white">{currentProgress?.totalGold || 0}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Heart className="w-4 h-4" />
            <span className="text-sm">획득 경험치</span>
          </div>
          <div className="text-2xl font-bold text-white">{currentProgress?.totalExp || 0}</div>
        </div>
      </div>
      
      {/* 전투 시작 버튼 */}
      <div className="text-center">
        <button
          onClick={startBattle}
          disabled={isLoading}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2 mx-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              준비 중...
            </>
          ) : (
            <>
              <Sword className="w-5 h-5" />
              전투 시작
            </>
          )}
        </button>
      </div>
    </div>
  )
}