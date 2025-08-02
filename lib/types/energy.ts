// 에너지 시스템 타입 정의
// 던전 입장 및 게임 플레이 제한을 위한 시스템

import type { Result } from './game-common'

// 에너지 타입
export interface Energy {
  readonly current: number;
  readonly max: number;
  readonly lastRegenTime: Date;
  readonly regenRate: number; // 분당 회복량
}

// 에너지 비용
export interface EnergyCost {
  readonly type: 'dungeon' | 'battle' | 'special';
  readonly amount: number;
  readonly refundable: boolean;
}

// 던전별 에너지 비용
export const DUNGEON_ENERGY_COST = {
  easy: 10,
  normal: 20,
  hard: 30,
  nightmare: 50,
  special: 40,
  daily: 15,
  weekly: 25
} as const

// 에너지 설정
export const ENERGY_CONFIG = {
  MAX_ENERGY: 120,
  REGEN_RATE: 0.1, // 10분당 1 에너지 (분당 0.1)
  REGEN_INTERVAL: 600, // 10분 (600초)
  REGEN_AMOUNT: 1, // 회복량
  DAILY_BONUS: 30,
  LEVEL_UP_REFILL: true,
  PURCHASE_AMOUNT: 60,
  OVERFLOW_ALLOWED: false,
  DEFAULT_USER_ID: 'local-user'
} as const

// 에너지 트랜잭션
export interface EnergyTransaction {
  readonly id: string;
  readonly userId: string;
  readonly type: 'consume' | 'regen' | 'bonus' | 'purchase' | 'refund';
  readonly amount: number;
  readonly reason: string;
  readonly timestamp: Date;
  readonly beforeAmount: number;
  readonly afterAmount: number;
}

// 에너지 회복 타이머
export interface EnergyRegenTimer {
  readonly nextRegenTime: Date;
  readonly timeUntilNext: number; // 초 단위
  readonly timeUntilFull: number; // 초 단위
  readonly willBeFullAt: Date;
}

// 에너지 관련 보상
export interface EnergyReward {
  readonly type: 'instant' | 'potion' | 'ticket';
  readonly amount?: number;
  readonly itemId?: string;
  readonly expiresAt?: Date;
}

// 에너지 포션
export interface EnergyPotion {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly energyAmount: number;
  readonly rarity: 'common' | 'rare' | 'epic';
  readonly icon: string;
}

// 전투 티켓
export interface BattleTicket {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'normal' | 'premium' | 'event';
  readonly validUntil?: Date;
  readonly restrictions?: {
    readonly dungeonTypes?: string[];
    readonly minLevel?: number;
    readonly maxUses?: number;
  };
}

// 플레이어 에너지 상태
export interface PlayerEnergyState {
  readonly userId: string;
  readonly energy: Energy;
  readonly battleTickets: number;
  readonly lastDailyBonus?: Date;
  readonly energyPotions: EnergyPotion[];
  readonly premiumTickets: BattleTicket[];
  readonly transactions: EnergyTransaction[];
}

// 에너지 업데이트 결과
export interface EnergyUpdateResult {
  readonly success: boolean;
  readonly error?: string;
  readonly energy?: Energy;
  readonly transaction?: EnergyTransaction;
  readonly overflow?: number;
}

// 에너지 체크 결과
export interface EnergyCheckResult {
  readonly hasEnough: boolean;
  readonly current: number;
  readonly required: number;
  readonly deficit?: number;
  readonly canUsePotions: boolean;
  readonly availablePotions: EnergyPotion[];
}

// 일일 제한
export interface DailyLimits {
  readonly dungeonRuns: {
    readonly current: number;
    readonly max: number;
    readonly resetTime: Date;
  };
  readonly battleTickets: {
    readonly used: number;
    readonly remaining: number;
    readonly bonus: number;
  };
  readonly energyPurchases: {
    readonly count: number;
    readonly maxPerDay: number;
    readonly nextCost: number;
  };
}

// 시간 기반 보너스
export interface TimeBasedBonus {
  readonly type: 'energy' | 'tickets' | 'both';
  readonly schedule: {
    readonly hour: number;
    readonly minute: number;
    readonly duration: number; // 분 단위
  };
  readonly rewards: {
    readonly energy?: number;
    readonly tickets?: number;
    readonly items?: string[];
  };
}

// 에너지 이벤트
export interface EnergyEvent {
  readonly id: string;
  readonly name: string;
  readonly type: 'half_cost' | 'double_regen' | 'free_entry' | 'bonus_energy';
  readonly startDate: Date;
  readonly endDate: Date;
  readonly config: {
    readonly multiplier?: number;
    readonly affectedDungeons?: string[];
    readonly bonusAmount?: number;
  };
}

// 타입 가드
export function isEnergyPotion(item: unknown): item is EnergyPotion {
  return typeof item === 'object' && item !== null && 'energyAmount' in item
}

export function isBattleTicket(item: unknown): item is BattleTicket {
  return typeof item === 'object' && item !== null && 'type' in item &&
    ['normal', 'premium', 'event'].includes((item as { type: string }).type)
}

// 에너지 계산 헬퍼
export function calculateEnergyRegen(
  lastRegenTime: Date,
  currentTime: Date = new Date()
): number {
  const timeDiff = currentTime.getTime() - lastRegenTime.getTime()
  const minutesPassed = timeDiff / (1000 * 60)
  return Math.floor(minutesPassed * ENERGY_CONFIG.REGEN_RATE)
}

export function calculateTimeUntilFull(
  current: number,
  max: number,
  regenRate: number = ENERGY_CONFIG.REGEN_RATE
): number {
  const deficit = max - current
  if (deficit <= 0) {
    return 0
  }
  return Math.ceil(deficit / regenRate) * 60 // 초 단위
}

// 에너지 관련 상수
export const ENERGY_CONSTANTS = {
  MIN_ENERGY: 0,
  REGEN_INTERVAL: 60000, // 1분 (밀리초)
  DAILY_RESET_HOUR: 4, // 오전 4시 리셋
  BONUS_CLAIM_COOLDOWN: 24 * 60 * 60 * 1000, // 24시간
  POTION_STACK_LIMIT: 99,
  TICKET_STACK_LIMIT: 50
} as const
