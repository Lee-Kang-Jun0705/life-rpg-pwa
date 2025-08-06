// JRPG 전투 계산 시스템
import type { BaseStats, SkillElement, BattleUnit } from './types'
import { StatusEffectType } from './types'
import { SKILL_DATABASE } from './skills-database'

// 원소 상성 테이블
const ELEMENT_EFFECTIVENESS: Record<SkillElement, Partial<Record<SkillElement, number>>> = {
  physical: {},
  fire: { ice: 1.5, nature: 1.5, water: 0.5 },
  ice: { fire: 0.5, nature: 1.5, thunder: 0.5 },
  thunder: { water: 1.5, earth: 1.5, ice: 0.5 },
  nature: { water: 1.5, earth: 0.5, fire: 0.5 },
  light: { dark: 1.5 },
  dark: { light: 1.5 },
  arcane: {} // 아케인은 상성 없음
}

// 데미지 계산
export function calculateDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  skillId: string,
  skillLevel: number
): {
  damage: number
  isCritical: boolean
  elementMultiplier: number
} {
  const skill = SKILL_DATABASE[skillId]
  if (!skill) return { damage: 0, isCritical: false, elementMultiplier: 1 }

  let baseDamage = 0
  let attackStat = 0
  let defenseStat = 0

  // 물리/마법 구분
  if (skill.element === 'physical') {
    baseDamage = (skill.baseDamage || 0) + (skill.damagePerLevel || 0) * (skillLevel - 1)
    attackStat = attacker.stats.attack || 0
    defenseStat = defender.stats.defense || 0
  } else {
    baseDamage = (skill.baseDamage || 0) + (skill.damagePerLevel || 0) * (skillLevel - 1)
    attackStat = attacker.stats.magicPower || 0
    defenseStat = defender.stats.magicResist || 0
  }

  // 기본 데미지 공식
  let damage = (baseDamage + attackStat * 2) * (100 / (100 + defenseStat))

  // 원소 상성
  const elementMultiplier = getElementMultiplier(skill.element, defender)
  damage *= elementMultiplier

  // 크리티컬 판정
  const critRate = (attacker.stats.criticalRate || 0) / 100
  const isCritical = Math.random() < critRate
  if (isCritical) {
    const critDamage = 1.5 + (attacker.stats.criticalDamage || 0) / 100
    damage *= critDamage
  }

  // 방어 관통
  const penetration = attacker.stats.penetration || 0
  const effectiveDefense = Math.max(0, defenseStat - penetration)
  damage *= (100 / (100 + effectiveDefense)) / (100 / (100 + defenseStat))

  // 랜덤 편차 (±10%)
  damage *= 0.9 + Math.random() * 0.2

  return {
    damage: Math.floor(damage),
    isCritical,
    elementMultiplier
  }
}

// 힐 계산
export function calculateHeal(
  healer: BattleUnit,
  skillId: string,
  skillLevel: number
): number {
  const skill = SKILL_DATABASE[skillId]
  if (!skill || !skill.baseHeal) return 0

  const baseHeal = skill.baseHeal + (skill.healPerLevel || 0) * (skillLevel - 1)
  const magicPower = healer.stats.magicPower || 0

  let heal = baseHeal + magicPower * 1.5

  // 랜덤 편차 (±5%)
  heal *= 0.95 + Math.random() * 0.1

  return Math.floor(heal)
}

// 원소 상성 계산
function getElementMultiplier(
  attackElement: SkillElement,
  defender: BattleUnit
): number {
  // 몬스터의 경우 약점/저항 체크
  const monsterData = (defender as any).monsterData
  if (monsterData) {
    if (monsterData.weaknesses?.includes(attackElement)) return 1.5
    if (monsterData.resistances?.includes(attackElement)) return 0.5
  }

  // 일반 원소 상성
  // TODO: 방어자의 원소 속성을 어떻게 결정할지 구현 필요
  return 1
}

// MP 소모 계산
export function calculateMpCost(
  skillId: string,
  skillLevel: number,
  unit: BattleUnit
): number {
  const skill = SKILL_DATABASE[skillId]
  if (!skill) return 0

  let mpCost = skill.baseMpCost - skill.mpReductionPerLevel * (skillLevel - 1)
  
  // 최소 MP 소모는 1
  mpCost = Math.max(1, mpCost)

  // 장비나 버프로 인한 MP 소모 감소 적용 가능
  // TODO: MP 소모 감소 효과 구현

  return Math.floor(mpCost)
}

