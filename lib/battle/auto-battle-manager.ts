import type {
  BattleCharacter,
  BattleSkill,
  BattleAction,
  BattleResult,
  BattleState,
  CharacterStats,
  StatusEffect,
  ElementType,
  MonsterData
} from '@/lib/types/battle-extended'
import type { StatType, Result } from '@/lib/types/game-common'
import { GameError } from '@/lib/types/game-common'
import { db, dbHelpers } from '@/lib/database'
import { BATTLE_CONSTANTS } from '@/lib/types/battle-extended'
import { combatStatsService } from '@/lib/services/combat-stats.service'
import { playerService } from '@/lib/services/player.service'
import { skillManagementService } from '@/lib/services/skill-management.service'

// Mutable version of types for internal use
type MutableBattleState = {
  -readonly [K in keyof BattleState]: BattleState[K] extends ReadonlyArray<infer T>
    ? T[]
    : BattleState[K] extends object
    ? MutableDeep<BattleState[K]>
    : BattleState[K]
}

type MutableDeep<T> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U>
    ? U[]
    : T[K] extends object
    ? MutableDeep<T[K]>
    : T[K]
}

export class AutoBattleManager {
  private state: MutableBattleState
  private actionQueue: BattleAction[] = []
  private turnTimer: number = 0
  private comboCounter: Map<string, number> = new Map()
  private battleSpeed: number = 1000 // ms per action
  private onActionCallback?: (action: BattleAction) => void
  private onStateChangeCallback?: (state: BattleState) => void

  constructor(
    playerCharacter: BattleCharacter,
    enemyCharacter: BattleCharacter,
    battleSpeed: number = 1000
  ) {
    this.battleSpeed = battleSpeed
    this.state = {
      id: `battle_${Date.now()}`,
      player: JSON.parse(JSON.stringify(playerCharacter)),
      enemy: JSON.parse(JSON.stringify(enemyCharacter)),
      turn: 0,
      phase: 'preparing',
      timestamp: new Date(),
      actions: [],
      activeEffects: []
    } as MutableBattleState
  }

  // 플레이어 스탯을 전투 캐릭터로 변환
  static async createPlayerCharacter(userId: string): Promise<BattleCharacter> {
    // 플레이어 정보 가져오기
    const player = await playerService.getPlayer(userId)
    if (!player) {
      throw new GameError('PLAYER_NOT_FOUND', 'Player not found')
    }

    // 실생활 스탯 가져오기
    const stats = await db.playerStats
      .where('userId')
      .equals(userId)
      .toArray()
    const learningLevel = stats.find(s => s.statType === 'learning')?.level || 1

    // 실생활 + 장비 기반 전투 스탯 계산
    const combatStats = await combatStatsService.calculatePlayerCombatStats(userId)
    const battleStats = combatStatsService.toBattleCharacterStats(combatStats, player.level, learningLevel)

    // 학습한 스킬 가져오기
    const learnedSkills = skillManagementService.getLearnedSkills()
    const skills: BattleSkill[] = []

    // 기본 공격은 항상 포함
    skills.push({
      id: 'basic_attack',
      name: '기본 공격',
      type: 'damage',
      damageType: 'physical',
      element: 'neutral',
      power: 100,
      accuracy: 100,
      mpCost: 0,
      cooldown: 0,
      currentCooldown: 0,
      targetType: 'single',
      range: 1,
      description: '기본적인 물리 공격',
      animation: 'slash'
    })

    // 학습한 스킬들을 BattleSkill 형식으로 변환
    for (const [skillId, learnedSkill] of learnedSkills) {
      const skillData = skillManagementService.getSkill(skillId)
      if (skillData && learnedSkill.isActive) {
        skills.push({
          id: skillData.id,
          name: skillData.name,
          type: skillData.type,
          damageType: skillData.damageType,
          element: skillData.element || 'neutral',
          power: skillData.power || 0,
          accuracy: skillData.accuracy || 100,
          mpCost: skillData.mpCost,
          cooldown: skillData.cooldown,
          currentCooldown: learnedSkill.cooldownRemaining,
          targetType: skillData.targetType,
          range: skillData.range,
          description: skillData.description,
          animation: skillData.animation || 'default',
          healAmount: skillData.healAmount,
          statusEffect: skillData.statusEffect,
          comboWith: skillData.comboWith,
          hitCount: skillData.hitCount
        })
      }
    }

    return {
      id: userId,
      name: '플레이어',
      type: 'player',
      stats: battleStats,
      skills,
      position: { x: 100, y: 200 },
      statusEffects: [],
      equipment: []
    }
  }

