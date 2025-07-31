/**
 * 던전 내 통합 전투 서비스
 * 실시간 전투, 스킬 사용, 아이템 드롭 등
 */

import type { 
  CombatState, 
  CombatParticipant, 
  CombatAction,
  CombatResult,
  CombatStartOptions,
  DamageResult,
  CombatStatistics
} from '@/lib/types/combat-system'
import type { Dungeon, DungeonStage, DungeonMonster } from '@/lib/types/dungeon'
import type { Character } from '@/lib/types/game-core'
import type { GeneratedItem } from '@/lib/types/item-system'
import type { SkillContext } from '@/lib/types/skill-system'
import { 
  COMBAT_CONFIG, 
  COMBAT_PHASE_CONFIG,
  AI_BEHAVIOR_PATTERNS,
  COMBAT_REWARD_CONFIG,
  COMBAT_ANIMATION_TIMING
} from '@/lib/constants/combat.constants'
import { itemGenerationService } from '@/lib/services/item-generation.service'
import { skillExecutionService } from '@/lib/services/skill-execution.service'
import { leaderboardService } from '@/lib/services/leaderboard.service'
import { skillManagementService } from '@/lib/services/skill-management.service'
import { IdGenerators } from '@/lib/utils/id-generator'

interface CombatBonuses {
  perfectVictory: boolean
  speedBonus: boolean
  overkill: boolean
  combo: number
  skillMaster: boolean
}

