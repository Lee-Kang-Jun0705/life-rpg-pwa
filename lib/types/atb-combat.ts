'use client'

/**
 * ATB (Active Time Battle) 전투 시스템 타입
 * 포켓몬 스타일의 속도 기반 실시간 자동 전투
 */

import type { Character } from './game-core'
import type { Monster } from './monster'
import type { GeneratedItem } from './item-system'
import type { Skill } from './skill-system'

// ATB 게이지 상태
export interface ATBGauge {
  current: number     // 현재 게이지 (0-100)
  speed: number       // 게이지 충전 속도
  paused: boolean     // 일시정지 상태
  boost: number       // 속도 부스트 배율 (기본 1.0)
}

// ATB 전투 참가자
export interface ATBCombatant {
  id: string
  name: string
  icon?: string
  team: 'player' | 'enemy'
  
  // 전투 스탯
  stats: {
    maxHp: number
    currentHp: number
    maxMp: number
    currentMp: number
    attack: number
    defense: number
    speed: number      // ATB 충전 속도에 영향
    critRate: number
    critDamage: number
    dodge: number
    accuracy: number
  }
  
  // ATB 게이지
  atb: ATBGauge
  
  // 상태이상
  statusEffects: StatusEffect[]
  
  // 버프/디버프
  buffs: Buff[]
  
  // 스킬
  skills: CombatSkill[]
  availableItems?: CombatItem[]
  
  // AI 설정 (적 전용)
  ai?: {
    pattern: 'aggressive' | 'defensive' | 'balanced' | 'support'
    targetPriority: 'lowest_hp' | 'highest_threat' | 'random'
    skillUsageRate: number  // 0-1, 스킬 사용 확률
  }
  
  // 애니메이션 상태
  animation?: {
    current: string
    queue: string[]
  }
}

// 전투 스킬
export interface CombatSkill {
  id: string
  name: string
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'special'
  mpCost: number
  
  // 효과
  power?: number
  accuracy?: number
  critBonus?: number
  
  // 타겟팅
  targetType: 'single' | 'all' | 'self' | 'random'
  targetTeam: 'enemy' | 'ally' | 'any'
  
  // 추가 효과
  effects?: {
    status?: StatusEffectType
    buff?: BuffType
    debuff?: BuffType
    chance: number  // 0-1
  }[]
  
  // 애니메이션
  animation?: string
  effectDuration?: number  // ms
}

// 전투 아이템
export interface CombatItem {
  id: string
  name: string
  icon: string
  quantity: number
  
  // 효과
  effect: {
    type: 'heal' | 'revive' | 'buff' | 'damage' | 'cure'
    value?: number
    target: 'single' | 'all' | 'self'
    targetTeam: 'ally' | 'enemy'
    status?: StatusEffectType[]  // 치료할 상태이상
    buff?: BuffType
    duration?: number  // 버프 지속시간 (턴)
  }
  
  // 사용 조건
  conditions?: {
    minHpPercent?: number
    maxHpPercent?: number
    hasStatus?: StatusEffectType[]
  }
}

// 상태이상 타입
export type StatusEffectType = 
  | 'poison'      // 독: 매 턴 데미지
  | 'burn'        // 화상: 매 턴 데미지 + 공격력 감소
  | 'freeze'      // 빙결: 행동 불가
  | 'paralyze'    // 마비: 일정 확률로 행동 불가
  | 'sleep'       // 수면: 행동 불가, 피격 시 해제
  | 'confusion'   // 혼란: 일정 확률로 자해
  | 'blind'       // 실명: 명중률 대폭 감소
  | 'silence'     // 침묵: 스킬 사용 불가

// 버프/디버프 타입
export type BuffType = 
  | 'attack_up' | 'attack_down'
  | 'defense_up' | 'defense_down'
  | 'speed_up' | 'speed_down'
  | 'crit_up' | 'crit_down'
  | 'dodge_up' | 'dodge_down'
  | 'shield'      // 피해 흡수
  | 'regen'       // 지속 회복
  | 'atb_boost'   // ATB 게이지 충전 속도 증가

// 상태이상 효과
export interface StatusEffect {
  type: StatusEffectType
  duration: number      // 남은 턴 수 (-1이면 영구)
  damage?: number       // 턴당 데미지 (독, 화상)
  chance?: number       // 발동 확률 (마비, 혼란)
  source?: string       // 시전자 ID
}

// 버프 효과
export interface Buff {
  type: BuffType
  value: number         // 효과 수치
  duration: number      // 남은 턴 수
  source?: string       // 시전자 ID
}

// ATB 전투 상태
export interface ATBCombatState {
  id: string
  status: 'preparing' | 'active' | 'victory' | 'defeat' | 'paused'
  
  // 참가자
  combatants: ATBCombatant[]
  