  // 몬스터 데이터를 전투 캐릭터로 변환
  static createEnemyCharacter(monsterData: MonsterData): BattleCharacter {
    return {
      id: monsterData.id,
      name: monsterData.name,
      type: 'enemy',
      stats: { ...monsterData.stats },
      skills: [...monsterData.skills],
      position: { x: 500, y: 200 },
      statusEffects: [],
      resistances: monsterData.resistances,
      weaknesses: monsterData.weaknesses
    }
  }

  // 레벨에 따른 플레이어 스킬 생성 - 이제는 사용하지 않음 (스킬북 시스템으로 대체)
  // 하위 호환성을 위해 남겨둠
  private static getPlayerSkills(
    healthLevel: number,
    learningLevel: number,
    relationshipLevel: number,
    achievementLevel: number
  ): BattleSkill[] {
    // 기본 공격만 반환
    return [{
      id: 'basic_attack',
      name: '기본 공격',
      type: 'damage',
      damageType: 'physical',
      element: 'neutral',
      power: 100,
      accuracy: 100,
      mpCost: 0,
      cooldown: 0,
      currentCooldown: 0,
      targetType: 'single',
      range: 1,
      description: '기본적인 물리 공격',
      animation: 'slash'
    }]
  }

  // 전투 시작
  async startBattle(
    onAction?: (action: BattleAction) => void,
    onStateChange?: (state: BattleState) => void
  ): Promise<BattleResult> {
    this.onActionCallback = onAction
    this.onStateChangeCallback = onStateChange
    
    this.state.phase = 'fighting'
    this.updateState()

    while (!this.isBattleOver() && this.state.phase === 'fighting') {
      await this.executeTurn()
      await this.delay(this.battleSpeed)
    }

    const result: BattleResult = {
      winner: this.getWinner(),
      turns: this.state.turn,
      actions: this.state.actions,
      experience: this.calculateExperience(),
      rewards: this.getWinner() === 'player' ? this.calculateRewards() : undefined
    }

    this.state.phase = 'finished'
    this.updateState()

    return result
  }

  // 턴 실행
  private async executeTurn() {
    this.state.turn++
    
    // 상태 이상 효과 적용
    this.applyStatusEffects()
    
    // 속도에 따른 행동 순서 결정
    const playerSpeed = this.getEffectiveSpeed(this.state.player)
    const enemySpeed = this.getEffectiveSpeed(this.state.enemy)
    
    if (playerSpeed >= enemySpeed) {
      await this.executeCharacterAction(this.state.player, this.state.enemy)
      if (!this.isBattleOver()) {
        await this.executeCharacterAction(this.state.enemy, this.state.player)
      }
    } else {
      await this.executeCharacterAction(this.state.enemy, this.state.player)
      if (!this.isBattleOver()) {
        await this.executeCharacterAction(this.state.player, this.state.enemy)
      }
    }
    
    // 쿨다운 감소
    this.updateCooldowns()
    
    // 상태 이상 지속시간 감소
    this.updateStatusEffects()
    
    this.updateState()
  }

  // 캐릭터 행동 실행
  private async executeCharacterAction(attacker: MutableDeep<BattleCharacter>, defender: MutableDeep<BattleCharacter>) {
    const availableSkills = attacker.skills.filter(
      skill => skill.currentCooldown === 0 && attacker.stats.mp >= skill.mpCost
    )
    
    if (availableSkills.length === 0) return
    
    const selectedSkill = this.selectSkill(attacker, defender, availableSkills)
    const action = await this.executeSkill(attacker, defender, selectedSkill)
    
    this.state.actions.push(action)
    this.actionQueue.push(action)
    
    if (this.onActionCallback) {
      this.onActionCallback(action)
    }
    
    // MP 소모 및 쿨다운 적용
    attacker.stats.mp -= selectedSkill.mpCost
    // Find and update the skill in the attacker's skills array
    const skillIndex = attacker.skills.findIndex(s => s.id === selectedSkill.id)
    if (skillIndex !== -1) {
      attacker.skills[skillIndex] = {
        ...attacker.skills[skillIndex],
        currentCooldown: selectedSkill.cooldown
      }
    }
  }

