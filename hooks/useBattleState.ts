import { useState, useRef, useCallback, useEffect } from 'react'
import { useBattleStore } from '@/lib/stores/battleStore'
import { BattleEngine } from '@/lib/services/battle-engine.service'
import { BATTLE_CONFIG } from '@/lib/constants/battle.constants'
import { PlayerBehaviorService } from '@/lib/services/player-behavior.service'
import {
  EnemyData,
  BattleMessage,
  DamageDisplay,
  AnimationEffect,
  TurnType
} from '@/lib/types/battle.types'

interface UseBattleStateProps {
  enemies: Array<{
    name: string
    emoji: string
    stats: {
      hp: number
      attack: number
      defense: number
      speed?: number
      specialAbility?: string | null
    }
  }>
  playerHp: number
  maxPlayerHp: number
  playerAttack: number
  onBattleEnd: (victory: boolean, hpRatio?: number) => void
}

export function useBattleState({
  enemies,
  playerHp: initialPlayerHp,
  maxPlayerHp,
  playerAttack,
  onBattleEnd
}: UseBattleStateProps) {
  // 전투 상태
  const [playerHp, setPlayerHp] = useState(initialPlayerHp)
  const [enemyList, setEnemyList] = useState<EnemyData[]>(() => 
    BattleEngine.convertToEnemyData(enemies)
  )
  const [battleHistory, setBattleHistory] = useState<BattleMessage[]>([])
  const [isBattling, setIsBattling] = useState(false)
  const [battleEnded, setBattleEnded] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<TurnType>(null)
  
  // UI 상태
  const [showDamage, setShowDamage] = useState<DamageDisplay>({ enemies: new Map() })
  const [showEffect, setShowEffect] = useState<AnimationEffect>(null)
  const [targetedEnemy, setTargetedEnemy] = useState<number | null>(null)
  
  // Store
  const { isInBattle, setIsInBattle, battleSpeed } = useBattleStore()
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const battleSpeedRef = useRef(battleSpeed)
  
  // battleSpeed가 변경될 때 ref 업데이트
  useEffect(() => {
    battleSpeedRef.current = battleSpeed
  }, [battleSpeed])

  // 로그 추가
  const addLog = useCallback((message: string, type: BattleMessage['type'] = 'normal') => {
    setBattleHistory(prev => [...prev, BattleEngine.createBattleMessage(message, type)])
  }, [])

  // 데미지 표시
  const showDamageEffect = useCallback((
    damage: number,
    targetId?: number,
    isPlayer = false
  ) => {
    if (isPlayer) {
      setShowDamage({ player: damage, enemies: new Map() })
    } else if (targetId !== undefined) {
      const damageMap = new Map<number, number>()
      damageMap.set(targetId, damage)
      setShowDamage({ enemies: damageMap })
    }

    setTimeout(() => {
      setShowDamage({ enemies: new Map() })
      setShowEffect(null)
      setTargetedEnemy(null)
    }, Math.floor(BATTLE_CONFIG.DAMAGE_DISPLAY_DURATION / battleSpeed))
  }, [battleSpeed])

  // 애니메이션 지연
  const animationDelay = useCallback((duration: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, Math.floor(duration / battleSpeed)))
  }, [battleSpeed])

  // 전투 시작 시간 기록
  const battleStartTimeRef = useRef<Date>(new Date())

  // 전투 종료 처리
  const handleBattleEnd = useCallback((victory: boolean, finalPlayerHp: number) => {
    setBattleEnded(true)
    const hpRatio = finalPlayerHp / maxPlayerHp
    
    // 전투 행동 기록
    const battleDuration = Date.now() - battleStartTimeRef.current.getTime()
    const skillsUsed = ['basic_attack'] // TODO: 실제 사용한 스킬 추적
    const enemyElements = enemyList
      .map(e => e.element)
      .filter((elem): elem is string => elem !== undefined && elem !== null)
    
    PlayerBehaviorService.recordBattleActivity('current-user', {
      duration: battleDuration,
      won: victory,
      enemyElement: enemyElements[0], // 첫 번째 적의 속성
      skillsUsed
    })
    
    setTimeout(() => {
      setIsInBattle(false)
      onBattleEnd(victory, hpRatio)
    }, BATTLE_CONFIG.FLOOR_CLEAR_DELAY)
  }, [maxPlayerHp, onBattleEnd, setIsInBattle, enemyList])

  // 적 업데이트
  const updateEnemyHp = useCallback((enemyId: number, newHp: number) => {
    setEnemyList(prev => prev.map(e => 
      e.id === enemyId ? { ...e, hp: Math.max(0, newHp) } : e
    ))
  }, [])

  // 스크롤 자동화
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleHistory])

  // 정리 함수
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setIsInBattle(false)
    }
  }, [setIsInBattle])

  return {
    // 상태
    playerHp,
    setPlayerHp,
    enemyList,
    setEnemyList,
    battleHistory,
    isBattling,
    setIsBattling,
    battleEnded,
    currentTurn,
    setCurrentTurn,
    showDamage,
    showEffect,
    setShowEffect,
    targetedEnemy,
    setTargetedEnemy,
    
    // 함수
    addLog,
    showDamageEffect,
    animationDelay,
    handleBattleEnd,
    updateEnemyHp,
    
    // Refs
    abortControllerRef,
    messagesEndRef,
    battleSpeedRef,
    
    // Store
    battleSpeed,
    isInBattle,
    setIsInBattle
  }
}