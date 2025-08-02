'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Sparkles,
  Flame,
  Snowflake,
  Wind,
  ChevronRight,
  Package,
  X
} from 'lucide-react'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { soundService } from '@/lib/services/sound.service'
import { inventoryService } from '@/lib/services/inventory.service'
import { ItemType } from '@/lib/types/item-system'

// 상태 이름 반환 함수
const getStatusName = (type: string): string => {
  const statusNames: Record<string, string> = {
    'poison': '중독',
    'burn': '화상',
    'freeze': '빙결',
    'paralysis': '마비',
    'sleep': '수면',
    'confusion': '혼란',
    'blind': '실명',
    'silence': '침묵',
    'stun': '기절',
    'bleed': '출혈',
    'defenseUp': '방어력 상승',
    'defenseDown': '방어력 하락',
    'attackUp': '공격력 상승',
    'attackDown': '공격력 하락',
    'speedUp': '속도 상승',
    'speedDown': '속도 하락'
  }
  return statusNames[type] || type
}

interface PokemonStyleBattleScreenProps {
  combatId: string
  onBattleEnd?: (result: CombatState) => void
}

interface BattleMessage {
  id: string
  text: string
  type: 'normal' | 'damage' | 'heal' | 'critical' | 'miss' | 'status'
  timestamp: number
}

// 스킬 아이콘 매핑
const skillIcons: Record<string, React.ReactNode> = {
  'basic_attack': <Sword className="w-5 h-5" />,
  'defend': <Shield className="w-5 h-5" />,
  'power_strike': <Sword className="w-5 h-5 text-red-500" />,
  'fireball': <Flame className="w-5 h-5 text-orange-500" />,
  'ice_shard': <Snowflake className="w-5 h-5 text-blue-400" />,
  'lightning_bolt': <Zap className="w-5 h-5 text-yellow-500" />,
  'whirlwind': <Wind className="w-5 h-5 text-gray-400" />
}

