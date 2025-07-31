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
import { Sword, Shield, Zap, Target, Clock, Trophy } from 'lucide-react'

interface StageBattleScreenProps {
  dungeonId: string
  stageId: string
  onStageComplete: (result: StageResult) => void
  onExit: () => void
}

export function StageBattleScreen({ 
  dungeonId, 
  stageId, 
  onStageComplete,
  onExit 
}: StageBattleScreenProps) {
  const [stage, setStage] = useState<Stage | null>(null)
  const [currentWave, setCurrentWave] = useState(0)
  const [battleManager, setBattleManager] = useState<AutoBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
    const initStage = async () => {
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
  const startWave = async (waveIndex: number, stageData: Stage) => {
    try {
      const battleConfig = getBattleConfig(stageId)
      if (!battleConfig) return

      if (waveIndex >= battleConfig.waveCount) {
        // 모든 웨이브 완료
        await completeStage()
        return
      }

      setCurrentWave(waveIndex + 1)

      // 이 웨이브의 몬스터 생성
      const monsterCount = battleConfig.monstersPerWave[waveIndex] || 3
      const monsterIds = []
      
      // 보스 웨이브인지 확인
      const isBossWave = waveIndex === battleConfig.waveCount - 1 && stageData.bossId
      
      if (isBossWave && stageData.bossId) {
        monsterIds.push(stageData.bossId)
      } else {
        // 일반 몬스터 랜덤 선택
        for (let i = 0; i < monsterCount; i++) {
          const randomIndex = Math.floor(Math.random() * stageData.monsterIds.length)
          monsterIds.push(stageData.monsterIds[randomIndex])
        }
      }

      // TODO: 다중 몬스터 전투 구현
      // 임시로 첫 번째 몬스터와만 전투
      const monsterId = monsterIds[0]
      const monsterData = getMonsterById(monsterId)
      if (!monsterData) return

      // 플레이어 캐릭터 생성
      const playerCharacter = await AutoBattleManager.createPlayerCharacter(
        GAME_CONFIG.DEFAULT_USER_ID
      )

      // 몬스터 캐릭터 생성 (난이도 배수 적용)
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

      // 전투 매니저 생성
      const manager = new AutoBattleManager(
        playerCharacter,
        enemyCharacter,
        1000
      )

      setBattleManager(manager)
      setBattleState(manager.getState())

      // 전투 시작
      const result = await manager.startBattle(
        (action) => {
          // 전투 액션 처리
          updateStatistics(action)
          updateObjectives(action, stageData)
        },
        (state) => {
          setBattleState({ ...state })
        }
      )

      // 웨이브 완료
      if (result.winner === 'player') {
        // 다음 웨이브
        setTimeout(() => {
          startWave(waveIndex + 1, stageData)
        }, 2000)
      } else {
        // 스테이지 실패
        await failStage()
      }
    } catch (error) {
      console.error('Failed to start wave:', error)
      setError('웨이브 시작 실패')
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
      // 몬스터 처치 목표 - 적이 공격받고 데미지가 있을 때
      if (action.target === 'enemy' && action.damage && battleState?.enemy.stats.hp === 0) {
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
              stageData.bossId && battleState?.enemy.id === stageData.bossId) {
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
      
      return prev
    })
  }

  // 스테이지 완료
  const completeStage = async () => {
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
  const failStage = async () => {
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

  const playerHpPercent = (battleState.player.stats.hp / battleState.player.stats.maxHp) * 100
  const enemyHpPercent = (battleState.enemy.stats.hp / battleState.enemy.stats.maxHp) * 100
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
        <div className="absolute inset-0 flex items-center justify-between px-20">
          {/* 플레이어 */}
          <div className="text-center">
            <div className="text-8xl mb-4">🦸</div>
            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <h3 className="text-white font-bold mb-2">플레이어</h3>
              <div className="w-40 mb-2">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                    animate={{ width: `${playerHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  HP: {battleState.player.stats.hp} / {battleState.player.stats.maxHp}
                </p>
              </div>
            </div>
          </div>

          {/* VS */}
          {battleState.phase === 'preparing' && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              className="text-6xl font-bold text-yellow-400 drop-shadow-lg"
            >
              VS
            </motion.div>
          )}

          {/* 적 */}
          <div className="text-center">
            <div className="text-8xl mb-4">
              {battleState.enemy.emoji || '👾'}
            </div>
            <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
              <h3 className="text-white font-bold mb-2">{battleState.enemy.name}</h3>
              <div className="w-40 mb-2">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-full"
                    animate={{ width: `${enemyHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  HP: {battleState.enemy.stats.hp} / {battleState.enemy.stats.maxHp}
                </p>
              </div>
            </div>
          </div>
        </div>
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