export class DungeonCombatService {
  private static instance: DungeonCombatService
  private combatStates: Map<string, CombatState> = new Map()
  private combatIntervals: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): DungeonCombatService {
    if (!this.instance) {
      this.instance = new DungeonCombatService()
    }
    return this.instance
  }

  /**
   * 전투 시작
   */
  async startCombat(
    dungeonId: string,
    stageId: string,
    player: Character,
    stage: DungeonStage,
    options: CombatStartOptions
  ): Promise<string> {
    const combatId = this.generateCombatId()
    
    // 플레이어 파티 생성
    const playerParticipant = await this.createPlayerParticipant(player)
    
    // 몬스터 생성
    const monsters = this.createMonsterParticipants(stage.monsters, options.difficulty)
    
    // 전투 상태 초기화
    const combatState: CombatState = {
      id: combatId,
      participants: [playerParticipant, ...monsters],
      turnOrder: this.calculateTurnOrder([playerParticipant, ...monsters]),
      currentTurn: '',
      turnCount: 0,
      phase: 'preparation',
      environment: {
        type: 'dungeon',
        terrain: 'plains', // TODO: 던전별 지형
        modifiers: []
      },
      history: [],
      startedAt: Date.now(),
      difficulty: options.difficulty // 난이도 정보 저장
    }

    this.combatStates.set(combatId, combatState)

    // 준비 페이즈 후 전투 시작
    setTimeout(() => {
      this.startBattlePhase(combatId)
    }, COMBAT_PHASE_CONFIG.preparation.duration) // 준비 시간 사용

    return combatId
  }

  /**
   * 전투 진행
   */
  private startBattlePhase(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state || state.phase !== 'preparation') return

    // 새로운 상태 객체 생성
    const newState: CombatState = {
      ...state,
      phase: 'battle',
      currentTurn: state.turnOrder[0]
    }
    this.combatStates.set(combatId, newState)
    
    // 턴 진행 시작
    const interval = setInterval(() => {
      this.processTurn(combatId)
    }, COMBAT_CONFIG.turnDuration)
    
    this.combatIntervals.set(combatId, interval)
  }

  /**
   * 턴 처리
   */
  private processTurn(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state || state.phase !== 'battle') return

    const currentParticipant = state.participants.find(p => p.id === state.currentTurn)
    if (!currentParticipant || currentParticipant.currentHp <= 0) {
      this.nextTurn(combatId)
      return
    }

    // AI 행동 결정 (플레이어가 아닌 경우)
    if (currentParticipant.type !== 'player') {
      console.log('AI 턴:', currentParticipant.name, currentParticipant.id)
      const action = this.decideAIAction(currentParticipant, state)
      console.log('AI 행동:', action)
      this.executeAction(combatId, action)
      
      // AI 행동 후 다음 턴으로
      setTimeout(() => {
        const updatedState = this.combatStates.get(combatId)
        if (updatedState && this.checkBattleEnd(updatedState)) {
          this.endBattle(combatId)
        } else {
          this.nextTurn(combatId)
        }
      }, 1000) // 1초 후 다음 턴
    }
    // 플레이어는 수동으로 행동 선택 - 자동으로 다음 턴으로 넘어가지 않음
  }

  /**
   * 플레이어 행동 실행
   */
  executePlayerAction(
    combatId: string,
    action: CombatAction
  ): { success: boolean; message?: string } {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return { success: false, message: 'Combat not found' }
    }

    if (state.currentTurn !== action.actorId) {
      return { success: false, message: 'Not your turn' }
    }

    this.executeAction(combatId, action)
    
    // 플레이어 행동 후 다음 턴으로
    setTimeout(() => {
      const updatedState = this.combatStates.get(combatId)
      if (updatedState && this.checkBattleEnd(updatedState)) {
        this.endBattle(combatId)
      } else {
        this.nextTurn(combatId)
      }
    }, 1000) // 1초 후 다음 턴
    
    return { success: true }
  }

  /**
   * 행동 실행
   */
  private executeAction(combatId: string, action: CombatAction): void {
    const state = this.combatStates.get(combatId)
    if (!state) return

    const actor = state.participants.find(p => p.id === action.actorId)
    const targets = action.targetIds.map(id => 
      state.participants.find(p => p.id === id)
    ).filter(Boolean) as CombatParticipant[]

    if (!actor || targets.length === 0) return

    const results = []

    // 새로운 participants 배열 생성
    let updatedParticipants = [...state.participants]

    switch (action.type) {
      case 'attack':
        for (const target of targets) {
          const damage = this.calculateDamage(actor, target)
          
          console.log('공격 실행:', {
            attacker: actor.name,
            target: target.name,
            damage: damage,
            targetHpBefore: target.currentHp
          })
          
          // target을 업데이트된 버전으로 교체
          const actualDamage = damage.isDodged ? 0 : damage.amount
          updatedParticipants = updatedParticipants.map(p => 
            p.id === target.id 
              ? { ...p, currentHp: Math.max(0, p.currentHp - actualDamage) }
              : p
          )
          
          const updatedTarget = updatedParticipants.find(p => p.id === target.id)
          console.log('타겟 HP 업데이트 후:', {
            targetId: target.id,
            targetName: target.name,
            actualDamage,
            hpBefore: target.currentHp,
            hpAfter: updatedTarget?.currentHp,
            isDead: updatedTarget?.currentHp === 0
          })
          
          results.push({
            targetId: target.id,
            damage
          })
        }
        break

      case 'skill':
        if (action.skillId) {
          try {
            // 스킬 정보 가져오기
            const skill = skillExecutionService.getSkill(action.skillId)
            if (!skill) {
              throw new Error(`Skill not found: ${action.skillId}`)
            }
            
            // MP 비용 계산
            const mpCost = typeof skill.mpCost === 'number' ? skill.mpCost : skill.mpCost.base
            
            const skillResult = skillExecutionService.executeSkill(
              action.skillId,
              actor.id,
              [...action.targetIds], // readonly 배열을 복사
              this.createSkillContext(state),
              1 // TODO: 스킬 레벨
            )
            
            // MP 차감 (스킬 실행이 성공한 경우에만)
            updatedParticipants = updatedParticipants.map(p => 
              p.id === actor.id
                ? { ...p, currentMp: Math.max(0, p.currentMp - mpCost) }
                : p
            )
            
            // 스킬 결과 적용
            for (const effect of skillResult.effects) {
              if (effect.effect.type === 'damage') {
                updatedParticipants = updatedParticipants.map(p => 
                  p.id === effect.targetId
                    ? { ...p, currentHp: Math.max(0, p.currentHp - effect.actualValue) }
                    : p
                )
                
                // 결과 추가
                results.push({
                  targetId: effect.targetId,
                  damage: {
                    amount: effect.actualValue,
                    isCritical: effect.isCritical || false,
                    isDodged: false,
                    element: skill.effects[0]?.element || 'physical'
                  }
                })
              }
              // TODO: 다른 효과 처리
            }
          } catch (error) {
            console.error('Skill execution failed:', error)
          }
        }
        break

      case 'defend':
        // 방어 버프 적용
        updatedParticipants = updatedParticipants.map(p => 
          p.id === actor.id
            ? {
                ...p,
                statusEffects: [
                  ...p.statusEffects,
                  {
                    id: 'defend',
                    type: 'defenseUp',
                    source: actor.id,
                    remainingDuration: 1,
                    stacks: 1,
                    value: 50, // 50% 방어력 증가
                    appliedAt: Date.now()
                  }
                ]
              }
            : p
        )
        
        // 방어 결과 추가
        results.push({
          targetId: actor.id,
          statusEffects: [{
            type: 'defenseUp',
            applied: true
          }]
        })
        break

      case 'item':
        // TODO: 아이템 사용
        break
    }

    // 행동 기록 - 새로운 상태 객체 생성
    const newState: CombatState = {
      ...state,
      participants: updatedParticipants,
      history: [
        ...state.history,
        {
          ...action,
          results,
          timestamp: Date.now()
        }
      ]
    }
    this.combatStates.set(combatId, newState)
    
    console.log('[executeAction Complete]', {
      combatId,
      actionType: action.type,
      updatedParticipants: updatedParticipants.map(p => ({
        id: p.id,
        name: p.name,
        currentHp: p.currentHp,
        team: p.team
      }))
    })
  }

  /**
   * AI 행동 결정
   */
  private decideAIAction(
    participant: CombatParticipant,
    state: CombatState
  ): CombatAction {
    const ai = participant.ai || { 
      type: 'aggressive',
      aggressiveness: 70,
      skillPreference: 'random',
      targetingPriority: 'lowest_hp'
    }

    const pattern = AI_BEHAVIOR_PATTERNS[ai.type]
    const roll = Math.random()

    // 행동 타입 결정
    let actionType: CombatAction['type'] = 'attack'
    let cumulative = 0
    
    if (roll < (cumulative += pattern.attackWeight)) {
      actionType = 'attack'
    } else if (roll < (cumulative += pattern.skillWeight) && participant.skills.length > 0) {
      actionType = 'skill'
    } else if (roll < (cumulative += pattern.defendWeight)) {
      actionType = 'defend'
    } else {
      actionType = 'item'
    }

    // 타겟 선택
    const targets = this.selectAITargets(participant, state, ai.targetingPriority)

    const action: CombatAction = {
      id: this.generateActionId(),
      turn: state.turnCount,
      actorId: participant.id,
      type: actionType,
      targetIds: targets.map(t => t.id),
      timestamp: Date.now(),
      results: [] // AI가 실행할 때 채워질 예정
    }

    // 스킬 선택
    if (actionType === 'skill' && participant.skills.length > 0) {
      const availableSkills = participant.skills.filter(skillId => 
        !skillExecutionService.isOnCooldown(participant.id, skillId)
      )
      
      if (availableSkills.length > 0) {
        return {
          ...action,
          skillId: availableSkills[Math.floor(Math.random() * availableSkills.length)]
        }
      } else {
        return {
          ...action,
          type: 'attack' // 스킬이 쿨다운이면 기본 공격
        }
      }
    }

    return action
  }

  /**
   * AI 타겟 선택
   */
  private selectAITargets(
    actor: CombatParticipant,
    state: CombatState,
    priority: string
  ): CombatParticipant[] {
    const enemies = state.participants.filter(p => 
      p.team !== actor.team && p.currentHp > 0
    )

    if (enemies.length === 0) return []

    switch (priority) {
      case 'lowest_hp':
        return [enemies.reduce((a, b) => a.currentHp < b.currentHp ? a : b)]
      
      case 'highest_hp':
        return [enemies.reduce((a, b) => a.currentHp > b.currentHp ? a : b)]
      
      case 'highest_damage':
        // TODO: 가장 많은 피해를 준 적
        return [enemies[0]]
      
      case 'random':
      default:
        return [enemies[Math.floor(Math.random() * enemies.length)]]
    }
  }

  /**
   * 데미지 계산
   */
  private calculateDamage(
    attacker: CombatParticipant,
    defender: CombatParticipant,
    isSkill: boolean = false,
    skillMultiplier: number = 1.0
  ): DamageResult {
    const attackPower = attacker.stats.attack
    const defense = defender.stats.defense
    
    // 기본 데미지
    let damage = Math.max(
      COMBAT_CONFIG.minDamage,
      attackPower - defense * COMBAT_CONFIG.defenseEffectiveness
    )
    
    console.log('[calculateDamage]', {
      attacker: attacker.name,
      defender: defender.name,
      attackPower,
      defense,
      baseDamage: damage,
      isSkill,
      skillMultiplier
    })

    // 스킬 배율 적용
    if (isSkill) {
      damage *= skillMultiplier
    }

    // 데미지 변동
    const variance = 1 + (Math.random() - 0.5) * COMBAT_CONFIG.damageVariance * 2
    damage *= variance

    // 명중률 체크 (회피 전에 먼저 체크)
    const hitChance = Math.min(0.95, attacker.stats.accuracy - defender.stats.dodge)
    const isHit = Math.random() < hitChance
    const isDodged = !isHit // isDodged 변수 추가
    
    if (isDodged) {
      return {
        damage: 0,
        isCritical: false,
        isDodged: true,
        actualDamage: 0
      }
    }

    // 치명타 체크
    const critChance = Math.min(0.5, attacker.stats.critRate) // 최대 50% 제한
    const isCritical = Math.random() < critChance
    if (isCritical) {
      damage *= attacker.stats.critDamage
    }

    // 저항력 적용
    const resistance = defender.stats.resistance || 0
    damage *= (1 - resistance / 100)

    // 속성 상성 체크
    if (attacker.element && defender.element) {
      const elementalMultiplier = this.getElementalMultiplier(attacker.element, defender.element)
      damage *= elementalMultiplier
    }

    // 최종 데미지 반올림
    damage = Math.round(damage)
    
    console.log('[calculateDamage Final]', {
      finalDamage: damage,
      isCritical,
      isDodged: false,
      variance,
      resistance,
      hitChance
    })

    return {
      amount: Math.floor(damage),
      type: 'physical',
      element: 'physical',
      isCritical,
      isDodged: false, // 여기까지 왔다면 회피하지 않은 것
      isBlocked: false,
      isResisted: false
    }
  }

  /**
   * 다음 턴
   */
  private nextTurn(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) return

    const currentIndex = state.turnOrder.indexOf(state.currentTurn)
    const nextIndex = (currentIndex + 1) % state.turnOrder.length
    
    // 새로운 상태 객체 생성
    const newState: CombatState = {
      ...state,
      currentTurn: state.turnOrder[nextIndex]
    }
    this.combatStates.set(combatId, newState)

    // 상태 효과 지속시간 감소
    this.updateStatusEffects(combatId)
  }

  /**
   * 상태 효과 업데이트
   */
  private updateStatusEffects(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) return

    // 새로운 participants 배열 생성
    const updatedParticipants = state.participants.map(participant => ({
      ...participant,
      statusEffects: participant.statusEffects
        .map(effect => ({
          ...effect,
          remainingDuration: effect.remainingDuration - 1
        }))
        .filter(effect => effect.remainingDuration > 0)
    }))

    // 새로운 상태 객체 생성
    const newState: CombatState = {
      ...state,
      participants: updatedParticipants
    }
    this.combatStates.set(combatId, newState)
  }

  /**
   * 전투 종료 체크
   */
  private checkBattleEnd(state: CombatState): boolean {
    const alivePlayerTeam = state.participants.filter(p => 
      p.team === 'player' && p.currentHp > 0
    )
    const aliveEnemyTeam = state.participants.filter(p => 
      p.team === 'enemy' && p.currentHp > 0
    )

    return alivePlayerTeam.length === 0 || aliveEnemyTeam.length === 0
  }

  /**
   * 전투 종료
   */
  private endBattle(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) return

    // 전투 인터벌 정리
    const interval = this.combatIntervals.get(combatId)
    if (interval) {
      clearInterval(interval)
      this.combatIntervals.delete(combatId)
    }

    // 승자 결정
    const alivePlayerTeam = state.participants.filter(p => 
      p.team === 'player' && p.currentHp > 0
    )
    const winner = alivePlayerTeam.length > 0 ? 'player' : 'enemy'

    // 새로운 상태 객체 생성
    const newState: CombatState = {
      ...state,
      phase: winner === 'player' ? 'victory' : 'defeat',
      endedAt: Date.now()
    }
    this.combatStates.set(combatId, newState)

    // 보상 계산
    if (winner === 'player') {
      this.calculateRewards(combatId)
      
      // 리더보드 기록 업데이트
      const statistics = this.calculateStatistics(combatId)
      leaderboardService.updateCombatRecords({
        totalDamage: statistics.totalDamageDealt,
        maxDamage: this.getMaxSingleDamage(newState),
        maxCombo: statistics.maxCombo,
        fastestClear: Math.floor((newState.endedAt! - newState.startedAt) / 1000) // 초 단위
      })
    }
  }

  /**
   * 보상 계산
   */
  private calculateRewards(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) return

    const defeatedMonsters = state.participants.filter(p => 
      p.team === 'enemy' && p.currentHp <= 0
    )
    
    // 난이도별 보상 배율
    const difficultyMultipliers = {
      'easy': 0.8,
      'normal': 1.0,
      'hard': 1.5,
      'nightmare': 2.0,
      'expert': 3.0,
      'legendary': 5.0
    }
    const difficultyMultiplier = difficultyMultipliers[state.difficulty || 'normal'] || 1.0

    let totalGold = 0
    const items: GeneratedItem[] = []

    for (const monster of defeatedMonsters) {
      // 골드 - 경험치 제거 후 골드 보상 증가 + 난이도 배율
      const goldBase = COMBAT_REWARD_CONFIG.baseGoldFormula.base * 2 // 2배 증가
      const goldLevel = monster.level * COMBAT_REWARD_CONFIG.baseGoldFormula.levelMultiplier * 1.5
      const goldVariance = COMBAT_REWARD_CONFIG.baseGoldFormula.randomRange
      const goldMultiplier = goldVariance.min + Math.random() * (goldVariance.max - goldVariance.min)
      totalGold += Math.floor((goldBase + goldLevel) * goldMultiplier * difficultyMultiplier)

      // 아이템 드롭 - 난이도별 드롭률 증가
      const baseDropChance = 0.3 // 30% 기본 드롭률
      const dropChance = Math.min(1, baseDropChance * difficultyMultiplier)
      
      if (Math.random() < dropChance) {
        const dropItem = itemGenerationService.generateDropItem(
          monster.level,
          monster.type as any
        )
        if (dropItem) {
          items.push(dropItem)
        }
      }
      
      // 추가 드롭 찬스 (보스/엘리트 몬스터)
      if (monster.type === 'boss' || monster.type === 'elite') {
        // 보스는 난이도에 따라 여러 개 드롭 가능
        const bonusDropCount = Math.floor(difficultyMultiplier)
        for (let i = 0; i < bonusDropCount; i++) {
          const bonusDropItem = itemGenerationService.generateDropItem(
            monster.level,
            monster.type as any
          )
          if (bonusDropItem) {
            items.push(bonusDropItem)
          }
        }
      }
    }

    // 보너스 적용
    const bonuses = this.calculateBonuses(combatId)
    if (bonuses.perfectVictory) {
      totalGold *= COMBAT_REWARD_CONFIG.bonuses.perfectVictory.gold
    }
    if (bonuses.speedBonus) {
      totalGold *= COMBAT_REWARD_CONFIG.bonuses.speedBonus.gold
    }

    // 결과 저장 - 경험치 제거
    const result: CombatResult = {
      combatId: state.id,
      winner: 'player',
      reason: 'defeat_all',
      statistics: this.calculateStatistics(combatId),
      rewards: {
        experience: 0, // 경험치 제거
        gold: Math.floor(totalGold),
        items: items.map(item => ({
          itemId: item.id,
          quantity: 1,
          chance: 100
        })),
        bonuses
      },
      experience: {}, // 경험치 분배 제거
      duration: state.endedAt! - state.startedAt
    }

    // 새로운 상태 객체 생성하여 보상 저장
    const newState: CombatState = {
      ...state,
      rewards: result.rewards
    }
    this.combatStates.set(combatId, newState)
  }

  /**
   * 보너스 계산
   */
  private calculateBonuses(combatId: string): CombatBonuses {
    const state = this.combatStates.get(combatId)
    if (!state) return {
      perfectVictory: false,
      speedBonus: false,
      overkill: false,
      combo: 0,
      skillMaster: false
    }

    const player = state.participants.find(p => p.team === 'player')
    if (!player) return {
      perfectVictory: false,
      speedBonus: false,
      overkill: false,
      combo: 0,
      skillMaster: false
    }

    // 콤보 계산
    let maxCombo = 0
    let currentCombo = 0
    for (const action of state.history) {
      if (action.actorId === player.id && action.type === 'attack' && action.results.length > 0) {
        const result = action.results[0]
        if (result.damage && result.damage > 0) {
          currentCombo++
          maxCombo = Math.max(maxCombo, currentCombo)
        } else {
          currentCombo = 0
        }
      } else if (action.targetIds.includes(player.id) && action.results.length > 0) {
        const result = action.results.find(r => r.targetId === player.id)
        if (result?.damage && result.damage > 0) {
          currentCombo = 0
        }
      }
    }

    // 오버킬 판정
    let overkillCount = 0
    for (const action of state.history) {
      for (const result of action.results) {
        if (result.targetHp <= 0 && result.damage > result.targetHp + 50) {
          overkillCount++
        }
      }
    }

    return {
      perfectVictory: player.currentHp === player.stats.hp,
      speedBonus: state.turnCount < 10,
      overkill: overkillCount > 0,
      combo: maxCombo,
      skillMaster: state.history.filter(a => a.type === 'skill' && a.actorId === player.id).length >= 5
    }
  }

  /**
   * 속성 상성 계산
   */
  private getElementalMultiplier(attackerElement: string, defenderElement: string): number {
    // 속성 상성표
    const elementalChart: Record<string, Record<string, number>> = {
      fire: { water: 0.5, nature: 2.0, ice: 2.0 },
      water: { fire: 2.0, nature: 0.5, earth: 0.5 },
      nature: { water: 2.0, fire: 0.5, earth: 2.0 },
      earth: { fire: 0.5, water: 2.0, wind: 0.5 },
      wind: { earth: 2.0, nature: 0.5, ice: 0.5 },
      ice: { fire: 0.5, wind: 2.0, water: 0.5 },
      light: { dark: 2.0 },
      dark: { light: 2.0 }
    }

    const multiplier = elementalChart[attackerElement]?.[defenderElement]
    return multiplier || 1.0
  }

  /**
   * 통계 계산
   */
  private calculateStatistics(combatId: string): CombatStatistics {
    const state = this.combatStates.get(combatId)
    if (!state) return {
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalHealingDone: 0,
      skillsUsed: 0,
      itemsUsed: 0,
      criticalHits: 0,
      dodges: 0,
      blocks: 0,
      maxCombo: 0,
      turnsSurvived: 0,
      enemiesDefeated: 0
    }

    const playerParticipants = state.participants.filter(p => p.team === 'player')
    const playerIds = new Set(playerParticipants.map(p => p.id))
    
    let totalDamageDealt = 0
    let totalDamageTaken = 0
    let totalHealingDone = 0
    let skillsUsed = 0
    let itemsUsed = 0
    let criticalHits = 0
    let dodges = 0
    let blocks = 0
    let maxCombo = 0
    let currentCombo = 0

    // 히스토리 분석
    for (const action of state.history) {
      const isPlayerAction = playerIds.has(action.actorId)
      
      // 스킬/아이템 사용 카운트
      if (isPlayerAction) {
        if (action.type === 'skill') skillsUsed++
        if (action.type === 'item') itemsUsed++
      }
      
      // 결과 분석
      for (const result of action.results) {
        if (result.damage) {
          if (isPlayerAction) {
            // 플레이어가 준 데미지
            totalDamageDealt += result.damage.amount
            if (result.damage.isCritical) criticalHits++
            if (result.damage.amount > 0) {
              currentCombo++
              maxCombo = Math.max(maxCombo, currentCombo)
            }
          } else if (playerIds.has(result.targetId)) {
            // 플레이어가 받은 데미지
            totalDamageTaken += result.damage.amount
            if (result.damage.isDodged) dodges++
            if (result.damage.isBlocked) blocks++
            if (result.damage.amount > 0) currentCombo = 0
          }
        }
        
        if (result.healing && isPlayerAction) {
          totalHealingDone += result.healing
        }
      }
    }

    return {
      totalDamageDealt,
      totalDamageTaken,
      totalHealingDone,
      skillsUsed,
      itemsUsed,
      criticalHits,
      dodges,
      blocks,
      maxCombo,
      turnsSurvived: state.turnCount,
      enemiesDefeated: state.participants.filter(p => 
        p.team === 'enemy' && p.currentHp <= 0
      ).length
    }
  }

  /**
   * 플레이어 참가자 생성
   */
  private async createPlayerParticipant(player: Character): Promise<CombatParticipant> {
    // 플레이어의 학습한 스킬 가져오기
    const playerSkills = await this.getPlayerLearnedSkills(player.id)
    
    return {
      id: player.id,
      name: player.name,
      type: 'player',
      level: player.level,
      stats: {
        hp: player.combatStats.hp,
        mp: player.combatStats.mp,
        attack: player.combatStats.attack,
        defense: player.combatStats.defense,
        speed: player.combatStats.speed,
        critRate: player.combatStats.critRate,
        critDamage: player.combatStats.critDamage,
        dodge: player.combatStats.dodge,
        accuracy: player.combatStats.accuracy,
        resistance: player.combatStats.resistance
      } as CombatStats,
      currentHp: player.combatStats.hp,
      currentMp: player.combatStats.mp,
      position: { x: 0, y: 0 },
      team: 'player',
      skills: playerSkills,
      statusEffects: []
    }
  }

  /**
   * 몬스터 참가자 생성
   */
  private createMonsterParticipants(
    monsters: DungeonMonster[],
    difficulty?: string
  ): CombatParticipant[] {
    console.log('[createMonsterParticipants]', {
      monstersCount: monsters.length,
      difficulty,
      monsterDetails: monsters.map(m => ({
        id: m.id,
        name: m.name,
        level: m.level,
        hp: m.hp,
        attack: m.attack,
        defense: m.defense,
        skills: m.skills
      }))
    })
    
    return monsters.map((monster, index) => ({
      id: `enemy_${monster.id}_${index}`,
      name: monster.name,
      type: 'monster',
      level: monster.level,
      stats: {
        hp: monster.hp,
        mp: 0,
        attack: monster.attack,
        defense: monster.defense,
        speed: monster.speed || 50,
        critRate: this.getMonsterCritRate(monster.level, monster.type),
        critDamage: this.getMonsterCritDamage(monster.level, monster.type),
        dodge: this.getMonsterDodge(monster.level, monster.type),
        accuracy: this.getMonsterAccuracy(monster.level, monster.type),
        resistance: this.getMonsterResistance(monster.level, monster.type)
      } as CombatStats,
      currentHp: monster.hp,
      currentMp: 0,
      position: { x: 3 + (index % 3), y: Math.floor(index / 3) },
      team: 'enemy',
      skills: monster.skills,
      statusEffects: [],
      ai: {
        type: 'aggressive',
        aggressiveness: 70,
        skillPreference: 'random',
        targetingPriority: 'lowest_hp',
      }
    }))
  }

  /**
   * 몬스터 치명타율 계산
   */
  private getMonsterCritRate(level: number, type: string): number {
    const baseRate = 0.05 // 5% 기본 치명타율
    const levelBonus = level * 0.001 // 레벨당 0.1%
    
    const typeBonus: Record<string, number> = {
      'assassin': 0.15,
      'warrior': 0.08,
      'ranger': 0.12,
      'mage': 0.06,
      'tank': 0.03,
      'support': 0.04
    }
    
    return Math.min(0.5, baseRate + levelBonus + (typeBonus[type] || 0))
  }

  /**
   * 몬스터 치명타 데미지 계산
   */
  private getMonsterCritDamage(level: number, type: string): number {
    const baseDamage = 1.5 // 150% 기본 치명타 데미지
    const levelBonus = level * 0.005 // 레벨당 0.5%
    
    const typeBonus: Record<string, number> = {
      'assassin': 0.4,
      'warrior': 0.2,
      'ranger': 0.3,
      'mage': 0.25,
      'tank': 0.1,
      'support': 0.15
    }
    
    return baseDamage + levelBonus + (typeBonus[type] || 0)
  }

  /**
   * 몬스터 회피율 계산
   */
  private getMonsterDodge(level: number, type: string): number {
    const baseDodge = 0.05 // 5% 기본 회피율
    const levelBonus = level * 0.002 // 레벨당 0.2%
    
    const typeBonus: Record<string, number> = {
      'assassin': 0.15,
      'ranger': 0.12,
      'thief': 0.18,
      'tank': -0.05,
      'warrior': 0.03,
      'mage': 0.08
    }
    
    return Math.min(0.5, Math.max(0, baseDodge + levelBonus + (typeBonus[type] || 0)))
  }

  /**
   * 몬스터 명중률 계산
   */
  private getMonsterAccuracy(level: number, type: string): number {
    const baseAccuracy = 0.8 // 80% 기본 명중률
    const levelBonus = level * 0.003 // 레벨당 0.3%
    
    const typeBonus: Record<string, number> = {
      'ranger': 0.1,
      'assassin': 0.08,
      'mage': 0.06,
      'warrior': 0.04,
      'tank': 0.02,
      'berserker': -0.05
    }
    
    return Math.min(0.99, baseAccuracy + levelBonus + (typeBonus[type] || 0))
  }

  /**
   * 몬스터 저항력 계산
   */
  private getMonsterResistance(level: number, type: string): number {
    const baseResistance = 0 // 0% 기본 저항력
    const levelBonus = level * 0.5 // 레벨당 0.5%
    
    const typeBonus: Record<string, number> = {
      'tank': 20,
      'warrior': 10,
      'paladin': 15,
      'mage': 5,
      'assassin': 0,
      'elemental': 25
    }
    
    return Math.min(50, baseResistance + levelBonus + (typeBonus[type] || 0))
  }

  /**
   * 턴 순서 계산 (속도 기반)
   */
  private calculateTurnOrder(participants: CombatParticipant[]): string[] {
    return participants
      .filter(p => p.currentHp > 0)
      .sort((a, b) => b.stats.speed - a.stats.speed)
      .map(p => p.id)
  }

  /**
   * 스킬 컨텍스트 생성
   */
  private createSkillContext(state: CombatState): SkillContext {
    const caster = state.participants.find(p => p.id === state.currentTurn)!
    return {
      caster: {
        id: caster.id,
        stats: caster.stats,
        buffs: caster.statusEffects.filter(e => e.value > 0).map(e => e.type),
        debuffs: caster.statusEffects.filter(e => e.value < 0).map(e => e.type)
      },
      targets: state.participants.map(p => ({
        id: p.id,
        stats: p.stats,
        resistances: {}
      }))
    }
  }

  /**
   * 유틸리티 함수
   */
  private generateCombatId(): string {
    return IdGenerators.combat()
  }

  private generateActionId(): string {
    return IdGenerators.combatAction()
  }

  /**
   * 전투 상태 가져오기
   */
  getCombatState(combatId: string): CombatState | null {
    return this.combatStates.get(combatId) || null
  }

  /**
   * 전투 속도 설정
   */
  setCombatSpeed(combatId: string, speed: 1 | 2 | 3): void {
    // TODO: 전투 속도 조절
  }

  /**
   * 최대 단일 데미지 계산
   */
  private getMaxSingleDamage(state: CombatState): number {
    let maxDamage = 0
    const playerIds = new Set(state.participants.filter(p => p.team === 'player').map(p => p.id))
    
    for (const action of state.history) {
      if (playerIds.has(action.actorId)) {
        for (const result of action.results) {
          if (result.damage && result.damage.amount > maxDamage) {
            maxDamage = result.damage.amount
          }
        }
      }
    }
    
    return maxDamage
  }

  /**
   * 플레이어가 학습한 스킬 가져오기
   */
  private async getPlayerLearnedSkills(playerId: string): Promise<string[]> {
    try {
      // 스킬 관리 서비스 초기화
      await skillManagementService.initialize(playerId)
      
      // 학습한 스킬 가져오기
      const learnedSkills = skillManagementService.getLearnedSkills()
      
      if (learnedSkills.length > 0) {
        // 전투에서 사용 가능한 스킬만 필터링
        const combatSkills = learnedSkills
          .filter(skill => skill.level > 0) // 레벨 1 이상인 스킬만
          .map(skill => skill.skillId)
          .slice(0, 4) // 최대 4개 스킬만 사용
        
        return combatSkills.length > 0 ? combatSkills : ['power_strike'] // 최소 1개 보장
      }
    } catch (error) {
      console.warn('Failed to get learned skills:', error)
    }
    
    // 기본 스킬 반환
    return ['power_strike', 'healing_light']
  }
}

// 싱글톤 인스턴스 export
export const dungeonCombatService = DungeonCombatService.getInstance()