  // 스킬 선택 AI
  private selectSkill(
    attacker: MutableDeep<BattleCharacter>,
    defender: MutableDeep<BattleCharacter>,
    availableSkills: BattleSkill[]
  ): BattleSkill {
    // HP가 낮으면 힐 우선
    if (attacker.stats.hp < attacker.stats.maxHp * 0.3) {
      const healSkill = availableSkills.find(s => s.type === 'heal')
      if (healSkill) return healSkill
    }
    
    // 버프가 없으면 버프 사용
    const hasBuffs = attacker.statusEffects.some(e => e.type === 'buff')
    if (!hasBuffs) {
      const buffSkill = availableSkills.find(s => s.type === 'buff')
      if (buffSkill) return buffSkill
    }
    
    // 콤보 가능한 스킬 확인
    const lastAction = this.actionQueue[this.actionQueue.length - 1]
    if (lastAction && lastAction.attacker === attacker.id) {
      const comboSkills = availableSkills.filter(
        s => s.comboWith?.includes(lastAction.skill.id)
      )
      if (comboSkills.length > 0) {
        return comboSkills[0]
      }
    }
    
    // 약점 공격 우선
    if (defender.weaknesses) {
      const weaknessSkills = availableSkills.filter(
        s => s.element && defender.weaknesses?.includes(s.element)
      )
      if (weaknessSkills.length > 0) {
        return weaknessSkills[0]
      }
    }
    
    // 가장 강력한 공격 스킬 사용
    const attackSkills = availableSkills
      .filter(s => s.type === 'damage')
      .sort((a, b) => (b.power || 0) - (a.power || 0))
    
    return attackSkills[0] || availableSkills[0]
  }

  // 스킬 실행
  private async executeSkill(
    attacker: MutableDeep<BattleCharacter>,
    defender: MutableDeep<BattleCharacter>,
    skill: BattleSkill
  ): Promise<BattleAction> {
    let action: BattleAction
    
    switch (skill.type) {
      case 'damage':
        const damageResult = this.calculateDamage(attacker, defender, skill)
        
        if (!damageResult.isEvaded) {
          defender.stats.hp = Math.max(0, defender.stats.hp - damageResult.damage)
          
          // 상태 이상 효과 적용
          if (skill.statusEffect) {
            this.applyStatusEffect(defender, skill.statusEffect)
          }
        }
        
        action = {
          id: `action_${Date.now()}`,
          attacker: attacker.id,
          target: defender.id,
          skill,
          timestamp: Date.now(),
          turn: this.state.turn,
          action: 'skill' as const,
          damage: damageResult.damage,
          isCritical: damageResult.isCritical,
          isEvaded: damageResult.isEvaded,
          elementalBonus: damageResult.elementalBonus,
          statusEffectApplied: skill.statusEffect?.name
        }
        break
        
      case 'heal':
        const healAmount = skill.healAmount || 0
        const actualHeal = Math.min(healAmount, attacker.stats.maxHp - attacker.stats.hp)
        attacker.stats.hp += actualHeal
        
        action = {
          id: `action_${Date.now()}`,
          attacker: attacker.id,
          target: defender.id,
          skill,
          timestamp: Date.now(),
          turn: this.state.turn,
          action: 'skill' as const,
          healing: actualHeal
        }
        break
        
      case 'buff':
      case 'debuff':
        if (skill.statusEffect) {
          const target = skill.type === 'buff' ? attacker : defender
          this.applyStatusEffect(target, skill.statusEffect)
        }
        
        action = {
          id: `action_${Date.now()}`,
          attacker: attacker.id,
          target: defender.id,
          skill,
          timestamp: Date.now(),
          turn: this.state.turn,
          action: 'skill' as const,
          statusEffectApplied: skill.statusEffect?.name
        }
        break
        
      default:
        action = {
          id: `action_${Date.now()}`,
          attacker: attacker.id,
          target: defender.id,
          skill,
          timestamp: Date.now(),
          turn: this.state.turn,
          action: 'skill' as const
        }
    }
    
    // 콤보 카운터 업데이트
    if (skill.comboWith) {
      const comboCount = (this.comboCounter.get(attacker.id) || 0) + 1
      this.comboCounter.set(attacker.id, comboCount)
      action = {
        ...action,
        comboCount
      }
    } else {
      this.comboCounter.set(attacker.id, 0)
    }
    
    return action
  }

  // 데미지 계산
  private calculateDamage(
    attacker: MutableDeep<BattleCharacter>,
    defender: MutableDeep<BattleCharacter>,
    skill: BattleSkill
  ): {
    damage: number
    isCritical: boolean
    isEvaded: boolean
    elementalBonus?: number
  } {
    // 회피 체크
    if (Math.random() < defender.stats.evasion) {
      return { damage: 0, isCritical: false, isEvaded: true }
    }
    
    // 기본 데미지 계산
    const attackStat = skill.damageType === 'physical' 
      ? attacker.stats.attack 
      : attacker.stats.magicAttack
    const defenseStat = skill.damageType === 'physical'
      ? defender.stats.defense
      : defender.stats.magicDefense
    
    const baseDamage = (attackStat * (skill.power || 100) / 100) - (defenseStat / 2)
    
    // 속성 보정
    let elementalBonus = 1
    if (skill.element && skill.element !== 'neutral') {
      if (defender.weaknesses?.includes(skill.element)) {
        elementalBonus = 1.5
      } else if (defender.resistances?.includes(skill.element)) {
        elementalBonus = 0.5
      }
    }
    
    // 크리티컬 체크
    const isCritical = Math.random() < attacker.stats.critical
    const criticalMultiplier = isCritical ? attacker.stats.criticalDamage : 1
    
    // 랜덤 변동
    const variance = 0.9 + Math.random() * 0.2
    
    // 콤보 보너스
    const comboBonus = 1 + (this.comboCounter.get(attacker.id) || 0) * 0.1
    
    const finalDamage = Math.floor(
      Math.max(1, baseDamage * elementalBonus * criticalMultiplier * variance * comboBonus)
    )
    
    return {
      damage: finalDamage,
      isCritical,
      isEvaded: false,
      elementalBonus: elementalBonus !== 1 ? elementalBonus : undefined
    }
  }

