'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { BattleState, Monster, CharacterBattleStats, Item } from '@/lib/types/dungeon'
import { BattleEngine } from '@/lib/dungeon/battle-engine'
import { generateDungeonMonster } from '@/lib/dungeon/monster-database'
import { generateRandomItem } from '@/lib/dungeon/item-system'
import { dungeonSoundSystem } from '@/lib/dungeon/dungeon-sound-system'
import { DUNGEON_CONFIG } from '@/lib/constants/dungeon'
import { battleLogger } from '@/lib/utils/logger'
import CharacterStats from './CharacterStats'
import MonsterDisplay from './MonsterDisplay'
import BattleAnimation from './BattleAnimation'
import SpeedControl from './SpeedControl'
import ExitButton from './ExitButton'

interface AutoBattleProps {
  dungeonType: 'normal' | 'elite' | 'boss' | 'infinite'
  playerStats: CharacterBattleStats
  onExit: () => void
  onItemObtained: (item: Item) => void
  onGoldObtained: (gold: number) => void
}

const AutoBattle = React.memo(({
  dungeonType,
  playerStats,
  onExit,
  onItemObtained,
  onGoldObtained
}: AutoBattleProps) => {
  const engineRef = useRef<BattleEngine | null>(null)
  const nextMonsterTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [battleState, setBattleState] = useState<BattleState>({
    isActive: true,
    isPaused: false,
    currentMonster: null,
    playerStats: { ...playerStats },
    battleLog: [],
    stage: 1,
    totalGold: 0,
    obtainedItems: [],
    speed: 1
  })

  // 새 몬스터 생성
  const spawnNewMonster = useCallback(() => {
    setBattleState(prev => {
      battleLogger.info(`Spawning monster for stage ${prev.stage}`)
      const monster = generateDungeonMonster(
        dungeonType,
        prev.stage,
        playerStats.totalLevel
      )
      battleLogger.debug('Monster spawned', monster)
      
      return {
        ...prev,
        currentMonster: monster,
        isActive: true
      }
    })
  }, [dungeonType, playerStats.totalLevel])

  // 전투 종료 처리
  const handleBattleEnd = useCallback((victory: boolean, defeatedMonster?: Monster) => {
    battleLogger.info('Battle ended', { victory, hasDefeatedMonster: !!defeatedMonster })
    
    if (victory && defeatedMonster) {
      // 골드 획득
      onGoldObtained(defeatedMonster.goldReward)
      
      // 아이템 드롭 판정
      if (Math.random() * 100 < defeatedMonster.itemDropRate) {
        const item = generateRandomItem(playerStats.totalLevel)
        onItemObtained(item)
        
        setBattleState(prev => ({
          ...prev,
          obtainedItems: [...prev.obtainedItems, item]
        }))
        
        // 아이템 획듍 효과음
        dungeonSoundSystem.playItemDrop()
      }
      
      // 다음 스테이지
      setBattleState(prev => ({
        ...prev,
        stage: prev.stage + 1,
        currentMonster: null
      }))
      
      // 다음 몬스터 스폰 딜레이
      const currentSpeed = battleState.speed || DUNGEON_CONFIG.DEFAULT_SPEED
      const nextMonsterDelay = DUNGEON_CONFIG.NEXT_MONSTER_DELAY / currentSpeed
      battleLogger.debug(`Next monster spawn in ${nextMonsterDelay}ms (speed: ${currentSpeed}x)`)
      
      // 이전 타임아웃 제거
      if (nextMonsterTimeoutRef.current) {
        clearTimeout(nextMonsterTimeoutRef.current)
      }
      
      nextMonsterTimeoutRef.current = setTimeout(() => {
        battleLogger.debug('Spawning next monster...')
        spawnNewMonster()
      }, nextMonsterDelay)
    } else {
      // 패배 시 전투 종료
      setBattleState(prev => ({
        ...prev,
        isActive: false
      }))
    }
  }, [battleState.speed, onGoldObtained, onItemObtained, playerStats.totalLevel, spawnNewMonster])

  // 전투 엔진 초기화
  useEffect(() => {
    if (battleState.currentMonster && battleState.isActive) {
      // 이전 엔진 정리
      if (engineRef.current) {
        engineRef.current.cleanup()
      }
      
      // 새 엔진 생성
      engineRef.current = new BattleEngine(
        battleState,
        setBattleState,
        handleBattleEnd
      )
      
      engineRef.current.start()
    }
    
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup()
      }
    }
  }, [battleState.currentMonster, battleState.isActive])

  // 첫 몬스터 생성 및 BGM 재생 (한 번만 실행)
  useEffect(() => {
    battleLogger.info('AutoBattle component mounted')
    
    // 첫 몬스터 생성 (짧은 지연 후 실행)
    const initTimer = setTimeout(() => {
      battleLogger.info('Spawning first monster')
      setBattleState(prev => {
        const monster = generateDungeonMonster(
          dungeonType,
          1, // 첫 스테이지
          playerStats.totalLevel
        )
        battleLogger.debug('First monster spawned', monster)
        
        return {
          ...prev,
          currentMonster: monster,
          isActive: true
        }
      })
    }, 100) // 100ms 지연
    
    // 던전 사운드 시스템 초기화 및 BGM 재생
    const initSound = async () => {
      await dungeonSoundSystem.initialize()
      console.log('[AutoBattle] Sound system initialized')
      await dungeonSoundSystem.playBGM()
      console.log('[AutoBattle] BGM playback started')
    }
    initSound().catch(err => {
      console.error('[AutoBattle] Failed to initialize sound:', err)
    })
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      clearTimeout(initTimer)
      if (nextMonsterTimeoutRef.current) {
        clearTimeout(nextMonsterTimeoutRef.current)
      }
      // 던전 사운드 정리
      dungeonSoundSystem.cleanup()
    }
  }, []) // 최초 마운트 시에만 실행

  // 배속 변경
  const handleSpeedChange = useCallback((speed: 1 | 2 | 3) => {
    setBattleState(prev => ({ ...prev, speed }))
    if (engineRef.current) {
      engineRef.current.setSpeed(speed)
    }
  }, [])

  // 일시정지/재개
  const togglePause = useCallback(() => {
    if (engineRef.current) {
      if (battleState.isPaused) {
        engineRef.current.resume()
      } else {
        engineRef.current.pause()
      }
    }
  }, [battleState.isPaused])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 pb-20 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* 상단 정보 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 sm:p-4 mb-2 sm:mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                스테이지 {battleState.stage}
              </h2>
              <p className="text-yellow-400 text-sm sm:text-base">
                획득 골드: {battleState.totalGold.toLocaleString()}
              </p>
            </div>
            <ExitButton onExit={onExit} />
          </div>
        </div>

        {/* 전투 화면 */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 sm:p-6 mb-4">
          {!battleState.isActive && battleState.playerStats.health <= 0 ? (
            // 패배 화면
            <div className="text-center py-12">
              <h3 className="text-3xl font-bold text-red-500 mb-4">패배!</h3>
              <p className="text-white mb-2">스테이지 {battleState.stage}에서 전투에서 패배했습니다.</p>
              <p className="text-yellow-400 mb-6">획득한 골드: {battleState.totalGold.toLocaleString()}</p>
              <button
                onClick={onExit}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                던전 나가기
              </button>
            </div>
          ) : battleState.currentMonster ? (
            <>
              {/* 몬스터 정보 */}
              <MonsterDisplay 
                monster={battleState.currentMonster}
                showHealthBar
              />
              
              {/* 전투 애니메이션 */}
              <BattleAnimation 
                battleLog={battleState.battleLog}
                isPaused={battleState.isPaused}
                currentMonster={battleState.currentMonster}
                playerLevel={battleState.playerStats.totalLevel}
              />
              
              {/* 플레이어 정보 */}
              <CharacterStats 
                stats={battleState.playerStats}
                showHealthBar
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white text-lg">다음 몬스터 준비 중...</p>
            </div>
          )}
        </div>

        {/* 컨트롤 */}
        {battleState.isActive && (
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <SpeedControl 
                currentSpeed={battleState.speed}
                onSpeedChange={handleSpeedChange}
              />
              
              <button
                onClick={togglePause}
                className={`px-3 sm:px-6 py-1 sm:py-2 text-xs sm:text-base rounded-lg font-semibold transition-colors ${
                  battleState.isPaused
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {battleState.isPaused ? '재개' : '일시정지'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AutoBattle.displayName = 'AutoBattle'
export default AutoBattle