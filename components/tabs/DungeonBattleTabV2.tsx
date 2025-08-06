'use client'

import { useState, useEffect } from 'react'
import { DungeonSelector, DUNGEONS, type DungeonDefinition } from '@/components/dungeon/DungeonSelector'
import { DungeonProgress, type DungeonProgressData } from '@/components/dungeon/DungeonProgress'
import { BattleScreen } from '@/components/dungeon/BattleScreen'
import { useDungeonBattle } from '@/hooks/useDungeonBattle'
import { JRPGQuestManager } from '@/lib/jrpg/quest-manager'
import { jrpgDbHelpers } from '@/lib/jrpg/database-helpers'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dbHelpers } from '@/lib/database/client'
import { useUserStore } from '@/lib/stores/userStore'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { Difficulty } from '@/lib/jrpg/types'
import type { SkillInstance, ItemInstance } from '@/lib/jrpg/types'
import { ITEM_DATABASE } from '@/lib/jrpg/items-database'

/**
 * DungeonBattleTab V2 - 리팩토링된 버전
 * 
 * 주요 개선사항:
 * - 컴포넌트 분리: DungeonSelector, DungeonProgress, BattleScreen
 * - 커스텀 Hook 사용: useDungeonBattle
 * - 책임 분리: 각 컴포넌트가 단일 책임만 가짐
 * - 타입 안정성: 모든 타입 명시적 정의
 */
export function DungeonBattleTabV2() {
  const user = useUserStore(state => state.user)
  const userId = user?.id || GAME_CONFIG.DEFAULT_USER_ID
  const { addCoins } = useUserStore()
  
  // 상태 관리
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonDefinition | null>(null)
  const [currentProgress, setCurrentProgress] = useState<DungeonProgressData | null>(null)
  const [characterLevel, setCharacterLevel] = useState(1)
  const [equippedSkills, setEquippedSkills] = useState<SkillInstance[]>([])
  const [inventory, setInventory] = useState<ItemInstance[]>([])
  const [questManager, setQuestManager] = useState<JRPGQuestManager | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.NORMAL)
  
  // 커스텀 Hook 사용
  const {
    battleState,
    battleManager,
    autoBattleManager,
    isLoading,
    startBattle,
    stopBattle
  } = useDungeonBattle({
    userId,
    characterLevel,
    selectedDungeon,
    currentProgress,
    selectedDifficulty,
    questManager,
    onProgressUpdate: setCurrentProgress,
    onDungeonClear: exitDungeon,
    onExit: exitDungeon,
    addCoins
  })
  
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
  
  // 던전 선택 핸들러
  const handleDungeonSelect = (dungeon: DungeonDefinition) => {
    setSelectedDungeon(dungeon)
    setCurrentProgress({
      dungeonId: dungeon.id,
      currentFloor: 1,
      totalGold: 0,
      totalExp: 0
    })
  }
  
  // 던전 나가기
  function exitDungeon() {
    stopBattle()
    setSelectedDungeon(null)
    setCurrentProgress(null)
  }
  
  // 렌더링 분기
  // 1. 전투 화면
  if (battleState) {
    return (
      <BattleScreen
        battleState={battleState}
        battleManager={battleManager}
        autoBattleManager={autoBattleManager}
        onExit={exitDungeon}
      />
    )
  }
  
  // 2. 던전 진행 화면
  if (selectedDungeon && currentProgress) {
    return (
      <DungeonProgress
        dungeon={selectedDungeon}
        progress={currentProgress}
        isLoading={isLoading}
        onStartBattle={startBattle}
        onExit={exitDungeon}
      />
    )
  }
  
  // 3. 던전 선택 화면
  return (
    <DungeonSelector
      characterLevel={characterLevel}
      selectedDifficulty={selectedDifficulty}
      onDifficultyChange={setSelectedDifficulty}
      onDungeonSelect={handleDungeonSelect}
    />
  )
}