'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CombatState, CombatAction } from '@/lib/types/combat-system'
import { CombatStats } from '@/lib/types/game-core'
import { dungeonCombatService } from '@/lib/services/dungeon-combat.service'
import { 
  Sword, 
  Shield, 
  Zap, 
  Heart, 
  Battery,
  Play,
  Pause,
  FastForward,
  RotateCcw
} from 'lucide-react'
import { useVisibilityManager } from '@/lib/utils/visibility-manager'

interface DungeonBattleScreenProps {
  combatId: string
  onBattleEnd?: (result: CombatState) => void
}

export function DungeonBattleScreen({ combatId, onBattleEnd }: DungeonBattleScreenProps) {
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [combatSpeed, setCombatSpeed] = useState<1 | 2 | 3>(1)
  const [isPaused, setIsPaused] = useState(false)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [animatingActions, setAnimatingActions] = useState<Map<string, string>>(new Map())
  const visibility = useVisibilityManager()

  // 전투 상태 업데이트
  useEffect(() => {
    const updateCombat = () => {
      const state = dungeonCombatService.getCombatState(combatId)
      if (state) {
        setCombatState(state)
        
        // 전투 종료 체크
        if (state.phase === 'victory' || state.phase === 'defeat') {
          visibility.clearInterval('combat-update')
          onBattleEnd?.(state)
        }
      }
    }

    // 초기 로드
    updateCombat()
    
    // visibility manager를 사용하여 업데이트
    visibility.registerInterval('combat-update', updateCombat, 100)

    return () => visibility.clearInterval('combat-update')
  }, [combatId, onBattleEnd, visibility])

  if (!combatState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>전투 준비 중...</p>
        </div>
      </div>
    )
  }

  const player = combatState.participants.find(p => p.type === 'player')
  const enemies = combatState.participants.filter(p => p.team === 'enemy')
  const isPlayerTurn = combatState.currentTurn === player?.id

  // 행동 실행
  const executeAction = (type: CombatAction['type'], targetId?: string) => {
    if (!player || !isPlayerTurn) return

    const action: CombatAction = {
      id: `action_${Date.now()}`,
      turn: combatState.turnCount,
      actorId: player.id,
      type,
      targetIds: targetId ? [targetId] : [],
      results: [], // Will be filled by combat service
      timestamp: Date.now()
    }

    dungeonCombatService.executePlayerAction(combatId, action)
    
    // 애니메이션
    setAnimatingActions(new Map([[player.id, type]]))
    setTimeout(() => setAnimatingActions(new Map()), 1000)
  }

  // 스킬 사용
  const executeSkill = (skillId: string) => {
    if (!player || !isPlayerTurn || !selectedTarget) return

    const action: CombatAction = {
      id: `action_${Date.now()}`,
      turn: combatState.turnCount,
      actorId: player.id,
      type: 'skill',
      skillId,
      targetIds: [selectedTarget],
      results: [], // Will be filled by combat service
      timestamp: Date.now()
    }

    dungeonCombatService.executePlayerAction(combatId, action)
    
    // 애니메이션
    setAnimatingActions(new Map([[player.id, 'skill']]))
    setTimeout(() => setAnimatingActions(new Map()), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-2 md:p-4">
      {/* 상단 UI - 모바일 최적화 */}
      <div className="max-w-6xl mx-auto mb-3 md:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-lg md:text-2xl font-bold">전투</h2>
            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-400">
              <span>턴 {combatState.turnCount}</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                {Math.floor((Date.now() - combatState.startedAt) / 1000)}초
              </span>
            </div>
          </div>
          
          {/* 전투 컨트롤 - 모바일에서 숨김 */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCombatSpeed(combatSpeed === 3 ? 1 : (combatSpeed + 1) as 1 | 2 | 3)}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FastForward className="w-4 h-4" />
              <span className="text-xs">{combatSpeed}x</span>
            </button>
          </div>
        </div>
      </div>

      {/* 전투 필드 - 모바일 최적화 */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
        {/* 플레이어 측 */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-sm md:text-lg font-semibold text-blue-400">아군</h3>
          {player && (
            <motion.div
              className={`bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-4 border-2 ${
                isPlayerTurn ? 'border-blue-500' : 'border-gray-700'
              }`}
              animate={animatingActions.has(player.id) ? {
                x: [0, 10, -10, 0],
                transition: { duration: 0.3 }
              } : {}}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-xl md:text-3xl">🗡️</div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold">{player.name}</h4>
                    <p className="text-xs md:text-sm text-gray-400">Lv.{player.level}</p>
                  </div>
                </div>
                {isPlayerTurn && (
                  <span className="px-2 py-0.5 md:py-1 bg-blue-500 text-xs rounded-full">
                    내 턴
                  </span>
                )}
              </div>
              
              {/* HP/MP 바 - 크기 축소 */}
              <div className="space-y-1.5 md:space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-0.5 md:mb-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-500" />
                      HP
                    </span>
                    <span className="text-[10px] md:text-xs">{player.currentHp}/{player.stats[CombatStats.HP]}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2 overflow-hidden">
                    <motion.div
                      className="bg-red-500 h-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(player.currentHp / player.stats[CombatStats.HP]) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-xs mb-0.5 md:mb-1">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3 text-blue-500" />
                      MP
                    </span>
                    <span className="text-[10px] md:text-xs">{player.currentMp}/{player.stats[CombatStats.MP]}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2 overflow-hidden">
                    <motion.div
                      className="bg-blue-500 h-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(player.currentMp / player.stats[CombatStats.MP]) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 상태 효과 - 모바일에서 숨김 */}
              {player.statusEffects.length > 0 && (
                <div className="hidden md:flex gap-1 mt-2">
                  {player.statusEffects.map(effect => (
                    <span
                      key={effect.id}
                      className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded"
                    >
                      {effect.type} ({effect.remainingDuration})
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* 적 측 */}
        <div className="space-y-2 md:space-y-4">
          <h3 className="text-sm md:text-lg font-semibold text-red-400">적</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {enemies.map(enemy => (
              <motion.div
                key={enemy.id}
                className={`bg-gray-800 rounded-lg md:rounded-xl p-2 md:p-3 border-2 cursor-pointer ${
                  selectedTarget === enemy.id
                    ? 'border-yellow-500'
                    : combatState.currentTurn === enemy.id
                    ? 'border-red-500'
                    : 'border-gray-700'
                } ${enemy.currentHp <= 0 ? 'opacity-50' : ''}`}
                onClick={() => enemy.currentHp > 0 && setSelectedTarget(enemy.id)}
                animate={animatingActions.has(enemy.id) ? {
                  scale: [1, 1.1, 0.9, 1],
                  transition: { duration: 0.3 }
                } : {}}
              >
                <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                  <div className="text-lg md:text-2xl">{enemy.currentHp > 0 ? '👾' : '💀'}</div>
                  <div className="flex-1">
                    <h4 className="text-xs md:text-sm font-bold truncate">{enemy.name}</h4>
                    <p className="text-[10px] md:text-xs text-gray-400">Lv.{enemy.level}</p>
                  </div>
                </div>
                
                {/* HP 바 */}
                <div>
                  <div className="flex items-center justify-between text-[10px] md:text-xs mb-0.5 md:mb-1">
                    <span>HP</span>
                    <span>{enemy.currentHp}/{enemy.stats[CombatStats.HP]}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 md:h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-red-500 h-full"
                      initial={{ width: '100%' }}
                      animate={{ width: `${(enemy.currentHp / enemy.stats[CombatStats.HP]) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 행동 버튼 - 모바일 최적화 */}
      {isPlayerTurn && player && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg md:rounded-xl p-3 md:p-4">
            <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-3">행동 선택</h3>
            
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                onClick={() => selectedTarget && executeAction('attack', selectedTarget)}
                disabled={!selectedTarget}
                className="p-2 md:p-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-0.5 md:gap-1"
              >
                <Sword className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">공격</span>
              </button>
              
              <button
                onClick={() => executeAction('defend')}
                className="p-2 md:p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 md:gap-1"
              >
                <Shield className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">방어</span>
              </button>
              
              {/* 스킬 버튼들 - 최대 2개만 표시 */}
              {player.skills.slice(0, 2).map(skillId => (
                <button
                  key={skillId}
                  onClick={() => executeSkill(skillId)}
                  disabled={!selectedTarget}
                  className="p-2 md:p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors flex flex-col items-center gap-0.5 md:gap-1"
                >
                  <Zap className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm truncate max-w-full">{skillId}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 전투 로그 - 모바일에서 크기 축소 */}
      <div className="max-w-6xl mx-auto mt-3 md:mt-6">
        <div className="bg-gray-800 rounded-lg md:rounded-xl p-2 md:p-4 max-h-20 md:max-h-32 overflow-y-auto">
          <h3 className="text-xs md:text-sm font-semibold mb-1 md:mb-2 text-gray-400">전투 로그</h3>
          <div className="space-y-0.5 md:space-y-1 text-[10px] md:text-xs text-gray-300">
            {combatState.history.slice(-3).map((action, index) => (
              <div key={index} className="truncate">
                <span className="text-gray-500">[{action.turn}]</span> 
                {' '}
                <span className="text-yellow-400">{action.actorId}</span>
                {' → '}
                <span className="text-blue-400">{action.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 애니메이션 효과 */}
      <AnimatePresence>
        {Array.from(animatingActions.entries()).map(([id, action]) => {
          const participant = combatState.participants.find(p => p.id === id)
          if (!participant) return null
          
          return (
            <motion.div
              key={`${id}_${Date.now()}`}
              className="fixed pointer-events-none"
              style={{
                left: participant.team === 'player' ? '25%' : '75%',
                top: '50%'
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-4xl">
                {action === 'attack' && '💥'}
                {action === 'skill' && '✨'}
                {action === 'defend' && '🛡️'}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}