  // 상태 이상 효과 적용
  private applyStatusEffect(target: MutableDeep<BattleCharacter>, effect: StatusEffect) {
    const existingIndex = target.statusEffects.findIndex(e => e.id === effect.id)
    
    if (existingIndex !== -1 && !effect.stackable) {
      // 스택 불가능한 경우 지속시간만 갱신
      target.statusEffects[existingIndex] = {
        ...target.statusEffects[existingIndex],
        duration: effect.duration
      }
    } else {
      target.statusEffects.push({ ...effect })
    }
  }

  // 상태 이상 효과에 의한 스탯 변화 적용
  private applyStatusEffects() {
    [this.state.player, this.state.enemy].forEach(character => {
      character.statusEffects.forEach(effect => {
        if (effect.damagePerTurn) {
          character.stats.hp = Math.max(0, character.stats.hp - effect.damagePerTurn)
        }
      })
    })
  }

  // 효과적인 속도 계산 (버프/디버프 포함)
  private getEffectiveSpeed(character: MutableDeep<BattleCharacter>): number {
    let speed = character.stats.speed
    
    character.statusEffects.forEach(effect => {
      if (effect.stats?.speed) {
        speed += effect.stats.speed
      }
    })
    
    return Math.max(1, speed)
  }

  // 쿨다운 업데이트
  private updateCooldowns() {
    [this.state.player, this.state.enemy].forEach(character => {
      character.skills = character.skills.map(skill => {
        if (skill.currentCooldown > 0) {
          return {
            ...skill,
            currentCooldown: skill.currentCooldown - 1
          }
        }
        return skill
      })
    })
  }

  // 상태 이상 효과 지속시간 업데이트
  private updateStatusEffects() {
    [this.state.player, this.state.enemy].forEach(character => {
      character.statusEffects = character.statusEffects.map(effect => ({
        ...effect,
        duration: effect.duration - 1
      })).filter(effect => effect.duration > 0)
    })
  }

  // 전투 종료 확인
  private isBattleOver(): boolean {
    return this.state.player.stats.hp <= 0 || this.state.enemy.stats.hp <= 0
  }

  // 승자 확인
  private getWinner(): 'player' | 'enemy' | null {
    if (!this.isBattleOver()) return null
    return this.state.player.stats.hp > 0 ? 'player' : 'enemy'
  }

  // 경험치 계산
  private calculateExperience(): number {
    const enemyLevel = this.state.enemy.stats.level
    const baseExp = 50 + enemyLevel * 10
    const turnBonus = Math.max(0, 20 - this.state.turn) * 2
    const comboBonus = Math.max(...Array.from(this.comboCounter.values())) * 5
    
    return baseExp + turnBonus + comboBonus
  }

  // 보상 계산
  private calculateRewards(): BattleResult['rewards'] {
    const enemyLevel = this.state.enemy.stats.level
    const baseGold = 20 + enemyLevel * 5
    const randomBonus = Math.floor(Math.random() * 10)
    
    return {
      gold: baseGold + randomBonus,
      items: Math.random() < 0.3 ? ['potion_small'] : []
    }
  }

  // 상태 업데이트
  private updateState() {
    if (this.onStateChangeCallback) {
      // Convert to readonly BattleState
      const stateSnapshot = JSON.parse(JSON.stringify(this.state))
      stateSnapshot.timestamp = new Date(stateSnapshot.timestamp)
      stateSnapshot.actions = stateSnapshot.actions.map((a: { timestamp: string | Date }) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      }))
      this.onStateChangeCallback(stateSnapshot as BattleState)
    }
  }

  // 딜레이
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms / this.battleSpeed))
  }

  // 전투 중단
  stopBattle() {
    this.state.phase = 'interrupted'
    this.updateState()
  }

  // 현재 상태 가져오기
  getState(): BattleState {
    return JSON.parse(JSON.stringify(this.state)) as BattleState
  }
}