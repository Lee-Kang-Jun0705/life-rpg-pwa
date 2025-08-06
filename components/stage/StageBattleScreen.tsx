'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AutoBattleManager } from '@/lib/battle/auto-battle-manager'
import { getMonsterById } from '@/lib/battle/monster-database'
import { getStageById, getBattleConfig } from '@/lib/dungeon/stage-data'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { EnergyService } from '@/lib/energy/energy-service'
import { StageService } from '@/lib/dungeon/stage-service'
import type { Stage, StageResult, StageObjective } from '@/lib/types/stage'
import type { BattleState, BattleAction } from '@/lib/types/battle-extended'
import { Sword, Shield, Zap, Target, Clock, Trophy, Layers, Users } from 'lucide-react'
import { PokemonStyleBattle } from '@/components/battle/PokemonStyleBattle'
import { MultiBattleScreen } from '@/components/battle/MultiBattleScreen'
import { MultiBattleManager, createMultiBattle } from '@/lib/battle/multi-battle-manager'
import { 
  getDungeonFloorData, 
  generateFloorMonsters, 
  determineBattleType,
  isFloorBossBattle 
} from '@/lib/dungeon/floor-system'
import { createScaledMonster } from '@/lib/battle/extended-monster-database'

interface StageBattleScreenProps {
  dungeonId: string
  stageId: string
  floorNumber?: number // 던전 플로어 번호 추가
  onStageComplete: (result: StageResult) => void
  onExit: () => void
}

