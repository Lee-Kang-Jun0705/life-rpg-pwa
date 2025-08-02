// 상태이상 타입 정의
export type StatusEffectType = 
  // 디버프
  | 'poison'      // 중독 - 매 턴 데미지
  | 'burn'        // 화상 - 매 턴 데미지 + 공격력 감소
  | 'freeze'      // 빙결 - 행동 불가
  | 'paralysis'   // 마비 - 행동 실패 확률
  | 'silence'     // 침묵 - 스킬 사용 불가
  | 'blind'       // 실명 - 명중률 감소
  | 'confusion'   // 혼란 - 무작위 행동
  | 'sleep'       // 수면 - 행동 불가, 피격 시 해제
  | 'curse'       // 저주 - 모든 스탯 감소
  | 'fear'        // 공포 - 방어력 감소, 도망 확률 증가
  // 버프
  | 'attack_up'   // 공격력 증가
  | 'defense_up'  // 방어력 증가
  | 'speed_up'    // 속도 증가
  | 'regeneration' // 재생 - 매 턴 HP 회복
  | 'shield'      // 보호막 - 데미지 흡수
  | 'focus'       // 집중 - 치명타율 증가
  | 'berserk'     // 광폭화 - 공격력 증가, 방어력 감소
  | 'evasion'     // 회피 - 회피율 증가

// 상태이상 카테고리
export type StatusCategory = 'buff' | 'debuff'

// 상태이상 효과 인터페이스
export interface StatusEffect {
  id: string
  type: StatusEffectType
  category: StatusCategory
  name: string
  description: string
  icon: string
  duration: number // 남은 턴 수
  maxDuration: number // 최대 지속 시간
  stackable: boolean // 중첩 가능 여부
  currentStacks: number // 현재 중첩 수
  maxStacks: number // 최대 중첩 수
  
  // 효과 수치
  effectValue?: number // 기본 효과 값 (데미지, 회복량 등)
  effectPercentage?: number // 퍼센트 효과 (스탯 증감 등)
  
  // 특수 효과
  skipTurnChance?: number // 행동 불가 확률 (마비, 수면 등)
  
  // 적용/해제 시 효과
  onApply?: (target: any) => void
  onRemove?: (target: any) => void
  onTurnStart?: (target: any) => void
  onTurnEnd?: (target: any) => void
}

