'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { statFormulas } from '@/lib/utils/stat-calculator'
import { useBattleState } from '@/hooks/useBattleState'
import { BattleEngine } from '@/lib/services/battle-engine.service'
import { BattleGeneratorService } from '@/lib/services/battle-generator.service'
import { EquipmentStatsService } from '@/lib/services/equipment-stats.service'
import { BATTLE_CONFIG } from '@/lib/constants/battle.constants'
import { SimpleBattleScreenProps } from '@/lib/types/battle.types'
import { GAME_CONFIG } from '@/lib/config/game-config'

// 하위 컴포넌트들
import { BattleHeader } from './battle/BattleHeader'
import { EnemyDisplay } from './battle/EnemyDisplay'
import { PlayerDisplay } from './battle/PlayerDisplay'
import { BattleControls } from './battle/BattleControls'
import { BattleLog } from './battle/BattleLog'
import { SkillButtons } from './battle/SkillButtons'
import { skillService } from '@/lib/services/skill-service'
import { allSkills } from '@/lib/data/skills'
import { StatusEffectManager } from '@/lib/services/status-effect.service'
import { StatusEffectDisplay } from '@/components/battle/StatusEffectDisplay'
import { StatusEffect } from '@/lib/types/status-effects'
import { companionService } from '@/lib/services/companion.service'
import { companionSkillService } from '@/lib/services/companion-skill.service'
import { getCompanionById } from '@/lib/data/companions'
import CompanionBattleDisplay from '@/components/battle/CompanionBattleDisplay'
import { calculateCombatStats } from '@/lib/helpers/companion-calculations'
import { CompanionBattleService } from '@/lib/services/companion-battle.service'