export function StageBattleScreen({
  dungeonId,
  stageId,
  floorNumber,
  onStageComplete,
  onExit
}: StageBattleScreenProps) {
  const [stage, setStage] = useState<Stage | null>(null)
  const [currentWave, setCurrentWave] = useState(0)
  const [battleManager, setBattleManager] = useState<AutoBattleManager | MultiBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [multiBattleState, setMultiBattleState] = useState<any>(null)
  const [battleType, setBattleType] = useState<'single' | 'double' | 'triple'>('single')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFloor, setCurrentFloor] = useState(floorNumber || 1)

  // 전투 통계
  const [statistics, setStatistics] = useState({
    startTime: Date.now(),
    damageDealt: 0,
    damageTaken: 0,
    monstersDefeated: 0,
    skillsUsed: 0,
    comboDamage: 0
  })

  // 목표 진행도
  const [objectives, setObjectives] = useState<StageObjective[]>([])

  const energyService = EnergyService.getInstance()
  const stageService = StageService.getInstance()

  // 스테이지 초기화
  useEffect(() => {
    const initStage = async() => {
      try {
        setIsLoading(true)

        // 스테이지 데이터 가져오기
        const stageData = getStageById(stageId)
        if (!stageData) {
          throw new Error('스테이지를 찾을 수 없습니다')
        }

        setStage(stageData)
        setObjectives(stageData.objectives.map(obj => ({
          ...obj,
          current: 0,
          completed: false
        })))

        // 스테이지 시작
        await stageService.startStage(
          GAME_CONFIG.DEFAULT_USER_ID,
          dungeonId,
          stageId
        )

        // 첫 웨이브 시작
        await startWave(0, stageData)

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : '스테이지 초기화 실패')
        setIsLoading(false)
      }
    }

    initStage()
  }, [dungeonId, stageId])

  // 웨이브 시작
  const startWave = async(waveIndex: number, stageData: Stage) => {
    try {
      // 플로어 시스템 사용 여부 확인
      const floorData = floorNumber ? getDungeonFloorData(dungeonId, floorNumber) : null
      
      if (floorData) {
        // 플로어 시스템으로 전투 설정
        const isBossFloor = isFloorBossBattle(floorData)
        let monsterConfigs: { monsterId: string; level: number }[] = []
        
        if (isBossFloor && floorData.bossMonster) {
          // 보스 전투
          monsterConfigs = [floorData.bossMonster]
          setBattleType('single')
        } else {
          // 일반 전투 - 전투 타입 결정
          const type = determineBattleType(floorData)
          setBattleType(type)
          
          const monsterCount = type === 'single' ? 1 : type === 'double' ? 2 : 3
          monsterConfigs = generateFloorMonsters(floorData, monsterCount)
        }

        // 플레이어 캐릭터 생성
        const playerCharacter = await AutoBattleManager.createPlayerCharacter(
          GAME_CONFIG.DEFAULT_USER_ID
        )

        if (monsterConfigs.length === 1) {
          // 1:1 전투
          const monsterData = createScaledMonster(
            monsterConfigs[0].monsterId, 
            monsterConfigs[0].level
          ) || getMonsterById(monsterConfigs[0].monsterId)
          
          if (!monsterData) return

          const enemyCharacter = AutoBattleManager.createEnemyCharacter(monsterData)
          const manager = new AutoBattleManager(playerCharacter, enemyCharacter, 2000)
          
          setBattleManager(manager)
          setBattleState(manager.getState())
          setMultiBattleState(null)

          const result = await manager.startBattle(
            (action) => {
              updateStatistics(action)
              updateObjectives(action, stageData)
            },
            (state) => setBattleState({ ...state })
          )

          if (result.winner === 'player') {
            setTimeout(() => onFloorComplete(), 2000)
          } else {
            await failStage()
          }
        } else {
          // 다중 전투 (1:2, 1:3)
          const monsterIds = monsterConfigs.map(c => c.monsterId)
          const levels = monsterConfigs.map(c => c.level)
          
          const manager = await createMultiBattle(
            GAME_CONFIG.DEFAULT_USER_ID,
            monsterIds,
            levels
          )
          
          setBattleManager(manager)
          setBattleState(null)
          setMultiBattleState(manager.getState())

          const result = await manager.startBattle(
            (action) => {
              updateStatistics(action)
              updateObjectives(action, stageData)
            },
            (state) => setMultiBattleState({ ...state })
          )

          if (result.winner === 'player') {
            setTimeout(() => onFloorComplete(), 2000)
          } else {
            await failStage()
          }
        }
      } else {
        // 기존 로직 (플로어 시스템 미사용)
        const battleConfig = getBattleConfig(stageId)
        if (!battleConfig) return

        if (waveIndex >= battleConfig.waveCount) {
          await completeStage()
          return
        }

        setCurrentWave(waveIndex + 1)

        const monsterCount = battleConfig.monstersPerWave[waveIndex] || 3
        const monsterIds = []
        const isBossWave = waveIndex === battleConfig.waveCount - 1 && stageData.bossId

        if (isBossWave && stageData.bossId) {
          monsterIds.push(stageData.bossId)
        } else {
          for (let i = 0; i < monsterCount; i++) {
            const randomIndex = Math.floor(Math.random() * stageData.monsterIds.length)
            monsterIds.push(stageData.monsterIds[randomIndex])
          }
        }

        const monsterId = monsterIds[0]
        const monsterData = getMonsterById(monsterId)
        if (!monsterData) return

        const playerCharacter = await AutoBattleManager.createPlayerCharacter(
          GAME_CONFIG.DEFAULT_USER_ID
        )

        const baseEnemyCharacter = AutoBattleManager.createEnemyCharacter(monsterData)
        const enemyCharacter = {
          ...baseEnemyCharacter,
          stats: {
            ...baseEnemyCharacter.stats,
            hp: baseEnemyCharacter.stats.hp * battleConfig.difficultyMultiplier,
            maxHp: baseEnemyCharacter.stats.maxHp * battleConfig.difficultyMultiplier,
            attack: baseEnemyCharacter.stats.attack * battleConfig.difficultyMultiplier
          }
        }

        const manager = new AutoBattleManager(playerCharacter, enemyCharacter, 2000)
        setBattleManager(manager)
        setBattleState(manager.getState())

        const result = await manager.startBattle(
          (action) => {
            updateStatistics(action)
            updateObjectives(action, stageData)
          },
          (state) => setBattleState({ ...state })
        )

        if (result.winner === 'player') {
          setTimeout(() => startWave(waveIndex + 1, stageData), 2000)
        } else {
          await failStage()
        }
      }
    } catch (error) {
      console.error('Failed to start wave:', error)
      setError('웨이브 시작 실패')
    }
  }

  // 플로어 완료 처리
  const onFloorComplete = async() => {
    // 다음 플로어가 있는지 확인
    const dungeonSystem = floorNumber ? 
      (await import('@/lib/dungeon/floor-system')).DUNGEON_FLOOR_SYSTEMS[dungeonId] : null
    
    if (dungeonSystem && currentFloor < dungeonSystem.totalFloors) {
      // 다음 플로어로
      setCurrentFloor(currentFloor + 1)
      const nextFloorData = getDungeonFloorData(dungeonId, currentFloor + 1)
      if (nextFloorData && stage) {
        setTimeout(() => startWave(0, stage), 2000)
      }
    } else {
      // 모든 플로어 완료
      await completeStage()
    }
  }

  // 통계 업데이트
  const updateStatistics = (action: BattleAction) => {
    setStatistics(prev => {
      const updated = { ...prev }

      if (action.damage) {
        if (action.attacker === GAME_CONFIG.DEFAULT_USER_ID || action.attacker.includes('player')) {
          updated.damageDealt += action.damage
        } else {
          updated.damageTaken += action.damage
        }
      }

      if (action.skill) {
        updated.skillsUsed++
      }

      if (action.comboCount && action.comboCount > 1) {
        updated.comboDamage += action.damage || 0
      }

      return updated
    })
  }

  // 목표 진행도 업데이트
  const updateObjectives = (action: BattleAction, stageData: Stage) => {
    setObjectives(prev => {
      // 단일 전투에서 몬스터 처치 확인
      if (battleState && action.target === 'enemy' && action.damage && battleState.enemy.stats.hp === 0) {
        const updated = prev.map(obj => {
          if (obj.type === 'defeat_monsters' && !obj.completed) {
            const newCurrent = (obj.current || 0) + 1
            return {
              ...obj,
              current: newCurrent,
              completed: newCurrent >= obj.target
            }
          }

          // 보스 처치 목표
          if (obj.type === 'defeat_boss' && !obj.completed &&
              stageData.bossId && battleState.enemy.id === stageData.bossId) {
            return {
              ...obj,
              current: 1,
              completed: true
            }
          }

          return obj
        })

        setStatistics(prev => ({
          ...prev,
          monstersDefeated: prev.monstersDefeated + 1
        }))

        return updated
      }

      // 다중 전투에서 몬스터 처치 확인
      if (multiBattleState && action.target !== GAME_CONFIG.DEFAULT_USER_ID && 
          !action.target.includes('player') && action.targetHp === 0) {
        const updated = prev.map(obj => {
          if (obj.type === 'defeat_monsters' && !obj.completed) {
            const newCurrent = (obj.current || 0) + 1
            return {
              ...obj,
              current: newCurrent,
              completed: newCurrent >= obj.target
            }
          }

          // 보스 처치 목표 (다중 전투)
          if (obj.type === 'defeat_boss' && !obj.completed && stageData.bossId) {
            const defeatedBoss = multiBattleState.enemies.find(
              e => e.id === stageData.bossId && e.stats.hp === 0
            )
            if (defeatedBoss) {
              return {
                ...obj,
                current: 1,
                completed: true
              }
            }
          }

          return obj
        })

        setStatistics(prev => ({
          ...prev,
          monstersDefeated: prev.monstersDefeated + 1
        }))

        return updated
      }

      return prev
    })
  }

  // 스테이지 완료
  const completeStage = async() => {
    try {
      const clearTime = Math.floor((Date.now() - statistics.startTime) / 1000)
      const healthPercent = battleState?.player.stats.hp
        ? battleState.player.stats.hp / battleState.player.stats.maxHp
        : 0

      const result = await stageService.completeStage(
        GAME_CONFIG.DEFAULT_USER_ID,
        dungeonId,
        stageId,
        {
          clearTime,
          healthPercent,
          objectivesCompleted: objectives,
          damageDealt: statistics.damageDealt,
          damageTaken: statistics.damageTaken,
          monstersDefeated: statistics.monstersDefeated
        }
      )

      onStageComplete(result)
    } catch (error) {
      console.error('Failed to complete stage:', error)
      setError('스테이지 완료 처리 실패')
    }
  }

  // 스테이지 실패
  const failStage = async() => {
    const result: StageResult = {
      stageId,
      success: false,
      rating: {
        stars: 0,
        score: 0,
        timeBonus: 0,
        perfectBonus: false,
        objectivesCompleted: objectives.filter(obj => obj.completed).length,
        totalObjectives: objectives.length
      },
      rewards: {
        base: { exp: 0, gold: 0, items: [] },
        bonus: {},
        total: { exp: 0, gold: 0, items: [] }
      },
      statistics: {
        damageDealt: statistics.damageDealt,
        damageTaken: statistics.damageTaken,
        monstersDefeated: statistics.monstersDefeated,
        skillsUsed: statistics.skillsUsed,
        comboDamage: statistics.comboDamage,
        clearTime: Math.floor((Date.now() - statistics.startTime) / 1000)
      }
    }

    onStageComplete(result)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl">스테이지 준비 중...</div>
      </div>
    )
  }

  if (error || !stage || !battleState) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">{error || '스테이지 로드 실패'}</div>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // HP 계산 (battleState 또는 multiBattleState에서)
  const playerHp = battleState?.player.stats.hp || multiBattleState?.player.stats.hp || 0
  const playerMaxHp = battleState?.player.stats.maxHp || multiBattleState?.player.stats.maxHp || 1
  const playerHpPercent = (playerHp / playerMaxHp) * 100
  const clearTime = Math.floor((Date.now() - statistics.startTime) / 1000)

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col">
      {/* 상단 정보 */}
      <div className="bg-black/50 backdrop-blur p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{stage.name}</h2>
              <p className="text-gray-300">{stage.description}</p>
            </div>
            <div className="flex items-center gap-6">
              {floorNumber && (
                <div className="text-center">
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    플로어
                  </div>
                  <div className="text-xl font-bold text-white">
                    {currentFloor}층
                  </div>
                </div>
              )}
              {battleType !== 'single' && (
                <div className="text-center">
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    전투
                  </div>
                  <div className="text-xl font-bold text-white">
                    1 vs {battleType === 'double' ? '2' : '3'}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-gray-400">웨이브</div>
                <div className="text-xl font-bold text-white">
                  {currentWave} / {getBattleConfig(stageId)?.waveCount || 1}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">시간</div>
                <div className="text-xl font-bold text-white flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(clearTime / 60)}:{(clearTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* 목표 진행도 */}
          <div className="grid grid-cols-3 gap-4">
            {objectives.map((objective, index) => (
              <div
                key={objective.id}
                className={`bg-white/10 rounded-lg p-3 ${
                  objective.completed ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target className={`w-4 h-4 ${
                    objective.completed ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-white">
                    목표 {index + 1}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-2">{objective.description}</p>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((objective.current || 0) / objective.target) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {objective.current || 0}/{objective.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 전투 화면 */}
      <div className="flex-1 relative overflow-hidden">
        {multiBattleState ? (
          <MultiBattleScreen 
            battleState={multiBattleState} 
            autoMode={true}
            onTargetChange={(index) => {
              if (battleManager instanceof MultiBattleManager) {
                battleManager.changePlayerTarget(index)
              }
            }}
          />
        ) : battleState ? (
          <PokemonStyleBattle battleState={battleState} autoMode={true} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-2xl">전투 준비 중...</div>
          </div>
        )}
      </div>

      {/* 하단 통계 */}
      <div className="bg-black/50 backdrop-blur p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-orange-500" />
              <span className="text-gray-300">데미지: </span>
              <span className="text-white font-medium">{statistics.damageDealt.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">피해: </span>
              <span className="text-white font-medium">{statistics.damageTaken.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-300">처치: </span>
              <span className="text-white font-medium">{statistics.monstersDefeated}</span>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            포기하기
          </button>
        </div>
      </div>
    </div>
  )
}