// 상태이상 정의
export const STATUS_EFFECT_DEFINITIONS: Record<StatusEffectType, Omit<StatusEffect, 'id' | 'duration'>> = {
  // 디버프
  poison: {
    type: 'poison',
    category: 'debuff',
    name: '중독',
    description: '매 턴 최대 HP의 5% 피해를 입습니다.',
    icon: '🤢',
    maxDuration: 5,
    stackable: true,
    currentStacks: 1,
    maxStacks: 3,
    effectPercentage: 5
  },
  
  burn: {
    type: 'burn',
    category: 'debuff',
    name: '화상',
    description: '매 턴 고정 피해를 입고 공격력이 10% 감소합니다.',
    icon: '🔥',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectValue: 10,
    effectPercentage: -10
  },
  
  freeze: {
    type: 'freeze',
    category: 'debuff',
    name: '빙결',
    description: '행동할 수 없습니다.',
    icon: '🧊',
    maxDuration: 2,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    skipTurnChance: 100
  },
  
  paralysis: {
    type: 'paralysis',
    category: 'debuff',
    name: '마비',
    description: '30% 확률로 행동에 실패합니다.',
    icon: '⚡',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    skipTurnChance: 30
  },
  
  silence: {
    type: 'silence',
    category: 'debuff',
    name: '침묵',
    description: '스킬을 사용할 수 없습니다.',
    icon: '🤐',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1
  },
  
  blind: {
    type: 'blind',
    category: 'debuff',
    name: '실명',
    description: '명중률이 50% 감소합니다.',
    icon: '🙈',
    maxDuration: 2,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: -50
  },
  
  confusion: {
    type: 'confusion',
    category: 'debuff',
    name: '혼란',
    description: '30% 확률로 자신을 공격합니다.',
    icon: '😵',
    maxDuration: 2,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    skipTurnChance: 30
  },
  
  sleep: {
    type: 'sleep',
    category: 'debuff',
    name: '수면',
    description: '행동할 수 없습니다. 피격 시 해제됩니다.',
    icon: '😴',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    skipTurnChance: 100
  },
  
  curse: {
    type: 'curse',
    category: 'debuff',
    name: '저주',
    description: '모든 스탯이 20% 감소합니다.',
    icon: '💀',
    maxDuration: 4,
    stackable: true,
    currentStacks: 1,
    maxStacks: 3,
    effectPercentage: -20
  },
  
  fear: {
    type: 'fear',
    category: 'debuff',
    name: '공포',
    description: '방어력이 30% 감소하고 도망칠 확률이 증가합니다.',
    icon: '😱',
    maxDuration: 2,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: -30
  },
  
  // 버프
  attack_up: {
    type: 'attack_up',
    category: 'buff',
    name: '공격력 증가',
    description: '공격력이 30% 증가합니다.',
    icon: '⚔️',
    maxDuration: 5,
    stackable: true,
    currentStacks: 1,
    maxStacks: 3,
    effectPercentage: 30
  },
  
  defense_up: {
    type: 'defense_up',
    category: 'buff',
    name: '방어력 증가',
    description: '방어력이 30% 증가합니다.',
    icon: '🛡️',
    maxDuration: 5,
    stackable: true,
    currentStacks: 1,
    maxStacks: 3,
    effectPercentage: 30
  },
  
  speed_up: {
    type: 'speed_up',
    category: 'buff',
    name: '속도 증가',
    description: '행동 속도가 증가합니다.',
    icon: '💨',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: 50
  },
  
  regeneration: {
    type: 'regeneration',
    category: 'buff',
    name: '재생',
    description: '매 턴 최대 HP의 10%를 회복합니다.',
    icon: '💚',
    maxDuration: 5,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: 10
  },
  
  shield: {
    type: 'shield',
    category: 'buff',
    name: '보호막',
    description: '다음 3회 공격을 막아냅니다.',
    icon: '🛡️',
    maxDuration: 5,
    stackable: false,
    currentStacks: 3,
    maxStacks: 3
  },
  
  focus: {
    type: 'focus',
    category: 'buff',
    name: '집중',
    description: '치명타율이 30% 증가합니다.',
    icon: '🎯',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: 30
  },
  
  berserk: {
    type: 'berserk',
    category: 'buff',
    name: '광폭화',
    description: '공격력 50% 증가, 방어력 25% 감소',
    icon: '🤬',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: 50
  },
  
  evasion: {
    type: 'evasion',
    category: 'buff',
    name: '회피',
    description: '회피율이 30% 증가합니다.',
    icon: '💨',
    maxDuration: 3,
    stackable: false,
    currentStacks: 1,
    maxStacks: 1,
    effectPercentage: 30
  }
}

// 상태이상 생성 헬퍼
export function createStatusEffect(
  type: StatusEffectType, 
  duration?: number,
  stacks?: number
): StatusEffect {
  const definition = STATUS_EFFECT_DEFINITIONS[type]
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    ...definition,
    id,
    duration: duration || definition.maxDuration,
    currentStacks: Math.min(stacks || 1, definition.maxStacks)
  }
}

// 상태이상 저항/면역 계산
export function calculateStatusResistance(
  baseResistance: number,
  targetLevel: number,
  attackerLevel: number
): number {
  const levelDifference = targetLevel - attackerLevel
  const levelBonus = levelDifference * 2 // 레벨 차이당 2% 저항
  
  return Math.min(95, Math.max(0, baseResistance + levelBonus))
}

// 상태이상 적용 확률 계산
export function shouldApplyStatus(
  baseChance: number,
  resistance: number
): boolean {
  const finalChance = baseChance * (1 - resistance / 100)
  return Math.random() * 100 < finalChance
}