export function PokemonStyleBattleScreen({ combatId, onBattleEnd }: PokemonStyleBattleScreenProps) {
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [battleMessages, setBattleMessages] = useState<BattleMessage[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSkillMenu, setShowSkillMenu] = useState(false)
  const [showItemMenu, setShowItemMenu] = useState(false)
  const [playerTurnReady, setPlayerTurnReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastProcessedTurn, setLastProcessedTurn] = useState(0)

  // HP 애니메이션을 위한 상태
  const [playerHpDisplay, setPlayerHpDisplay] = useState(100)
  const [enemyHpDisplays, setEnemyHpDisplays] = useState<Record<string, number>>({})

  // 초기화 - combatState에서 플레이어 ID 가져오기
  useEffect(() => {
    if (combatState) {
      const player = combatState.participants.find(p => p.type === 'player')
      if (player) {
        skillManagementService.initialize(player.id)
      }
    }
  }, [combatState])

  // 전투 상태 업데이트
  useEffect(() => {
    const updateCombat = () => {
      const state = dungeonCombatService.getCombatState(combatId)
      if (state) {
        setCombatState(state)

        // HP 표시 초기화
        const player = state.participants.find(p => p.type === 'player')
        if (player && playerHpDisplay === 100) {
          setPlayerHpDisplay(player.currentHp)
        }

        // 적 HP 업데이트 (변경된 경우에만)
        const enemies = state.participants.filter(p => p.team === 'enemy')
        setEnemyHpDisplays(prevDisplays => {
          let hasChanges = false
          const newDisplays: Record<string, number> = {}

          enemies.forEach(enemy => {
            if (prevDisplays[enemy.id] !== enemy.currentHp) {
              hasChanges = true
            }
            newDisplays[enemy.id] = enemy.currentHp
          })

          return hasChanges ? newDisplays : prevDisplays
        })

        // 새로운 액션 처리
        if (state.history.length > lastProcessedTurn) {
          const newActions = state.history.slice(lastProcessedTurn)
          processNewActions(newActions, state)
          setLastProcessedTurn(state.history.length)
        }

        // 플레이어 턴 체크
        if (state.currentTurn === player?.id && !playerTurnReady) {
          setPlayerTurnReady(true)
          addBattleMessage('당신의 차례입니다!', 'normal')
        } else if (state.currentTurn !== player?.id) {
          setPlayerTurnReady(false)
        }

        // 전투 종료 체크
        if (state.phase === 'victory' || state.phase === 'defeat') {
          if (state.phase === 'victory') {
            addBattleMessage('승리했습니다!', 'normal')
            soundService.playEffect('victory')
          } else {
            addBattleMessage('패배했습니다...', 'damage')
            soundService.playEffect('defeat')
          }
          setTimeout(() => onBattleEnd?.(state), 2000)
        }
      }
    }

    updateCombat()
    const interval = setInterval(updateCombat, 100)
    return () => clearInterval(interval)
  }, [combatId, onBattleEnd, lastProcessedTurn, playerTurnReady, playerHpDisplay])

  // 새로운 액션 처리 및 메시지 생성
  const processNewActions = (actions: CombatAction[], state: CombatState) => {
    actions.forEach(action => {
      const actor = state.participants.find(p => p.id === action.actorId)
      if (!actor) {
        return
      }

      action.results.forEach(result => {
        const target = state.participants.find(p => p.id === result.targetId)
        if (!target) {
          return
        }

        let message = ''
        const messageType: BattleMessage['type'] = 'normal'

        switch (action.type) {
          case 'attack':
            if (result.damage && !result.damage.isDodged) {
              const critText = result.damage.isCritical ? ' (치명타!)' : ''
              message = `${actor.name}의 공격! ${target.name}에게 ${result.damage.amount}의 데미지${critText}`
              addBattleMessage(message, result.damage.isCritical ? 'critical' : 'damage')

              if (result.damage.isCritical) {
                soundService.playEffect('critical_hit')
              } else {
                soundService.playEffect('hit')
              }

              animateDamage(target.id, result.damage.amount)
            } else if (result.damage && result.damage.isDodged) {
              message = `${actor.name}의 공격! ${target.name}이(가) 회피!`
              addBattleMessage(message, 'miss')
              soundService.playEffect('miss')
            }
            break

          case 'skill':
            const skill = skillManagementService.getSkill(action.skillId!)
            if (skill) {
              soundService.playEffect('skill_use')

              if (result.damage && !result.damage.isDodged) {
                const critText = result.damage.isCritical ? ' (치명타!)' : ''
                message = `${actor.name}의 ${skill.name}! ${target.name}에게 ${result.damage.amount}의 데미지${critText}`
                addBattleMessage(message, result.damage.isCritical ? 'critical' : 'damage')
                animateDamage(target.id, result.damage.amount)
              } else if (result.damage && result.damage.isDodged) {
                message = `${actor.name}의 ${skill.name}! ${target.name}이(가) 회피!`
                addBattleMessage(message, 'miss')
                soundService.playEffect('miss')
              }

              if (result.healing) {
                message = `${actor.name}의 ${skill.name}! ${target.name}의 HP가 ${result.healing} 회복!`
                addBattleMessage(message, 'heal')
                animateHeal(target.id, result.healing)
              }

              // 상태 효과 처리
              if (result.statusEffects && result.statusEffects.length > 0) {
                result.statusEffects.forEach(effect => {
                  if (effect.applied) {
                    const statusName = getStatusName(effect.type)
                    message = `${target.name}에게 ${statusName} 효과 부여!`
                    addBattleMessage(message, 'status')
                  }
                })
              }
            }
            break

          case 'defend':
            message = `${actor.name}의 방어! 방어력이 50% 상승!`
            addBattleMessage(message, 'status')
            soundService.playEffect('defend')
            break
        }
      })
    })
  }

  // 데미지 애니메이션
  const animateDamage = (targetId: string, damage: number) => {
    const player = combatState?.participants.find(p => p.type === 'player')

    if (targetId === player?.id) {
      // 플레이어 데미지
      const newHp = Math.max(0, playerHpDisplay - damage)
      const step = damage / 20
      let currentHp = playerHpDisplay

      const damageInterval = setInterval(() => {
        currentHp -= step
        if (currentHp <= newHp) {
          currentHp = newHp
          clearInterval(damageInterval)
        }
        setPlayerHpDisplay(Math.round(currentHp))
      }, 50)
    } else {
      // 적 데미지 - 이미 updateCombat에서 HP가 업데이트되므로 애니메이션 제거
      // enemyHpDisplays는 updateCombat에서 자동으로 업데이트됨
    }
  }

  // 회복 애니메이션
  const animateHeal = (targetId: string, healing: number) => {
    const player = combatState?.participants.find(p => p.type === 'player')

    if (targetId === player?.id && player) {
      const maxHp = player.stats[CombatStats.HP]
      const newHp = Math.min(maxHp, playerHpDisplay + healing)
      const step = healing / 20
      let currentHp = playerHpDisplay

      const healInterval = setInterval(() => {
        currentHp += step
        if (currentHp >= newHp) {
          currentHp = newHp
          clearInterval(healInterval)
        }
        setPlayerHpDisplay(Math.round(currentHp))
      }, 50)
    }
  }

  // 배틀 메시지 추가
  const addBattleMessage = (text: string, type: BattleMessage['type']) => {
    const message: BattleMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      text,
      type,
      timestamp: Date.now()
    }
    setBattleMessages(prev => [...prev.slice(-4), message])
  }

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleMessages])

  // 행동 실행
  const executeAction = async(type: CombatAction['type'], targetId?: string, skillId?: string, itemId?: string) => {
    if (!combatState || isAnimating) {
      return
    }

    const player = combatState.participants.find(p => p.type === 'player')
    const isPlayerTurn = combatState.currentTurn === player?.id

    if (!player || !isPlayerTurn) {
      return
    }

    setIsAnimating(true)
    setShowSkillMenu(false)
    setShowItemMenu(false)

    const action: CombatAction = {
      id: `action_${Date.now()}`,
      turn: combatState.turnCount,
      actorId: player.id,
      type,
      skillId,
      targetIds: targetId ? [targetId] : [],
      results: [],
      timestamp: Date.now()
    }

    // 아이템 사용 시 별도 처리
    if (type === 'item' && itemId) {
      // TODO: 아이템 사용 로직 구현
      addBattleMessage('아이템 기능이 곧 추가됩니다!', 'normal')
      setIsAnimating(false)
      return
    }

    dungeonCombatService.executePlayerAction(combatId, action)

    setTimeout(() => {
      setIsAnimating(false)
      setSelectedTarget(null)
    }, 1500)
  }

  if (!combatState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
          </motion.div>
          <p className="text-white">전투 준비 중...</p>
        </div>
      </div>
    )
  }

  const player = combatState.participants.find(p => p.type === 'player')
  const enemies = combatState.participants.filter(p => p.team === 'enemy')
  const isPlayerTurn = combatState.currentTurn === player?.id

  // 플레이어 스킬 가져오기
  const quickSlots = skillManagementService.getQuickSlots()
  const availableSkills = quickSlots
    .filter(slot => slot.skillId)
    .map(slot => ({
      slot: slot.slot,
      skill: skillManagementService.getSkill(slot.skillId!),
      learned: skillManagementService.getLearnedSkill(slot.skillId!)
    }))
    .filter(item => item.skill && item.learned)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* X 버튼 - 전투 종료 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            if (confirm('전투를 포기하시겠습니까? 보상을 받을 수 없습니다.')) {
              // 패배 상태로 전투 종료
              const defeatState: CombatState = {
                ...combatState!,
                phase: 'defeat',
                endedAt: Date.now()
              }
              onBattleEnd?.(defeatState)
            }
          }}
          className="absolute top-4 right-4 z-50 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full backdrop-blur transition-colors"
          title="전투 종료"
        >
          <X className="w-6 h-6 text-gray-300 hover:text-white" />
        </motion.button>

        {/* 적 영역 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
              {enemies.map((enemy) => {
                const hpPercent = enemy.currentHp / enemy.stats[CombatStats.HP] * 100
                const isSelected = selectedTarget === enemy.id
                const isDead = enemy.currentHp <= 0

                return (
                  <motion.div
                    key={enemy.id}
                    className={`relative ${isDead ? 'pointer-events-none' : 'cursor-pointer'}`}
                    onClick={() => !isDead && !isAnimating && setSelectedTarget(enemy.id)}
                    animate={
                      isSelected ? {
                        scale: [1, 1.05, 1],
                        transition: { duration: 1, repeat: Infinity }
                      } : {}
                    }
                  >
                    {/* 선택 표시 */}
                    {isSelected && !isDead && (
                      <motion.div
                        className="absolute -inset-4 border-4 border-yellow-400 rounded-2xl"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}

                    {/* 적 스프라이트 */}
                    <motion.div
                      className={`text-8xl mb-4 text-center ${isDead ? 'grayscale opacity-50' : ''}`}
                      animate={
                        combatState.currentTurn === enemy.id ? {
                          y: [0, -10, 0],
                          transition: { duration: 0.5, repeat: Infinity }
                        } : {}
                      }
                    >
                      {isDead ? '💀' : '👾'}
                    </motion.div>

                    {/* HP 바 */}
                    <div className="bg-gray-800/80 backdrop-blur rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold">{enemy.name}</span>
                        <span className="text-yellow-400 text-sm">Lv.{enemy.level}</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-4 overflow-hidden relative">
                        <motion.div
                          className={`h-full ${
                            hpPercent > 50 ? 'bg-green-500' :
                              hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          initial={{ width: '100%' }}
                          animate={{ width: `${hpPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white drop-shadow">
                            {enemyHpDisplays[enemy.id] || enemy.currentHp} / {enemy.stats[CombatStats.HP]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 플레이어 영역 */}
        <div className="bg-gradient-to-t from-gray-800 to-transparent p-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-4">
              {/* 플레이어 정보 */}
              <div className="order-2 md:order-1">
                {player && (
                  <motion.div
                    className="bg-gray-800/90 backdrop-blur rounded-xl p-4 border-2 border-blue-500/50"
                    animate={
                      isPlayerTurn ? {
                        borderColor: ['rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.5)'],
                        transition: { duration: 1, repeat: Infinity }
                      } : {}
                    }
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <motion.div
                        className="text-5xl"
                        animate={
                          isAnimating && combatState.currentTurn === player.id ? {
                            x: [0, 20, 0],
                            transition: { duration: 0.3 }
                          } : {}
                        }
                      >
                        ⚔️
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-bold text-lg">{player.name}</h3>
                          <span className="text-yellow-400">Lv.{player.level}</span>
                        </div>

                        {/* HP 바 */}
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-400 flex items-center gap-1">
                              <Heart className="w-4 h-4" /> HP
                            </span>
                            <span className="text-white">
                              {playerHpDisplay} / {player.stats[CombatStats.HP]}
                            </span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-5 overflow-hidden relative">
                            <motion.div
                              className={`h-full ${
                                playerHpDisplay / player.stats[CombatStats.HP] > 0.5 ? 'bg-green-500' :
                                  playerHpDisplay / player.stats[CombatStats.HP] > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              animate={{
                                width: `${(playerHpDisplay / player.stats[CombatStats.HP]) * 100}%`
                              }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* MP 바 */}
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-blue-400 flex items-center gap-1">
                              <Battery className="w-4 h-4" /> MP
                            </span>
                            <span className="text-white">
                              {player.currentMp} / {player.stats[CombatStats.MP]}
                            </span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-5 overflow-hidden">
                            <motion.div
                              className="bg-blue-500 h-full"
                              initial={{ width: '100%' }}
                              animate={{
                                width: `${(player.currentMp / player.stats[CombatStats.MP]) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>

            {/* 행동 선택 UI */}
            {isPlayerTurn && !isAnimating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                {!showSkillMenu ? (
                  <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectedTarget && executeAction('attack', selectedTarget)}
                        disabled={!selectedTarget}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Sword className="w-5 h-5" />
                        공격
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSkillMenu(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                        스킬
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => executeAction('defend')}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        방어
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowItemMenu(true)}
                        className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Package className="w-5 h-5" />
                        아이템
                      </motion.button>
                    </div>
                  </div>
                ) : showSkillMenu ? (
                  <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-bold">스킬 선택</h3>
                      <button
                        onClick={() => setShowSkillMenu(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableSkills.map(({ slot, skill, learned }) => {
                        const canUse = player && player.currentMp >= (typeof skill!.mpCost === 'number' ? skill!.mpCost : skill!.mpCost.base)

                        return (
                          <motion.button
                            key={slot}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => canUse && selectedTarget && executeAction('skill', selectedTarget, skill!.id)}
                            disabled={!canUse || !selectedTarget}
                            className={`${
                              canUse ? 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gray-600'
                            } text-white py-3 px-4 rounded-lg font-bold flex flex-col items-center gap-1 transition-all`}
                          >
                            <div className="flex items-center gap-2">
                              {skillIcons[skill!.id] || <Sparkles className="w-5 h-5" />}
                              <span>{skill!.name}</span>
                            </div>
                            <span className="text-xs opacity-80">
                              MP {typeof skill!.mpCost === 'number' ? skill!.mpCost : skill!.mpCost.base}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                ) : showItemMenu ? (
                  <div className="bg-gray-800/90 backdrop-blur rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-bold">아이템 선택</h3>
                      <button
                        onClick={() => setShowItemMenu(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>사용 가능한 아이템이 없습니다</p>
                      <p className="text-sm mt-2">전투 중 사용 가능한 아이템을 획득하면 여기에 표시됩니다</p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>

        {/* 전투 로그 영역 - 화면 하단 고정 */}
        <div className="bg-gray-800 border-t border-gray-700 max-h-32 overflow-y-auto p-2">
          <div className="text-xs text-gray-400 mb-1">전투 로그</div>
          <AnimatePresence mode="popLayout">
            {battleMessages.slice(-8).map((msg, index) => (
              <motion.div
                key={`${msg.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`text-sm py-1 px-2 mb-1 rounded ${
                  msg.type === 'damage' ? 'text-red-400' :
                    msg.type === 'heal' ? 'text-green-400' :
                      msg.type === 'critical' ? 'text-yellow-400' :
                        msg.type === 'status' ? 'text-purple-400' :
                          msg.type === 'miss' ? 'text-gray-400' :
                            'text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> {msg.text}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

// Package 아이콘이 없을 경우를 위한 임시 컴포넌트
const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