// 쿨다운 계산
export function calculateCooldown(
  skillId: string,
  skillLevel: number,
  unit: BattleUnit
): number {
  const skill = SKILL_DATABASE[skillId]
  if (!skill) return 0

  let cooldown = skill.baseCooldown - skill.cooldownReduction * (skillLevel - 1)
  
  // 최소 쿨다운은 1턴
  cooldown = Math.max(1, cooldown)

  // 쿨다운 감소 효과 적용
  const cooldownReduction = (unit as any).cooldownReduction || 0
  cooldown *= (1 - cooldownReduction / 100)

  return Math.floor(cooldown)
}

// 상태이상 적용
export function applyStatusEffect(
  target: BattleUnit,
  effect: StatusEffectType,
  duration: number,
  source?: string,
  damagePerTurn?: number
): boolean {
  // 면역 체크
  const immunities = (target as any).monsterData?.immunities || []
  if (immunities.includes(effect)) return false

  // 기존 효과 확인
  const existingEffect = target.statusEffects.find(e => e.type === effect)
  
  if (existingEffect) {
    // 기존 효과 갱신
    existingEffect.duration = Math.max(existingEffect.duration, duration)
    if (damagePerTurn) {
      existingEffect.damagePerTurn = Math.max(existingEffect.damagePerTurn || 0, damagePerTurn)
    }
  } else {
    // 새 효과 추가
    target.statusEffects.push({
      type: effect,
      duration,
      source,
      damagePerTurn,
      stacks: 1
    })
  }

  return true
}

// 버프/디버프 계산
export function calculateBuffedStats(unit: BattleUnit): BaseStats {
  const buffedStats = { ...unit.stats }

  unit.statusEffects.forEach(effect => {
    switch (effect.type) {
      case StatusEffectType.BUFF_ATK:
        buffedStats.attack = (buffedStats.attack || 0) * 1.3
        break
      case StatusEffectType.BUFF_DEF:
        buffedStats.defense = (buffedStats.defense || 0) * 1.3
        break
      case StatusEffectType.DEBUFF_ATK:
        buffedStats.attack = (buffedStats.attack || 0) * 0.7
        break
      case StatusEffectType.DEBUFF_DEF:
        buffedStats.defense = (buffedStats.defense || 0) * 0.7
        break
    }

    // 상태이상 효과
    if (effect.type === StatusEffectType.FREEZE || effect.type === StatusEffectType.PARALYZE) {
      buffedStats.speed = 0
    }
  })

  return buffedStats
}

// 상태이상 턴 처리
export function processStatusEffects(unit: BattleUnit): {
  damage: number
  messages: string[]
} {
  let totalDamage = 0
  const messages: string[] = []

  unit.statusEffects = unit.statusEffects.filter(effect => {
    // 지속 데미지
    if (effect.damagePerTurn) {
      totalDamage += effect.damagePerTurn
      
      switch (effect.type) {
        case StatusEffectType.POISON:
          messages.push(`${unit.name}은(는) 독 데미지를 받았다!`)
          break
        case StatusEffectType.BURN:
          messages.push(`${unit.name}은(는) 화상 데미지를 받았다!`)
          break
        case StatusEffectType.BLEED:
          messages.push(`${unit.name}은(는) 출혈 데미지를 받았다!`)
          break
      }
    }

    // 지속시간 감소
    effect.duration--
    
    // 효과 종료
    if (effect.duration <= 0) {
      switch (effect.type) {
        case StatusEffectType.FREEZE:
          messages.push(`${unit.name}의 빙결이 풀렸다!`)
          break
        case StatusEffectType.STUN:
          messages.push(`${unit.name}의 기절이 풀렸다!`)
          break
        case StatusEffectType.PARALYZE:
          messages.push(`${unit.name}의 마비가 풀렸다!`)
          break
      }
      return false
    }
    
    return true
  })

  return { damage: totalDamage, messages }
}

// 행동 가능 여부 체크
export function canAct(unit: BattleUnit): boolean {
  return !unit.statusEffects.some(effect => 
    [StatusEffectType.FREEZE, StatusEffectType.STUN, StatusEffectType.PARALYZE].includes(effect.type)
  )
}

// 속도 기반 행동 순서 계산
export function calculateTurnOrder(units: BattleUnit[]): BattleUnit[] {
  return units
    .map(unit => ({
      unit,
      speed: calculateBuffedStats(unit).speed || 0
    }))
    .sort((a, b) => b.speed - a.speed)
    .map(item => item.unit)
}