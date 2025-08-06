import { useState, useEffect, useCallback } from 'react'
import { JRPGBattleManager, type BattleState } from '@/lib/jrpg/battle-manager'
import { AutoBattleManager } from '@/lib/jrpg/auto-battle-manager'
import { JRPGQuestManager } from '@/lib/jrpg/quest-manager'
import { MONSTER_DATABASE } from '@/lib/jrpg/monsters-database'
import { ITEM_DATABASE } from '@/lib/jrpg/items-database'
import { createScaledMonster } from '@/lib/jrpg/monster-scaling'
import { soundManager } from '@/lib/jrpg/sound-system'
import { Difficulty, DIFFICULTY_MODIFIERS } from '@/lib/jrpg/types'
import type { DungeonDefinition } from '@/components/dungeon/DungeonSelector'
import type { DungeonProgressData } from '@/components/dungeon/DungeonProgress'
import { jrpgDbHelpers } from '@/lib/jrpg/database-helpers'

interface UseDungeonBattleProps {
  userId: string
  characterLevel: number
  selectedDungeon: DungeonDefinition | null
  currentProgress: DungeonProgressData | null
  selectedDifficulty: Difficulty
  questManager: JRPGQuestManager | null
  onProgressUpdate: (progress: DungeonProgressData) => void
  onDungeonClear: () => void
  onExit: () => void
  addCoins: (amount: number) => void
}

export function useDungeonBattle({
  userId,
  characterLevel,
  selectedDungeon,
  currentProgress,
  selectedDifficulty,
  questManager,
  onProgressUpdate,
  onDungeonClear,
  onExit,
  addCoins
}: UseDungeonBattleProps) {
  const [battleManager, setBattleManager] = useState<JRPGBattleManager | null>(null)
  const [autoBattleManager, setAutoBattleManager] = useState<AutoBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 전투 시작
  const startBattle = useCallback(async () => {
    if (!selectedDungeon || !currentProgress) return
    
    setIsLoading(true)
    
    try {
      // 몬스터 선택 (보스 층이면 보스, 아니면 일반 몬스터)
      const isBossFloor = currentProgress.currentFloor === selectedDungeon.floors
      
      // 몬스터 스케일링 적용
      const scaledMonster = createScaledMonster(
        selectedDungeon.id,
        selectedDungeon.level || selectedDungeon.recommendedLevel,
        currentProgress.currentFloor,
        selectedDifficulty
      )
      
      if (!scaledMonster) {
        console.error('Failed to create scaled monster')
        return
      }
      
      // 전투 매니저 생성
      const manager = new JRPGBattleManager(
        userId,
        characterLevel || 1,
        [scaledMonster],
        (state) => setBattleState(state),
        selectedDifficulty
      )
      
      // 플레이어 스킬 로드
      await manager.loadPlayerSkills()
      
      setBattleManager(manager)
      
      // 자동전투 매니저 생성
      const autoManager = new AutoBattleManager(
        manager,
        (state) => setBattleState(state),
        1000
      )
      setAutoBattleManager(autoManager)
      
      // 자동전투 시작
      setTimeout(() => {
        autoManager.start()
      }, 1000)
      
      // 보스전인지 확인하고 BGM 변경 (선택적)
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
  }, [selectedDungeon, currentProgress, userId, characterLevel, selectedDifficulty])

  // 전투 종료 처리
  const handleBattleEnd = useCallback(async () => {
    if (!battleManager || !battleState || !currentProgress || !selectedDungeon) return
    
    const result = battleManager.getResult()
    
    if (battleState.result === 'victory' && result) {
      // 몬스터 처치로 퀘스트 진행 업데이트
      if (questManager) {
        for (const enemy of battleState.enemyUnits) {
          if (enemy.currentHp <= 0) {
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
      const newProgress = {
        ...currentProgress,
        totalGold: currentProgress.totalGold + modifiedGold,
        totalExp: currentProgress.totalExp + modifiedExp
      }
      onProgressUpdate(newProgress)
      
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
      }
      
      // 다음 층으로
      if (currentProgress.currentFloor < selectedDungeon.floors) {
        onProgressUpdate({
          ...newProgress,
          currentFloor: currentProgress.currentFloor + 1
        })
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
          alert(`던전 클리어! 총 보상: ${newProgress.totalGold} 골드, ${newProgress.totalExp} 경험치`)
          onDungeonClear()
        }, 2000)
      }
    } else {
      // 패배 또는 도망
      setTimeout(() => {
        onExit()
      }, 2000)
    }
  }, [battleManager, battleState, currentProgress, selectedDungeon, addCoins, questManager, selectedDifficulty, onProgressUpdate, onDungeonClear, onExit, userId])

  // 전투 상태 변경 감지
  useEffect(() => {
    if (battleState?.result) {
      handleBattleEnd()
    }
  }, [battleState?.result, handleBattleEnd])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (autoBattleManager) {
        autoBattleManager.stop()
      }
    }
  }, [autoBattleManager])

  return {
    battleManager,
    autoBattleManager,
    battleState,
    isLoading,
    startBattle,
    stopBattle: () => {
      if (autoBattleManager) {
        autoBattleManager.stop()
        setAutoBattleManager(null)
      }
    }
  }
}