export function SimpleBattleScreen({
  enemies,
  enemyLevel,
  playerLevel = 1,
  initialHpRatio = 1,
  onBattleEnd,
  floorInfo
}: SimpleBattleScreenProps) {
  // 기본 플레이어 스탯 계산
  const baseStats = {
    hp: statFormulas.hp(playerLevel),
    mp: statFormulas.mp(playerLevel),
    attack: statFormulas.attack(playerLevel)
  }
  
  // 장비 스탯 포함한 전투 스탯 계산
  const battleStats = EquipmentStatsService.calculateBattleStats(baseStats, GAME_CONFIG.DEFAULT_USER_ID)
  
  const maxPlayerHp = battleStats.hp
  const maxPlayerMp = baseStats.mp // MP는 장비로 증가하지 않음
  const initialPlayerHp = Math.floor(maxPlayerHp * initialHpRatio)
  const initialPlayerMp = maxPlayerMp
  const playerAttack = battleStats.attack

  // 커스텀 훅 사용
  const {
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
    addLog,
    showDamageEffect,
    animationDelay,
    handleBattleEnd,
    updateEnemyHp,
    abortControllerRef,
    messagesEndRef,
    battleSpeed,
    battleSpeedRef,
    isInBattle,
    setIsInBattle
  } = useBattleState({
    enemies,
    playerHp: initialPlayerHp,
    maxPlayerHp,
    playerAttack,
    onBattleEnd
  })

  // 전투 키 관리
  const [battleKey, setBattleKey] = useState(0)
  const isFirstRender = useRef(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // MP 상태 관리
  const [playerMp, setPlayerMp] = useState(initialPlayerMp)
  
  // 상태이상 관리
  const [playerStatusManager] = useState(() => new StatusEffectManager())
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([])
  const [enemyStatusManagers] = useState(() => new Map<number, StatusEffectManager>())
  
  // 컴패니언 관련 상태
  const [activeCompanion] = useState(() => companionService.getActiveCompanion(GAME_CONFIG.DEFAULT_USER_ID))
  const [companionHp, setCompanionHp] = useState(() => {
    if (!activeCompanion) return 0
    return activeCompanion.currentStats.hp
  })
  const [companionStatusManager] = useState(() => new StatusEffectManager())
  const [showCompanionDamage, setShowCompanionDamage] = useState<number | undefined>()
  const [showCompanionHeal, setShowCompanionHeal] = useState<number | undefined>()
  const [companionSkillCooldowns] = useState(() => new Map<string, number>())

  // enemies가 변경되면 새로운 전투 시작
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // 진행 중인 전투 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 적 정보로 상태 업데이트
    const newEnemyList = BattleEngine.convertToEnemyData(enemies)
    setEnemyList(newEnemyList)
    
    // MP 리셋
    setPlayerMp(maxPlayerMp)
    
    // 상태이상 초기화
    playerStatusManager.removeAllDebuffs()
    playerStatusManager.removeAllBuffs()
    setPlayerStatusEffects([])
    enemyStatusManagers.clear()
    
    // 컴패니언 상태 초기화
    if (activeCompanion) {
      setCompanionHp(activeCompanion.currentStats.maxHp)
      companionStatusManager.removeAllDebuffs()
      companionStatusManager.removeAllBuffs()
      companionSkillCooldowns.clear()
    }

    // 전투 키 증가하여 새 전투 트리거
    setBattleKey(prev => prev + 1)
  }, [enemies, maxPlayerMp, setEnemyList, setPlayerMp, abortControllerRef])

  // 초기 전투 시작
  useEffect(() => {
    if (!isInitialized && enemyList.length > 0) {
      setIsInitialized(true)
      console.log('🎮 초기 전투 시작 준비')
      const timer = setTimeout(() => {
        console.log('🎮 초기 전투 시작!')
        setIsBattling(true)
        setIsInBattle(true)
        startAutoBattle()
      }, BATTLE_CONFIG.BATTLE_START_DELAY)

      return () => clearTimeout(timer)
    }
  }, [isInitialized, enemyList, setIsBattling, setIsInBattle, startAutoBattle])

  // 전투 재시작
  useEffect(() => {
    if (battleKey > 0 && !isBattling && !battleEnded) {
      console.log('🎮 전투 재시작 준비, battleKey:', battleKey)
      const timer = setTimeout(() => {
        console.log('🎮 전투 재시작!')
        setIsBattling(true)
        setIsInBattle(true)
        startAutoBattle()
      }, BATTLE_CONFIG.BATTLE_START_DELAY)

      return () => clearTimeout(timer)
    }
  }, [battleKey, isBattling, battleEnded, setIsBattling, setIsInBattle, startAutoBattle])

  // 자동 전투 로직
  const startAutoBattle = useCallback(async() => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    console.log(`🎮 전투 배속: ${battleSpeedRef.current}x`)

    // Generator 컨텍스트 생성
    const generatorContext = {
      playerHp,
      maxPlayerHp,
      playerAttack,
      enemyList,
      playerLevel,
      battleSpeed: battleSpeedRef.current,
      addLog,
      showDamageEffect,
      animationDelay,
      updateEnemyHp,
      setPlayerHp,
      setCurrentTurn,
      setShowEffect,
      setTargetedEnemy,
      playerStatusManager,
      enemyStatusManagers,
      updatePlayerStatusEffects: setPlayerStatusEffects,
      // 컴패니언 관련
      companion: activeCompanion,
      companionHp,
      setCompanionHp,
      companionStatusManager,
      showCompanionDamage: (damage: number) => {
        setShowCompanionDamage(damage)
        setTimeout(() => setShowCompanionDamage(undefined), 1000)
      },
      showCompanionHeal: (heal: number) => {
        setShowCompanionHeal(heal)
        setTimeout(() => setShowCompanionHeal(undefined), 1000)
      },
      companionSkillCooldowns
    }

    // 장비 보너스 로그 추가
    const equipmentStats = EquipmentStatsService.calculateEquipmentStats(GAME_CONFIG.DEFAULT_USER_ID)
    if (equipmentStats.attack > 0 || equipmentStats.hp > 0) {
      addLog(`🛡️ 장비 보너스: 공격력 +${equipmentStats.attack}, HP +${equipmentStats.hp}`, 'status')
    }
    
    // Battle Generator 생성
    const battleGen = BattleGeneratorService.createBattleGenerator(generatorContext)

    try {
      let result = await battleGen.next()

      while (!result.done) {
        if (abortController.signal.aborted) {
          return
        }

        const state = result.value

        // 상태 업데이트
        setPlayerHp(state.playerHp)
        setEnemyList(state.enemyList)

        if (state.isComplete) {
          // 전투 종료
          await animationDelay(BATTLE_CONFIG.BATTLE_END_DELAY)
          
          // 컴패니언 보상 처리
          if (activeCompanion) {
            const enemiesDefeated = enemies.length
            const rewards = CompanionBattleService.processCompanionRewards(
              activeCompanion,
              state.victory,
              enemiesDefeated,
              GAME_CONFIG.DEFAULT_USER_ID
            )
            
            // 경험치 및 충성도 적용
            if (rewards.expGained > 0) {
              companionService.addExperience(
                GAME_CONFIG.DEFAULT_USER_ID,
                activeCompanion.id,
                rewards.expGained
              )
              addLog(`🐾 ${activeCompanion.nickname}이(가) ${rewards.expGained} 경험치를 획득했습니다!`, 'end')
            }
            
            if (rewards.loyaltyChange !== 0) {
              companionService.updateLoyalty(
                GAME_CONFIG.DEFAULT_USER_ID,
                activeCompanion.id,
                rewards.loyaltyChange
              )
              if (rewards.loyaltyChange > 0) {
                addLog(`💝 ${activeCompanion.nickname}의 충성도가 ${rewards.loyaltyChange} 증가했습니다!`, 'end')
              } else {
                addLog(`💔 ${activeCompanion.nickname}의 충성도가 ${Math.abs(rewards.loyaltyChange)} 감소했습니다...`, 'end')
              }
            }
            
            // 전투 후 HP 업데이트
            activeCompanion.currentStats.hp = state.companionHp || 0
            companionService.updateCompanion(GAME_CONFIG.DEFAULT_USER_ID, activeCompanion)
          }
          
          handleBattleEnd(state.victory, state.playerHp)
          break
        }

        // 현재 배속에 맞는 대기 시간 계산
        const avgSpeed = BattleEngine.calculateAverageSpeed(state.enemyList)
        const currentBattleSpeed = battleSpeedRef.current
        const waitTime = BattleEngine.calculateWaitTime(avgSpeed, currentBattleSpeed)

        // 대기 시간 적용
        await new Promise(resolve => setTimeout(resolve, waitTime))

        // 다음 턴 진행
        result = await battleGen.next()
      }
    } catch (error) {
      console.error('Battle error:', error)
    }
  }, [playerHp, maxPlayerHp, playerAttack, enemyList, playerLevel, battleSpeedRef, addLog, showDamageEffect, animationDelay, updateEnemyHp, setPlayerHp, setCurrentTurn, setShowEffect, setTargetedEnemy, handleBattleEnd, setEnemyList, abortControllerRef])

  // 스킬 사용 핸들러
  const handleSkillUse = useCallback((skillId: string) => {
    if (isBattling || battleEnded) return
    
    // 기본 공격 처리
    if (skillId === 'basic_attack') {
      const aliveEnemies = enemyList.filter(e => e.hp > 0)
      if (aliveEnemies.length > 0) {
        const target = aliveEnemies[0]
        const damage = Math.max(1, playerAttack - Math.floor(target.stats.defense * 0.5))
        
        updateEnemyHp(target.id, Math.max(0, target.hp - damage))
        showDamageEffect(damage, target.id)
        addLog(`플레이어가 ${target.name}에게 ${damage}의 피해를 입혔습니다!`, 'damage')
        
        // 적 턴 시작
        setTimeout(() => {
          if (!battleEnded) {
            startAutoBattle()
          }
        }, BATTLE_CONFIG.TURN_DELAY)
      }
      return
    }
    
    // 스킬 사용 시도
    const result = skillService.useSkill(GAME_CONFIG.DEFAULT_USER_ID, skillId, {
      playerStats: {
        attack: playerAttack,
        hp: playerHp,
        maxHp: maxPlayerHp,
        mp: playerMp,
        maxMp: maxPlayerMp
      },
      targets: enemyList.filter(e => e.hp > 0)
    })
    
    if (!result) {
      addLog('스킬을 사용할 수 없습니다!', 'damage')
      return
    }
    
    // MP 소모
    const skill = allSkills[skillId]
    if (skill) {
      const mpCost = typeof skill.mpCost === 'number' ? skill.mpCost : skill.mpCost.base
      setPlayerMp(prev => Math.max(0, prev - mpCost))
    }
    
    // 스킬 효과 적용
    result.effects.forEach(effect => {
      if (effect.effect.type === 'damage') {
        // 데미지 스킬 처리
        const aliveEnemies = enemyList.filter(e => e.hp > 0)
        if (aliveEnemies.length > 0) {
          const target = aliveEnemies[0] // 첫 번째 적 타겟
          const damage = effect.actualValue
          
          updateEnemyHp(target.id, Math.max(0, target.hp - damage))
          showDamageEffect(damage, target.id)
          addLog(`${skill?.name || '스킬'}로 ${target.name}에게 ${damage}의 피해!`, 'damage')
        }
      } else if (effect.effect.type === 'heal') {
        // 힐 스킬 처리
        const healAmount = Math.min(effect.actualValue, maxPlayerHp - playerHp)
        setPlayerHp(prev => Math.min(maxPlayerHp, prev + healAmount))
        addLog(`${healAmount}의 체력을 회복했습니다!`, 'heal')
      } else if (effect.effect.type === 'buff') {
        // 버프 스킬 처리
        addLog(`${skill?.name || '버프'}가 적용되었습니다!`, 'status')
      }
    })
    
    // 쿨다운 감소 (턴 경과)
    skillService.reduceCooldowns(GAME_CONFIG.DEFAULT_USER_ID)
    
    // 적 턴 시작
    setTimeout(() => {
      if (!battleEnded) {
        startAutoBattle()
      }
    }, BATTLE_CONFIG.TURN_DELAY)
  }, [isBattling, battleEnded, playerAttack, playerHp, maxPlayerHp, playerMp, maxPlayerMp, enemyList, addLog, showDamageEffect, updateEnemyHp, startAutoBattle])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500 via-blue-400 to-green-400 z-[100] overflow-hidden" role="region" aria-label="전투 화면">
      <BattleHeader
        floorInfo={floorInfo}
        onClose={() => {
          setIsInBattle(false)
          onBattleEnd(false, playerHp / maxPlayerHp)
        }}
      />

      <div className="h-full flex flex-col">
        <section role="region" aria-label="적 정보" aria-live="polite">
          <EnemyDisplay
            enemyList={enemyList}
            enemyLevel={enemyLevel}
            currentTurn={currentTurn}
            showEffect={showEffect}
            targetedEnemy={targetedEnemy}
            showDamage={showDamage}
          />
        </section>

        <div className="flex items-end justify-center gap-4" role="region" aria-label="플레이어 및 컴패니언 정보">
          <PlayerDisplay
            playerHp={playerHp}
            maxPlayerHp={maxPlayerHp}
            playerMp={playerMp}
            maxPlayerMp={maxPlayerMp}
            playerLevel={playerLevel}
            currentTurn={currentTurn}
            showEffect={showEffect}
            showDamage={showDamage}
          />
          
          {/* 컴패니언 표시 */}
          {activeCompanion && (
            <div className="mb-8" role="region" aria-label="컴패니언 정보">
              <CompanionBattleDisplay
                companion={{
                  ...activeCompanion,
                  currentStats: {
                    ...activeCompanion.currentStats,
                    hp: companionHp
                  }
                }}
                isActive={currentTurn === 'player'}
                showDamage={showCompanionDamage}
                showHeal={showCompanionHeal}
                currentSkillCooldowns={companionSkillCooldowns}
              />
            </div>
          )}
        </div>
        
        {/* 플레이어 상태이상 표시 */}
        {playerStatusEffects.length > 0 && (
          <div className="absolute bottom-52 left-1/2 transform -translate-x-1/2" role="status" aria-label="상태이상 효과" aria-live="polite">
            <StatusEffectDisplay 
              effects={playerStatusEffects}
              targetName="플레이어"
            />
          </div>
        )}

        <section role="region" aria-label="전투 컨트롤">
          <BattleControls />
        </section>

        {/* 스킬 버튼 UI */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4" role="toolbar" aria-label="스킬 선택">
          <SkillButtons
            userId={GAME_CONFIG.DEFAULT_USER_ID}
            playerMp={playerMp}
            maxMp={maxPlayerMp}
            onSkillUse={handleSkillUse}
            disabled={isBattling || battleEnded}
          />
        </div>

        <section role="log" aria-label="전투 기록" aria-live="polite" aria-relevant="additions">
          <BattleLog
            battleHistory={battleHistory}
            battleEnded={battleEnded}
            playerHp={playerHp}
            messagesEndRef={messagesEndRef}
          />
        </section>
      </div>
    </div>
  )
}
