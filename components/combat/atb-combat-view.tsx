'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ATBCombatState, ATBCombatant, CombatAction, ATBCombatEvent } from '@/lib/types/atb-combat'
import type { GeneratedItem } from '@/lib/types/item-system'
import { atbCombatService } from '@/lib/services/atb-combat.service'
import { BATTLE_SPEED_CONFIGS, ATB_CONSTANTS } from '@/lib/types/atb-combat'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Heart, Shield, Zap, Swords, Clock, FastForward,
  Pause, Play, Settings, Sparkles
} from 'lucide-react'

interface CombatRewards {
  gold: number
  items: GeneratedItem[]
}

interface ATBCombatViewProps {
  combatId: string
  onBattleEnd?: (result: 'victory' | 'defeat', rewards?: CombatRewards) => void
}

export function ATBCombatView({ combatId, onBattleEnd }: ATBCombatViewProps) {
  const [combatState, setCombatState] = useState<ATBCombatState | null>(null)
  const [selectedSpeed, setSelectedSpeed] = useState<keyof typeof BATTLE_SPEED_CONFIGS>('normal')
  const [isPaused, setIsPaused] = useState(false)
  const [actionLog, setActionLog] = useState<CombatAction[]>([])
  const animationQueue = useRef<CombatAction[]>([])
  const updateInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // 전투 상태 초기 로드
    const state = atbCombatService.getCombatState(combatId)
    setCombatState(state)

    // 전투 이벤트 리스너
    const handleActionPerformed = (event: ATBCombatEvent) => {
      if (event.combatId === combatId) {
        setActionLog(prev => [...prev.slice(-4), event.action])
        // 애니메이션 큐에 추가
        animationQueue.current.push(event.action)
      }
    }

    const handleBattleEnd = (event: ATBCombatEvent & { result: 'victory' | 'defeat', state: ATBCombatState }) => {
      if (event.combatId === combatId) {
        if (onBattleEnd) {
          onBattleEnd(event.result, event.state.rewards)
        }
      }
    }

    atbCombatService.on('action_performed', handleActionPerformed)
    atbCombatService.on('battle_end', handleBattleEnd)

    // 상태 업데이트 인터벌
    updateInterval.current = setInterval(() => {
      const state = atbCombatService.getCombatState(combatId)
      setCombatState(state ? { ...state } : null)
    }, 100)

    return () => {
      atbCombatService.off('action_performed', handleActionPerformed)
      atbCombatService.off('battle_end', handleBattleEnd)
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
    }
  }, [combatId, onBattleEnd])

  const handleSpeedChange = (speed: keyof typeof BATTLE_SPEED_CONFIGS) => {
    setSelectedSpeed(speed)
    atbCombatService.changeBattleSpeed(combatId, speed)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    // TODO: 일시정지 기능 구현
  }

  if (!combatState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  const playerCombatant = combatState.combatants.find(c => c.team === 'player')
  const enemyCombatants = combatState.combatants.filter(c => c.team === 'enemy')

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-900 to-purple-900 p-4">
      {/* 전투 상태 바 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            턴 {combatState.turnCount}
          </Badge>
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {Math.floor((Date.now() - combatState.startTime) / 1000)}초
          </Badge>
        </div>

        {/* 속도 조절 */}
        <div className="flex items-center gap-2">
          {Object.entries(BATTLE_SPEED_CONFIGS).map(([key, config]) => (
            <Button
              key={key}
              size="sm"
              variant={selectedSpeed === key ? 'default' : 'outline'}
              onClick={() => handleSpeedChange(key as keyof typeof BATTLE_SPEED_CONFIGS)}
              disabled={config.requiredTier && config.requiredTier !== 'free'} // TODO: 구독 체크
            >
              <FastForward className="h-3 w-3 mr-1" />
              {config.speed}x
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={togglePause}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 전투 필드 */}
      <div className="flex justify-between items-center h-full pt-16 pb-32">
        {/* 플레이어 측 */}
        <div className="w-1/3">
          {playerCombatant && (
            <CombatantCard
              combatant={playerCombatant}
              isPlayer={true}
            />
          )}
        </div>

        {/* 중앙 효과 영역 */}
        <div className="w-1/3 flex items-center justify-center">
          <AnimatePresence>
            {actionLog.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <ActionDisplay action={actionLog[actionLog.length - 1]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 적 측 */}
        <div className="w-1/3 space-y-4">
          {enemyCombatants.map(enemy => (
            <CombatantCard
              key={enemy.id}
              combatant={enemy}
              isPlayer={false}
            />
          ))}
        </div>
      </div>

      {/* 행동 로그 */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2 text-white">전투 로그</h4>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {actionLog.map((action, index) => (
            <div key={index} className="text-xs text-gray-300">
              <ActionLogEntry action={action} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 전투원 카드 컴포넌트
function CombatantCard({ combatant, isPlayer }: { combatant: ATBCombatant; isPlayer: boolean }) {
  const hpPercent = (combatant.stats.currentHp / combatant.stats.maxHp) * 100
  const mpPercent = (combatant.stats.currentMp / combatant.stats.maxMp) * 100
  const atbPercent = (combatant.atb.current / ATB_CONSTANTS.MAX_GAUGE) * 100

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={`relative ${combatant.stats.currentHp <= 0 ? 'opacity-50' : ''}`}
    >
      <Card className="p-4 bg-black/50 border-2 border-gray-700">
        {/* 이름 & 레벨 */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-white">{combatant.name}</h3>
          {combatant.stats.currentHp > 0 && (
            <Badge variant={isPlayer ? 'default' : 'destructive'}>
              {isPlayer ? '아군' : '적'}
            </Badge>
          )}
        </div>

        {/* HP 바 */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-500" />
              HP
            </span>
            <span>{combatant.stats.currentHp}/{combatant.stats.maxHp}</span>
          </div>
          <Progress value={hpPercent} className="h-2 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
              style={{ width: `${hpPercent}%` }}
            />
          </Progress>
        </div>

        {/* MP 바 */}
        {isPlayer && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span className="flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                MP
              </span>
              <span>{combatant.stats.currentMp}/{combatant.stats.maxMp}</span>
            </div>
            <Progress value={mpPercent} className="h-2 bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                style={{ width: `${mpPercent}%` }}
              />
            </Progress>
          </div>
        )}

        {/* ATB 게이지 */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span className="flex items-center">
              <Zap className="h-3 w-3 mr-1 text-yellow-500" />
              ATB
            </span>
            <span>{Math.floor(atbPercent)}%</span>
          </div>
          <Progress value={atbPercent} className="h-3 bg-gray-700">
            <div
              className={`h-full transition-all ${
                atbPercent >= 100
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 animate-pulse'
                  : 'bg-gradient-to-r from-yellow-600 to-yellow-500'
              }`}
              style={{ width: `${atbPercent}%` }}
            />
          </Progress>
        </div>

        {/* 상태이상 & 버프 */}
        <div className="flex flex-wrap gap-1">
          {combatant.statusEffects.map((effect, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {getStatusIcon(effect.type)} {effect.duration > 0 && `(${effect.duration})`}
            </Badge>
          ))}
          {combatant.buffs.map((buff, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {getBuffIcon(buff.type)}
            </Badge>
          ))}
        </div>

        {/* 전투 스탯 (호버 시 표시) */}
        <div className="absolute -bottom-20 left-0 right-0 bg-black/90 rounded p-2 opacity-0 hover:opacity-100 transition-opacity z-10">
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
            <div>공격: {combatant.stats.attack}</div>
            <div>방어: {combatant.stats.defense}</div>
            <div>속도: {combatant.stats.speed}</div>
            <div>치명타: {Math.floor(combatant.stats.critRate * 100)}%</div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// 행동 표시 컴포넌트
function ActionDisplay({ action }: { action: CombatAction }) {
  const actor = action.actorId.includes('player') ? '플레이어' : '몬스터'

  return (
    <div className="text-white">
      <div className="text-lg font-bold mb-1">
        {actor} {action.type === 'attack' ? '공격!' : action.action?.name || action.type}
      </div>
      {action.results.map((result, idx) => (
        <div key={idx} className="text-sm">
          {result.damage && (
            <span className={result.critical ? 'text-yellow-400' : 'text-red-400'}>
              {result.damage} 데미지{result.critical && ' (치명타!)'}
            </span>
          )}
          {result.healing && (
            <span className="text-green-400">
              {result.healing} 회복
            </span>
          )}
          {result.dodged && (
            <span className="text-gray-400">
              회피!
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// 행동 로그 엔트리
function ActionLogEntry({ action }: { action: CombatAction }) {
  const actor = action.actorId.includes('player') ? '플레이어' : '몬스터'
  let message = `${actor}의 `

  switch (action.type) {
    case 'attack':
      message += '공격'
      break
    case 'skill':
      message += action.action?.name || '스킬 사용'
      break
    case 'item':
      message += action.action?.name || '아이템 사용'
      break
    case 'status_damage':
      message += '상태이상 데미지'
      break
  }

  const totalDamage = action.results.reduce((sum, r) => sum + (r.damage || 0), 0)
  const totalHealing = action.results.reduce((sum, r) => sum + (r.healing || 0), 0)

  if (totalDamage > 0) {
    message += ` - ${totalDamage} 데미지`
  }
  if (totalHealing > 0) {
    message += ` - ${totalHealing} 회복`
  }

  return <span>{message}</span>
}

// 상태이상 아이콘
function getStatusIcon(type: string): string {
  const icons: Record<string, string> = {
    poison: '🟢',
    burn: '🔥',
    freeze: '❄️',
    paralyze: '⚡',
    sleep: '😴',
    confusion: '💫',
    blind: '🌑',
    silence: '🔇'
  }
  return icons[type] || '❓'
}

// 버프 아이콘
function getBuffIcon(type: string): string {
  const icons: Record<string, string> = {
    attack_up: '⚔️⬆️',
    attack_down: '⚔️⬇️',
    defense_up: '🛡️⬆️',
    defense_down: '🛡️⬇️',
    speed_up: '💨⬆️',
    speed_down: '💨⬇️',
    shield: '🛡️',
    regen: '💚',
    atb_boost: '⚡'
  }
  return icons[type] || '✨'
}
