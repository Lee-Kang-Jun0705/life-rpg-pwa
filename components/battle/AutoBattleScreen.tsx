'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BattleState, BattleAction, BattleResult, StatusEffect } from '@/lib/types/battle-extended'
import { AutoBattleManager } from '@/lib/battle/auto-battle-manager'
import { getMonsterById } from '@/lib/battle/monsters'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { BattleTicketService } from '@/lib/battle/ticket-service'
import { Ticket, AlertCircle } from 'lucide-react'
import { backgroundStyles, getButtonStyle, layoutStyles } from '@/lib/utils/style-utils'
import { AutoBattleScreen as CommonAutoBattleScreen } from '@/components/common/AutoBattleScreen'

interface AutoBattleScreenProps {
  monsterId: string
  onBattleEnd: (result: BattleResult) => void
}

export function AutoBattleScreen({ monsterId, onBattleEnd }: AutoBattleScreenProps) {
  const [battleManager, setBattleManager] = useState<AutoBattleManager | null>(null)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [actions, setActions] = useState<BattleAction[]>([])
  const [battleSpeed, setBattleSpeed] = useState(1)
  const actionLogRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticketUsed, setTicketUsed] = useState(false)
  const ticketService = BattleTicketService.getInstance()

  // 전투 초기화
  useEffect(() => {
    const initBattle = async() => {
      try {
        setIsLoading(true)

        // 티켓 체크 및 사용
        if (!ticketUsed) {
          const ticketState = await ticketService.getTicketState(GAME_CONFIG.DEFAULT_USER_ID)
          if (!ticketState.canUseFreeTicket) {
            throw new Error('전투 티켓이 부족합니다')
          }

          // 티켓 사용
          const success = await ticketService.useTicket(
            GAME_CONFIG.DEFAULT_USER_ID,
            '자동전투 입장'
          )

          if (!success) {
            throw new Error('티켓 사용에 실패했습니다')
          }

          setTicketUsed(true)
        }

        // 몬스터 데이터 가져오기
        const monsterData = getMonsterById(monsterId)
        if (!monsterData) {
          throw new Error('몬스터를 찾을 수 없습니다')
        }

        // 플레이어 캐릭터 생성
        const playerCharacter = await AutoBattleManager.createPlayerCharacter(
          GAME_CONFIG.DEFAULT_USER_ID
        )

        // 적 캐릭터 생성
        const enemyCharacter = AutoBattleManager.createEnemyCharacter(monsterData)

        // 전투 매니저 생성
        const manager = new AutoBattleManager(
          playerCharacter,
          enemyCharacter,
          1000 / battleSpeed
        )

        setBattleManager(manager)
        setBattleState(manager.getState())
        setIsLoading(false)

        // 3초 후 자동 전투 시작
        setTimeout(() => {
          startBattle(manager)
        }, 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : '전투 초기화 실패')
        setIsLoading(false)
      }
    }

    initBattle()
  }, [monsterId, battleSpeed, ticketUsed])

  // 전투 시작
  const startBattle = async(manager: AutoBattleManager) => {
    const result = await manager.startBattle(
      (action) => {
        setActions(prev => [...prev, action])

        // 자동 스크롤
        if (actionLogRef.current) {
          setTimeout(() => {
            actionLogRef.current?.scrollTo({
              top: actionLogRef.current.scrollHeight,
              behavior: 'smooth'
            })
          }, 100)
        }
      },
      (state) => {
        setBattleState({ ...state })
      }
    )

    // 전투 종료
    setTimeout(() => {
      onBattleEnd(result)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className={backgroundStyles.battle + ' ' + backgroundStyles.overlayCenter}>
        <div className="text-white text-2xl">전투 준비 중...</div>
      </div>
    )
  }

  if (error || !battleState) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-red-400 text-2xl">{error || '전투 초기화 실패'}</div>
      </div>
    )
  }

  const playerHpPercent = (battleState.player.stats.hp / battleState.player.stats.maxHp) * 100
  const playerMpPercent = (battleState.player.stats.mp / battleState.player.stats.maxMp) * 100
  const enemyHpPercent = (battleState.enemy.stats.hp / battleState.enemy.stats.maxHp) * 100
  const enemyMpPercent = (battleState.enemy.stats.mp / battleState.enemy.stats.maxMp) * 100

  return (
    <div className={backgroundStyles.battle + ' ' + backgroundStyles.overlay + ' flex flex-col'}>
      {/* 전투 필드 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/30 rounded-full blur-xl animate-float" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/30 rounded-full blur-xl animate-float-delayed" />
        </div>

        {/* 캐릭터들 */}
        <div className="relative h-full flex items-center justify-between px-20">
          {/* 플레이어 */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={battleState.phase === 'fighting' ? {
                x: [0, 20, 0],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className="text-8xl mb-4"
            >
              🦸
            </motion.div>
            <CharacterStatus
              name={battleState.player.name}
              hp={battleState.player.stats.hp}
              maxHp={battleState.player.stats.maxHp}
              mp={battleState.player.stats.mp}
              maxMp={battleState.player.stats.maxMp}
              hpPercent={playerHpPercent}
              mpPercent={playerMpPercent}
              statusEffects={battleState.player.statusEffects}
            />
          </motion.div>

          {/* 중앙 표시 */}
          <AnimatePresence>
            {battleState.phase === 'preparing' && (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                exit={{ scale: 0 }}
                className="text-6xl font-bold text-yellow-400 drop-shadow-lg"
              >
                VS
              </motion.div>
            )}
          </AnimatePresence>

          {/* 전투 이펙트 */}
          <AnimatePresence>
            {actions.slice(-1).map((action) => (
              <BattleEffect key={action.id} action={action} />
            ))}
          </AnimatePresence>

          {/* 적 */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={battleState.phase === 'fighting' ? {
                x: [0, -20, 0],
                transition: { repeat: Infinity, duration: 2 }
              } : {}}
              className="text-8xl mb-4"
            >
              {battleState.enemy.emoji || '👾'}
            </motion.div>
            <CharacterStatus
              name={battleState.enemy.name}
              hp={battleState.enemy.stats.hp}
              maxHp={battleState.enemy.stats.maxHp}
              mp={battleState.enemy.stats.mp}
              maxMp={battleState.enemy.stats.maxMp}
              hpPercent={enemyHpPercent}
              mpPercent={enemyMpPercent}
              statusEffects={battleState.enemy.statusEffects}
              isEnemy
            />
          </motion.div>
        </div>

        {/* 전투 결과 */}
        {battleState.phase === 'finished' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur"
          >
            <div className="text-center">
              <h2 className={`text-6xl font-bold mb-4 ${
                battleState.actions.some(a => a.attacker === battleState.player.id &&
                  battleState.enemy.stats.hp <= 0) ? 'text-yellow-400' : 'text-red-500'
              }`}>
                {battleState.actions.some(a => a.attacker === battleState.player.id &&
                  battleState.enemy.stats.hp <= 0) ? '승리!' : '패배...'}
              </h2>
              <p className="text-2xl text-white">
                {battleState.turn}턴 만에 전투 종료
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 전투 로그 */}
      <BattleLog
        ref={actionLogRef}
        actions={actions}
        battleSpeed={battleSpeed}
        onSpeedChange={setBattleSpeed}
      />
    </div>
  )
}

// 캐릭터 상태 표시 컴포넌트
function CharacterStatus({
  name,
  hp,
  maxHp,
  mp,
  maxMp,
  hpPercent,
  mpPercent,
  statusEffects,
  isEnemy = false
}: {
  name: string
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  hpPercent: number
  mpPercent: number
  statusEffects: StatusEffect[]
  isEnemy?: boolean
}) {
  return (
    <div className="bg-black/50 rounded-lg p-3 backdrop-blur">
      <h3 className="text-white font-bold mb-2">{name}</h3>

      {/* HP 바 */}
      <div className="w-40 mb-2">
        <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
          <motion.div
            className={`h-full ${
              isEnemy
                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-gray-300 mt-1">
          HP: {hp} / {maxHp}
        </p>
      </div>

      {/* MP 바 */}
      <div className="w-40">
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
            animate={{ width: `${mpPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-gray-300 mt-1">
          MP: {mp} / {maxMp}
        </p>
      </div>

      {/* 상태 이상 효과 */}
      {statusEffects.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {statusEffects.map((effect, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded ${
                effect.type === 'buff'
                  ? 'bg-green-600/50 text-green-200'
                  : 'bg-red-600/50 text-red-200'
              }`}
            >
              {effect.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 전투 이펙트 컴포넌트
function BattleEffect({ action }: { action: BattleAction }) {
  const getEffectEmoji = () => {
    if (action.skill.element === 'fire') {
      return '🔥'
    }
    if (action.skill.element === 'ice') {
      return '❄️'
    }
    if (action.skill.element === 'electric') {
      return '⚡'
    }
    if (action.skill.type === 'heal') {
      return '✨'
    }
    if (action.skill.type === 'buff') {
      return '⬆️'
    }
    if (action.skill.type === 'debuff') {
      return '⬇️'
    }
    if (action.skill.damageType === 'physical') {
      return '⚔️'
    }
    return '💥'
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="text-8xl">{getEffectEmoji()}</div>
      {action.isCritical && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl text-yellow-400 font-bold mt-2"
        >
          CRITICAL!
        </motion.div>
      )}
      {action.damage && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: -20, opacity: [1, 1, 0] }}
          transition={{ duration: 1 }}
          className="text-3xl text-white font-bold mt-2"
        >
          -{action.damage}
        </motion.div>
      )}
    </motion.div>
  )
}

// 전투 로그 컴포넌트
const BattleLog = React.forwardRef<
  HTMLDivElement,
  {
    actions: BattleAction[]
    battleSpeed: number
    onSpeedChange: (speed: number) => void
      }
      >(({ actions, battleSpeed, onSpeedChange }, ref) => {
        return (
          <div className="h-48 bg-black/70 border-t border-gray-700">
            <div className="flex items-center justify-between p-2 border-b border-gray-700">
              <h3 className="text-white font-bold">전투 로그</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">속도:</span>
                <div className="flex gap-1">
                  {[0.5, 1, 2, 3].map(speed => (
                    <button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      className={`px-2 py-1 text-xs rounded ${
                        battleSpeed === speed
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div ref={ref} className="h-full overflow-y-auto p-2 space-y-1">
              {actions.map((action) => (
                <BattleLogEntry key={action.id} action={action} />
              ))}
            </div>
          </div>
        )
      })

BattleLog.displayName = 'BattleLog'

// 전투 로그 항목 컴포넌트
function BattleLogEntry({ action }: { action: BattleAction }) {
  const isPlayerAction = action.attacker.includes('player') || action.attacker === GAME_CONFIG.DEFAULT_USER_ID

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-sm p-2 rounded ${
        isPlayerAction
          ? 'bg-blue-600/30 text-blue-200'
          : 'bg-red-600/30 text-red-200'
      }`}
    >
      <span className="font-bold">
        {isPlayerAction ? '플레이어' : '적'}
      </span>
      {' '}의 {action.skill.name}!

      {action.isEvaded && <span className="ml-2 text-gray-400">회피됨!</span>}

      {action.damage && !action.isEvaded && (
        <span className="ml-2">
          {action.damage} 데미지
          {action.isCritical && ' (크리티컬!)'}
          {action.elementalBonus && action.elementalBonus > 1 && ' (약점!)'}
          {action.elementalBonus && action.elementalBonus < 1 && ' (저항!)'}
        </span>
      )}

      {action.healing && (
        <span className="ml-2">{action.healing} HP 회복</span>
      )}

      {action.statusEffectApplied && (
        <span className="ml-2">{action.statusEffectApplied} 효과 적용</span>
      )}

      {action.comboCount && action.comboCount > 1 && (
        <span className="ml-2 text-yellow-300">{action.comboCount}연속 콤보!</span>
      )}
    </motion.div>
  )
}