  // 전투 설정
  settings: {
    battleSpeed: number       // 전투 속도 배율 (0.5x, 1x, 2x, 3x)
    autoUseItems: boolean     // 자동 아이템 사용
    autoUseSkills: boolean    // 자동 스킬 사용
    targetPriority: 'lowest_hp' | 'highest_threat' | 'nearest_death'
  }
  
  // 전투 기록
  turnCount: number
  actionHistory: CombatAction[]
  
  // 보상
  rewards?: {
    gold: number
    items: GeneratedItem[]
  }
  
  // 통계
  statistics: {
    totalDamageDealt: number
    totalDamageTaken: number
    totalHealing: number
    skillsUsed: number
    itemsUsed: number
    criticalHits: number
    dodges: number
    statusInflicted: Record<StatusEffectType, number>
  }
  
  startTime: number
  endTime?: number
}

// 전투 행동
export interface CombatAction {
  timestamp: number
  actorId: string
  type: 'attack' | 'skill' | 'item' | 'status_damage' | 'defeat'
  
  // 행동 상세
  action?: {
    id: string
    name: string
  }
  
  // 타겟
  targets: string[]
  
  // 결과
  results: ActionResult[]
  
  // 애니메이션 정보
  animation?: {
    actor: string
    targets: Record<string, string>
    duration: number
  }
}

// 행동 결과
export interface ActionResult {
  targetId: string
  
  // 데미지/회복
  damage?: number
  healing?: number
  critical?: boolean
  dodged?: boolean
  
  // 상태 변화
  statusApplied?: StatusEffectType[]
  statusRemoved?: StatusEffectType[]
  buffsApplied?: BuffType[]
  buffsRemoved?: BuffType[]
  
  // 결과 상태
  defeated?: boolean
  revived?: boolean
}

// ATB 전투 이벤트
export interface ATBCombatEvent {
  type: 'atb_full' | 'action_start' | 'action_end' | 'status_tick' | 
        'combatant_defeated' | 'battle_end' | 'phase_change'
  combatId: string
  data: unknown
}

// 전투 속도 설정
export interface BattleSpeedConfig {
  speed: number           // 배율 (0.5, 1, 2, 3)
  name: string           // 표시 이름
  description: string    // 설명
  atbChargeRate: number  // ATB 충전 속도 배율
  animationSpeed: number // 애니메이션 속도 배율
  
  // 구독 등급별 제한
  requiredTier?: 'free' | 'basic' | 'premium'
}

// 전투 설정
export const BATTLE_SPEED_CONFIGS: Record<string, BattleSpeedConfig> = {
  slow: {
    speed: 0.5,
    name: '느림',
    description: '전투가 천천히 진행됩니다',
    atbChargeRate: 0.5,
    animationSpeed: 0.8,
    requiredTier: 'free'
  },
  normal: {
    speed: 1,
    name: '보통',
    description: '기본 전투 속도',
    atbChargeRate: 1,
    animationSpeed: 1,
    requiredTier: 'free'
  },
  fast: {
    speed: 2,
    name: '빠름',
    description: '전투가 빠르게 진행됩니다',
    atbChargeRate: 2,
    animationSpeed: 1.5,
    requiredTier: 'basic'
  },
  turbo: {
    speed: 3,
    name: '터보',
    description: '매우 빠른 전투 속도',
    atbChargeRate: 3,
    animationSpeed: 2,
    requiredTier: 'premium'
  }
}

// ATB 상수
export const ATB_CONSTANTS = {
  MAX_GAUGE: 100,                    // 최대 게이지
  BASE_CHARGE_RATE: 1,               // 기본 충전 속도
  SPEED_TO_CHARGE_RATIO: 0.1,        // 속도 스탯 -> 충전 속도 변환 비율
  MIN_CHARGE_RATE: 0.5,              // 최소 충전 속도
  MAX_CHARGE_RATE: 3,                // 최대 충전 속도
  UPDATE_INTERVAL: 100,              // 게이지 업데이트 주기 (ms)
  
  // 상태이상 효과
  STATUS_DAMAGE: {
    poison: 0.05,                    // 최대 HP의 5%
    burn: 0.03,                      // 최대 HP의 3%
  },
  STATUS_CHANCE: {
    paralyze: 0.25,                  // 25% 확률로 행동 불가
    confusion: 0.33,                 // 33% 확률로 자해
  },
  
  // 자동 전투 설정
  AUTO_BATTLE: {
    skillUseThreshold: 0.7,          // MP 70% 이상일 때 스킬 사용
    itemUseHpThreshold: 0.3,         // HP 30% 이하일 때 포션 사용
    priorityTargetHpThreshold: 0.2,  // HP 20% 이하 적 우선 타겟
  }
}