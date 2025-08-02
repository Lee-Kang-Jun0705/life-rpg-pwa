/**
 * ATB (Active Time Battle) 전투 서비스
 * 포켓몬 스타일의 속도 기반 실시간 자동 전투 시스템
 */

import type {
  ATBCombatState,
  ATBCombatant,
  ATBGauge,
  CombatAction,
  ActionResult,
  CombatSkill,
  CombatItem,
  StatusEffect,
  Buff,
  StatusEffectType,
  BuffType,
  ATBCombatEvent,
  BattleSpeedConfig
} from '@/lib/types/atb-combat'
import type { Character } from '@/lib/types/game-core'
import type { Monster } from '@/lib/types/monster'
import type { GeneratedItem } from '@/lib/types/item-system'
import { ATB_CONSTANTS, BATTLE_SPEED_CONFIGS } from '@/lib/types/atb-combat'
import { itemGenerationService } from './item-generation.service'
import { soundService } from './sound.service'
import { EventEmitter } from 'events'
import { IdGenerators } from '@/lib/utils/id-generator'

export class ATBCombatService extends EventEmitter {
  private static instance: ATBCombatService
  private combatStates: Map<string, ATBCombatState> = new Map()
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map()
  private actionQueues: Map<string, CombatAction[]> = new Map()

  static getInstance(): ATBCombatService {
    if (!this.instance) {
      this.instance = new ATBCombatService()
    }
    return this.instance
  }

  /**
   * 전투 시작
   */
  startCombat(
    player: Character,
    monsters: Monster[],
    battleSpeed: keyof typeof BATTLE_SPEED_CONFIGS = 'normal'
  ): string {
    const combatId = this.generateCombatId()
    const speedConfig = BATTLE_SPEED_CONFIGS[battleSpeed]

    // 플레이어 전투원 생성
    const playerCombatant = this.createPlayerCombatant(player)

    // 몬스터 전투원 생성
    const enemyCombatants = monsters.map((monster, index) =>
      this.createMonsterCombatant(monster, index)
    )

    // 전투 상태 초기화
    const combatState: ATBCombatState = {
      id: combatId,
      status: 'preparing',
      combatants: [playerCombatant, ...enemyCombatants],
      settings: {
        battleSpeed: speedConfig.speed,
        autoUseItems: true,
        autoUseSkills: true,
        targetPriority: 'lowest_hp'
      },
      turnCount: 0,
      actionHistory: [],
      statistics: {
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalHealing: 0,
        skillsUsed: 0,
        itemsUsed: 0,
        criticalHits: 0,
        dodges: 0,
        statusInflicted: {} as Record<StatusEffectType, number>
      },
      startTime: Date.now()
    }

    this.combatStates.set(combatId, combatState)
    this.actionQueues.set(combatId, [])

    // 3초 후 전투 시작
    setTimeout(() => {
      this.startBattle(combatId)
    }, 3000)

    return combatId
  }

  /**
   * 플레이어 전투원 생성
   */
  private createPlayerCombatant(player: Character): ATBCombatant {
    return {
      id: `player_${player.id}`,
      name: player.name,
      team: 'player',
      stats: {
        maxHp: player.combatStats.hp,
        currentHp: player.combatStats.hp,
        maxMp: player.combatStats.mp,
        currentMp: player.combatStats.mp,
        attack: player.combatStats.attack,
        defense: player.combatStats.defense,
        speed: player.combatStats.speed,
        critRate: player.combatStats.critRate,
        critDamage: player.combatStats.critDamage,
        dodge: player.combatStats.dodge,
        accuracy: player.combatStats.accuracy
      },
      atb: {
        current: 0,
        speed: this.calculateATBSpeed(player.combatStats.speed),
        paused: false,
        boost: 1.0
      },
      statusEffects: [],
      buffs: [],
      skills: this.getPlayerSkills(player),
      availableItems: this.getPlayerItems()
    }
  }

  /**
   * 몬스터 전투원 생성
   */
  private createMonsterCombatant(monster: Monster, index: number): ATBCombatant {
    return {
      id: `enemy_${monster.id}_${index}`,
      name: monster.name,
      team: 'enemy',
      stats: {
        maxHp: monster.stats.hp,
        currentHp: monster.stats.hp,
        maxMp: 100,
        currentMp: 100,
        attack: monster.stats.attack,
        defense: monster.stats.defense,
        speed: monster.stats.speed,
        critRate: monster.stats.critRate || 0.1,
        critDamage: monster.stats.critDamage || 1.5,
        dodge: 0.05,
        accuracy: 0.9
      },
      atb: {
        current: Math.random() * 30, // 랜덤 시작 위치
        speed: this.calculateATBSpeed(monster.stats.speed),
        paused: false,
        boost: 1.0
      },
      statusEffects: [],
      buffs: [],
      skills: this.getMonsterSkills(monster),
      ai: {
        pattern: 'aggressive',
        targetPriority: 'lowest_hp',
        skillUsageRate: 0.3
      }
    }
  }

  /**
   * ATB 속도 계산
   */
  private calculateATBSpeed(speed: number): number {
    const baseSpeed = ATB_CONSTANTS.BASE_CHARGE_RATE
    const speedBonus = speed * ATB_CONSTANTS.SPEED_TO_CHARGE_RATIO
    const totalSpeed = baseSpeed + speedBonus

    return Math.max(
      ATB_CONSTANTS.MIN_CHARGE_RATE,
      Math.min(ATB_CONSTANTS.MAX_CHARGE_RATE, totalSpeed)
    )
  }

  /**
   * 전투 시작
   */
  private startBattle(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    state.status = 'active'

    // ATB 게이지 업데이트 시작
    const updateInterval = setInterval(() => {
      this.updateATBGauges(combatId)
    }, ATB_CONSTANTS.UPDATE_INTERVAL)

    this.updateIntervals.set(combatId, updateInterval)

    this.emit('battle_start', { combatId })
  }

  /**
   * ATB 게이지 업데이트
   */
  private updateATBGauges(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state || state.status !== 'active') {
      return
    }

    const speedMultiplier = state.settings.battleSpeed

    for (const combatant of state.combatants) {
      // 사망하거나 행동 불가 상태면 스킵
      if (combatant.stats.currentHp <= 0 || combatant.atb.paused) {
        continue
      }

      // 상태이상 체크
      if (this.isIncapacitated(combatant)) {
        continue
      }

      // ATB 게이지 충전
      const chargeAmount = combatant.atb.speed * combatant.atb.boost * speedMultiplier
      combatant.atb.current = Math.min(ATB_CONSTANTS.MAX_GAUGE, combatant.atb.current + chargeAmount)

      // 게이지가 가득 차면 행동
      if (combatant.atb.current >= ATB_CONSTANTS.MAX_GAUGE) {
        this.executeAction(combatId, combatant.id)
      }
    }

    // 상태이상 틱
    this.processStatusEffects(combatId)
  }

  /**
   * 행동 실행
   */
  private async executeAction(combatId: string, combatantId: string): Promise<void> {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    const combatant = state.combatants.find(c => c.id === combatantId)
    if (!combatant || combatant.stats.currentHp <= 0) {
      return
    }

    // ATB 게이지 리셋
    combatant.atb.current = 0

    // 행동 결정
    const action = this.decideAction(state, combatant)
    if (!action) {
      return
    }

    // 행동 실행
    await this.performAction(state, combatant, action)

    // 턴 카운트 증가
    state.turnCount++

    // 전투 종료 체크
    this.checkBattleEnd(combatId)
  }

  /**
   * 행동 결정 (자동 전투)
   */
  private decideAction(state: ATBCombatState, combatant: ATBCombatant): CombatAction | null {
    // 혼란 상태 체크
    if (this.hasStatusEffect(combatant, 'confusion') && Math.random() < ATB_CONSTANTS.STATUS_CHANCE.confusion) {
      return this.createConfusedAction(combatant)
    }

    // 플레이어 행동 결정
    if (combatant.team === 'player') {
      return this.decidePlayerAction(state, combatant)
    }

    // 몬스터 행동 결정
    return this.decideMonsterAction(state, combatant)
  }

  /**
   * 플레이어 자동 행동 결정
   */
  private decidePlayerAction(state: ATBCombatState, combatant: ATBCombatant): CombatAction | null {
    // HP가 낮으면 포션 사용
    const hpPercent = combatant.stats.currentHp / combatant.stats.maxHp
    if (hpPercent < ATB_CONSTANTS.AUTO_BATTLE.itemUseHpThreshold && state.settings.autoUseItems) {
      const potion = combatant.availableItems?.find(item =>
        item.effect.type === 'heal' && item.quantity > 0
      )
      if (potion) {
        return this.createItemAction(combatant, potion, combatant.id)
      }
    }

    // 스킬 사용 결정
    const mpPercent = combatant.stats.currentMp / combatant.stats.maxMp
    if (mpPercent > ATB_CONSTANTS.AUTO_BATTLE.skillUseThreshold && state.settings.autoUseSkills) {
      const skill = this.selectBestSkill(combatant, state)
      if (skill && combatant.stats.currentMp >= skill.mpCost) {
        const target = this.selectTarget(state, combatant, skill.targetType, skill.targetTeam)
        if (target) {
          return this.createSkillAction(combatant, skill, target)
        }
      }
    }

    // 기본 공격
    const target = this.selectTarget(state, combatant, 'single', 'enemy')
    if (target) {
      return this.createAttackAction(combatant, target)
    }

    return null
  }

  /**
   * 몬스터 자동 행동 결정
   */
  private decideMonsterAction(state: ATBCombatState, combatant: ATBCombatant): CombatAction | null {
    const ai = combatant.ai!

    // 스킬 사용 결정
    if (Math.random() < ai.skillUsageRate && combatant.skills.length > 0) {
      const skill = combatant.skills[Math.floor(Math.random() * combatant.skills.length)]
      if (combatant.stats.currentMp >= skill.mpCost) {
        const target = this.selectTarget(state, combatant, skill.targetType, skill.targetTeam)
        if (target) {
          return this.createSkillAction(combatant, skill, target)
        }
      }
    }

    // 기본 공격
    const target = this.selectTarget(state, combatant, 'single', 'enemy')
    if (target) {
      return this.createAttackAction(combatant, target)
    }

    return null
  }

  /**
   * 행동 실행
   */
  private async performAction(state: ATBCombatState, actor: ATBCombatant, action: CombatAction): Promise<void> {
    // 행동 기록
    state.actionHistory.push(action)

    // 결과 적용
    for (const result of action.results) {
      const target = state.combatants.find(c => c.id === result.targetId)
      if (!target) {
        continue
      }

      // 데미지 적용
      if (result.damage) {
        target.stats.currentHp = Math.max(0, target.stats.currentHp - result.damage)

        if (actor.team === 'player') {
          state.statistics.totalDamageDealt += result.damage
        } else {
          state.statistics.totalDamageTaken += result.damage
        }

        if (result.critical) {
          state.statistics.criticalHits++
        }
      }

      // 회복 적용
      if (result.healing) {
        target.stats.currentHp = Math.min(target.stats.maxHp, target.stats.currentHp + result.healing)
        state.statistics.totalHealing += result.healing
      }

      // 상태이상 적용
      if (result.statusApplied) {
        for (const status of result.statusApplied) {
          this.applyStatusEffect(target, status, actor.id)
          state.statistics.statusInflicted[status] = (state.statistics.statusInflicted[status] || 0) + 1
        }
      }

      // 버프 적용
      if (result.buffsApplied) {
        for (const buff of result.buffsApplied) {
          this.applyBuff(target, buff, 3, actor.id)
        }
      }

      // 처치 체크
      if (target.stats.currentHp <= 0 && !result.defeated) {
        result.defeated = true
        this.emit('combatant_defeated', { combatId: state.id, combatantId: target.id })
      }
    }

    // 스킬/아이템 사용 통계
    if (action.type === 'skill') {
      state.statistics.skillsUsed++
    } else if (action.type === 'item') {
      state.statistics.itemsUsed++
    }

    // 애니메이션 이벤트
    this.emit('action_performed', { combatId: state.id, action })
  }

  /**
   * 타겟 선택
   */
  private selectTarget(
    state: ATBCombatState,
    actor: ATBCombatant,
    targetType: string,
    targetTeam: string
  ): string[] {
    const validTargets = state.combatants.filter(c => {
      if (c.stats.currentHp <= 0) {
        return false
      }

      const sameTeam = c.team === actor.team
      if (targetTeam === 'enemy' && sameTeam) {
        return false
      }
      if (targetTeam === 'ally' && !sameTeam) {
        return false
      }

      return true
    })

    if (validTargets.length === 0) {
      return []
    }

    // 타겟 타입별 처리
    switch (targetType) {
      case 'all':
        return validTargets.map(t => t.id)

      case 'self':
        return [actor.id]

      case 'random':
        const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)]
        return [randomTarget.id]

      case 'single':
      default:
        // 우선순위에 따른 타겟 선택
        const target = this.selectPriorityTarget(validTargets, state.settings.targetPriority)
        return target ? [target.id] : []
    }
  }

  /**
   * 우선순위 타겟 선택
   */
  private selectPriorityTarget(targets: ATBCombatant[], priority: string): ATBCombatant | null {
    if (targets.length === 0) {
      return null
    }

    switch (priority) {
      case 'lowest_hp':
        return targets.reduce((lowest, current) =>
          current.stats.currentHp < lowest.stats.currentHp ? current : lowest
        )

      case 'nearest_death':
        return targets.reduce((nearest, current) => {
          const currentPercent = current.stats.currentHp / current.stats.maxHp
          const nearestPercent = nearest.stats.currentHp / nearest.stats.maxHp
          return currentPercent < nearestPercent ? current : nearest
        })

      case 'highest_threat':
      default:
        // 공격력이 가장 높은 적
        return targets.reduce((highest, current) =>
          current.stats.attack > highest.stats.attack ? current : highest
        )
    }
  }

  /**
   * 기본 공격 행동 생성
   */
  private createAttackAction(actor: ATBCombatant, targets: string[]): CombatAction {
    const results: ActionResult[] = []

    for (const targetId of targets) {
      const target = this.getCombatant(actor.id.split('_')[1], targetId)
      if (!target) {
        continue
      }

      const result = this.calculateDamage(actor, target)
      results.push(result)
    }

    return {
      timestamp: Date.now(),
      actorId: actor.id,
      type: 'attack',
      targets,
      results,
      animation: {
        actor: 'attack',
        targets: Object.fromEntries(targets.map(t => [t, 'hit'])),
        duration: 500
      }
    }
  }

  /**
   * 스킬 행동 생성
   */
  private createSkillAction(actor: ATBCombatant, skill: CombatSkill, targets: string[]): CombatAction {
    const results: ActionResult[] = []

    // MP 소비
    actor.stats.currentMp -= skill.mpCost

    for (const targetId of targets) {
      const target = this.getCombatant(actor.id.split('_')[1], targetId)
      if (!target) {
        continue
      }

      const result: ActionResult = { targetId }

      // 스킬 타입별 처리
      switch (skill.type) {
        case 'attack':
          const damage = this.calculateSkillDamage(actor, target, skill)
          Object.assign(result, damage)
          // 스킬 타입별 효과음
          if (skill.element === 'fire') {
            soundService.playEffect('fire_cast')
          } else if (skill.element === 'ice') {
            soundService.playEffect('ice_cast')
          }
          break

        case 'heal':
          result.healing = Math.floor(actor.stats.attack * (skill.power || 1))
          soundService.playEffect('heal_cast') // 회복 효과음
          break

        case 'buff':
        case 'debuff':
          result.buffsApplied = skill.effects?.map(e => e.buff!).filter(Boolean) || []
          soundService.playEffect('buff') // 버프 효과음
          break
      }

      // 추가 효과
      if (skill.effects) {
        for (const effect of skill.effects) {
          if (Math.random() < effect.chance) {
            if (effect.status) {
              result.statusApplied = result.statusApplied || []
              result.statusApplied.push(effect.status)
            }
          }
        }
      }

      results.push(result)
    }

    return {
      timestamp: Date.now(),
      actorId: actor.id,
      type: 'skill',
      action: {
        id: skill.id,
        name: skill.name
      },
      targets,
      results,
      animation: {
        actor: skill.animation || 'skill_cast',
        targets: Object.fromEntries(targets.map(t => [t, 'skill_hit'])),
        duration: skill.effectDuration || 1000
      }
    }
  }

  /**
   * 아이템 행동 생성
   */
  private createItemAction(actor: ATBCombatant, item: CombatItem, targetId: string): CombatAction {
    const result: ActionResult = { targetId }

    // 아이템 소비
    item.quantity--

    // 효과 적용
    switch (item.effect.type) {
      case 'heal':
        result.healing = item.effect.value || 0
        soundService.playEffect('heal_cast') // 회복 아이템 효과음
        break

      case 'cure':
        result.statusRemoved = item.effect.status || []
        break

      case 'buff':
        if (item.effect.buff) {
          result.buffsApplied = [item.effect.buff]
        }
        break
    }

    return {
      timestamp: Date.now(),
      actorId: actor.id,
      type: 'item',
      action: {
        id: item.id,
        name: item.name
      },
      targets: [targetId],
      results: [result],
      animation: {
        actor: 'item_use',
        targets: { [targetId]: 'item_effect' },
        duration: 500
      }
    }
  }

  /**
   * 데미지 계산
   */
  private calculateDamage(attacker: ATBCombatant, defender: ATBCombatant): ActionResult {
    const result: ActionResult = { targetId: defender.id }

    // 명중 체크
    const hitChance = attacker.stats.accuracy * (1 - defender.stats.dodge)
    if (Math.random() > hitChance) {
      result.dodged = true
      soundService.playEffect('miss') // 회피 효과음
      return result
    }

    // 기본 데미지
    let damage = attacker.stats.attack * (100 / (100 + defender.stats.defense))

    // 치명타 체크
    if (Math.random() < attacker.stats.critRate) {
      damage *= attacker.stats.critDamage
      result.critical = true
      soundService.playEffect('critical_hit') // 치명타 효과음
    } else {
      soundService.playEffect('sword_hit') // 일반 공격 효과음
    }

    // 버프/디버프 적용
    damage = this.applyBuffsToValue(damage, attacker, 'attack')
    damage = damage / this.applyBuffsToValue(1, defender, 'defense')

    // 랜덤 편차 (±10%)
    damage *= (0.9 + Math.random() * 0.2)

    result.damage = Math.floor(damage)
    return result
  }

  /**
   * 스킬 데미지 계산
   */
  private calculateSkillDamage(attacker: ATBCombatant, defender: ATBCombatant, skill: CombatSkill): ActionResult {
    const baseResult = this.calculateDamage(attacker, defender)

    if (baseResult.damage) {
      baseResult.damage = Math.floor(baseResult.damage * (skill.power || 1))

      if (skill.critBonus && baseResult.critical) {
        baseResult.damage = Math.floor(baseResult.damage * (1 + skill.critBonus))
      }
    }

    return baseResult
  }

  /**
   * 상태이상 적용
   */
  private applyStatusEffect(target: ATBCombatant, type: StatusEffectType, source?: string): void {
    // 이미 같은 상태이상이 있으면 갱신
    const existing = target.statusEffects.find(s => s.type === type)
    if (existing) {
      existing.duration = this.getStatusDuration(type)
      return
    }

    const effect: StatusEffect = {
      type,
      duration: this.getStatusDuration(type),
      source
    }

    // 타입별 추가 설정
    switch (type) {
      case 'poison':
        effect.damage = Math.floor(target.stats.maxHp * ATB_CONSTANTS.STATUS_DAMAGE.poison)
        break
      case 'burn':
        effect.damage = Math.floor(target.stats.maxHp * ATB_CONSTANTS.STATUS_DAMAGE.burn)
        break
      case 'paralyze':
      case 'confusion':
        effect.chance = ATB_CONSTANTS.STATUS_CHANCE[type]
        break
    }

    target.statusEffects.push(effect)
  }

  /**
   * 버프 적용
   */
  private applyBuff(target: ATBCombatant, type: BuffType, duration: number, source?: string): void {
    const existing = target.buffs.find(b => b.type === type)
    if (existing) {
      existing.duration = Math.max(existing.duration, duration)
      return
    }

    target.buffs.push({
      type,
      value: this.getBuffValue(type),
      duration,
      source
    })
  }

  /**
   * 상태이상 처리
   */
  private processStatusEffects(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    for (const combatant of state.combatants) {
      if (combatant.stats.currentHp <= 0) {
        continue
      }

      // 상태이상 틱
      for (let i = combatant.statusEffects.length - 1; i >= 0; i--) {
        const effect = combatant.statusEffects[i]

        // 데미지 상태이상
        if (effect.damage && (effect.type === 'poison' || effect.type === 'burn')) {
          const action: CombatAction = {
            timestamp: Date.now(),
            actorId: effect.source || 'status',
            type: 'status_damage',
            targets: [combatant.id],
            results: [{
              targetId: combatant.id,
              damage: effect.damage
            }]
          }

          combatant.stats.currentHp = Math.max(0, combatant.stats.currentHp - effect.damage)
          state.actionHistory.push(action)

          if (combatant.team === 'enemy') {
            state.statistics.totalDamageDealt += effect.damage
          } else {
            state.statistics.totalDamageTaken += effect.damage
          }
        }

        // 지속시간 감소
        if (effect.duration > 0) {
          effect.duration--
          if (effect.duration === 0) {
            combatant.statusEffects.splice(i, 1)
          }
        }
      }

      // 버프 지속시간 감소
      for (let i = combatant.buffs.length - 1; i >= 0; i--) {
        const buff = combatant.buffs[i]
        buff.duration--
        if (buff.duration <= 0) {
          combatant.buffs.splice(i, 1)
        }
      }
    }
  }

  /**
   * 전투 종료 체크
   */
  private checkBattleEnd(combatId: string): void {
    const state = this.combatStates.get(combatId)
    if (!state || state.status !== 'active') {
      return
    }

    const aliveAllies = state.combatants.filter(c => c.team === 'player' && c.stats.currentHp > 0)
    const aliveEnemies = state.combatants.filter(c => c.team === 'enemy' && c.stats.currentHp > 0)

    if (aliveAllies.length === 0) {
      this.endBattle(combatId, 'defeat')
    } else if (aliveEnemies.length === 0) {
      this.endBattle(combatId, 'victory')
    }
  }

  /**
   * 전투 종료
   */
  private endBattle(combatId: string, result: 'victory' | 'defeat'): void {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    state.status = result
    state.endTime = Date.now()

    // 업데이트 중지
    const interval = this.updateIntervals.get(combatId)
    if (interval) {
      clearInterval(interval)
      this.updateIntervals.delete(combatId)
    }

    // 승리 시 보상 계산
    if (result === 'victory') {
      state.rewards = this.calculateRewards(state)
    }

    this.emit('battle_end', { combatId, result, state })
  }

  /**
   * 보상 계산
   */
  private calculateRewards(state: ATBCombatState): { gold: number; items: GeneratedItem[] } {
    let totalGold = 0
    const items: GeneratedItem[] = []

    // 처치한 몬스터별 보상
    const defeatedEnemies = state.combatants.filter(c =>
      c.team === 'enemy' && c.stats.currentHp <= 0
    )

    for (const enemy of defeatedEnemies) {
      // 골드 보상 (레벨 기반)
      const level = parseInt(enemy.id.split('_')[2]) || 10
      totalGold += Math.floor((50 + level * 20) * (1 + Math.random() * 0.5))

      // 아이템 드롭
      const dropItem = itemGenerationService.generateDropItem(level, 'common')
      if (dropItem) {
        items.push(dropItem)
      }
    }

    // 빠른 클리어 보너스
    const battleTime = (state.endTime || Date.now()) - state.startTime
    if (battleTime < 60000) { // 1분 이내
      totalGold = Math.floor(totalGold * 1.5)
    }

    return { gold: totalGold, items }
  }

  /**
   * 헬퍼 메서드들
   */
  private getCombatant(combatId: string, combatantId: string): ATBCombatant | null {
    const state = this.combatStates.get(combatId)
    return state?.combatants.find(c => c.id === combatantId) || null
  }

  private hasStatusEffect(combatant: ATBCombatant, type: StatusEffectType): boolean {
    return combatant.statusEffects.some(e => e.type === type)
  }

  private isIncapacitated(combatant: ATBCombatant): boolean {
    if (this.hasStatusEffect(combatant, 'freeze')) {
      return true
    }
    if (this.hasStatusEffect(combatant, 'sleep')) {
      return true
    }
    if (this.hasStatusEffect(combatant, 'paralyze')) {
      return Math.random() < ATB_CONSTANTS.STATUS_CHANCE.paralyze
    }
    return false
  }

  private createConfusedAction(actor: ATBCombatant): CombatAction {
    return {
      timestamp: Date.now(),
      actorId: actor.id,
      type: 'attack',
      targets: [actor.id], // 자기 자신 공격
      results: [{
        targetId: actor.id,
        damage: Math.floor(actor.stats.attack * 0.5) // 50% 데미지
      }],
      animation: {
        actor: 'confused',
        targets: { [actor.id]: 'self_hit' },
        duration: 500
      }
    }
  }

  private selectBestSkill(combatant: ATBCombatant, state: ATBCombatState): CombatSkill | null {
    // HP가 낮으면 회복 스킬
    const hpPercent = combatant.stats.currentHp / combatant.stats.maxHp
    if (hpPercent < 0.5) {
      const healSkill = combatant.skills.find(s => s.type === 'heal')
      if (healSkill) {
        return healSkill
      }
    }

    // 공격 스킬 중 가장 강력한 것
    const attackSkills = combatant.skills.filter(s => s.type === 'attack')
    return attackSkills.reduce((best, current) =>
      (current.power || 1) > (best?.power || 1) ? current : best
    , attackSkills[0])
  }

  private applyBuffsToValue(baseValue: number, combatant: ATBCombatant, statType: string): number {
    let value = baseValue

    for (const buff of combatant.buffs) {
      if (buff.type.startsWith(statType)) {
        if (buff.type.endsWith('_up')) {
          value *= (1 + buff.value)
        } else if (buff.type.endsWith('_down')) {
          value *= (1 - buff.value)
        }
      }
    }

    return value
  }

  private getStatusDuration(type: StatusEffectType): number {
    const durations = {
      poison: 5,
      burn: 3,
      freeze: 2,
      paralyze: 3,
      sleep: 2,
      confusion: 3,
      blind: 3,
      silence: 3
    }
    return durations[type] || 3
  }

  private getBuffValue(type: BuffType): number {
    const values = {
      attack_up: 0.25,
      attack_down: 0.25,
      defense_up: 0.25,
      defense_down: 0.25,
      speed_up: 0.3,
      speed_down: 0.3,
      crit_up: 0.2,
      crit_down: 0.2,
      dodge_up: 0.15,
      dodge_down: 0.15,
      shield: 0.3,
      regen: 0.1,
      atb_boost: 0.5
    }
    return values[type] || 0.2
  }

  private getPlayerSkills(player: Character): CombatSkill[] {
    // TODO: 실제 플레이어 스킬 가져오기
    return [
      {
        id: 'basic_attack',
        name: '기본 공격',
        type: 'attack',
        mpCost: 0,
        power: 1,
        accuracy: 1,
        targetType: 'single',
        targetTeam: 'enemy'
      },
      {
        id: 'power_strike',
        name: '파워 스트라이크',
        type: 'attack',
        mpCost: 10,
        power: 1.5,
        critBonus: 0.2,
        targetType: 'single',
        targetTeam: 'enemy'
      },
      {
        id: 'heal',
        name: '힐',
        type: 'heal',
        mpCost: 15,
        power: 1.2,
        targetType: 'self',
        targetTeam: 'ally'
      }
    ]
  }

  private getMonsterSkills(monster: Monster): CombatSkill[] {
    // TODO: 실제 몬스터 스킬 가져오기
    return [
      {
        id: 'monster_attack',
        name: '몬스터 공격',
        type: 'attack',
        mpCost: 0,
        power: 1,
        targetType: 'single',
        targetTeam: 'enemy'
      }
    ]
  }

  private getPlayerItems(): CombatItem[] {
    // TODO: 실제 인벤토리에서 가져오기
    return [
      {
        id: 'health_potion',
        name: '체력 포션',
        icon: '🧪',
        quantity: 5,
        effect: {
          type: 'heal',
          value: 50,
          target: 'single',
          targetTeam: 'ally'
        }
      },
      {
        id: 'mana_potion',
        name: '마나 포션',
        icon: '💙',
        quantity: 3,
        effect: {
          type: 'heal',
          value: 30,
          target: 'single',
          targetTeam: 'ally'
        }
      }
    ]
  }

  private generateCombatId(): string {
    return IdGenerators.combat()
  }

  /**
   * 전투 상태 가져오기
   */
  getCombatState(combatId: string): ATBCombatState | null {
    return this.combatStates.get(combatId) || null
  }

  /**
   * 전투 속도 변경
   */
  changeBattleSpeed(combatId: string, speed: keyof typeof BATTLE_SPEED_CONFIGS): void {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    const speedConfig = BATTLE_SPEED_CONFIGS[speed]
    state.settings.battleSpeed = speedConfig.speed
  }

  /**
   * 자동 설정 변경
   */
  updateAutoSettings(combatId: string, settings: Partial<ATBCombatState['settings']>): void {
    const state = this.combatStates.get(combatId)
    if (!state) {
      return
    }

    Object.assign(state.settings, settings)
  }
}

// 싱글톤 인스턴스
export const atbCombatService = ATBCombatService.getInstance()
