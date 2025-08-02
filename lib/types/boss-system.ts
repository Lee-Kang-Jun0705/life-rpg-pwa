import { ElementType } from './element-system';
import { AIPattern } from './monster-ai';

// 보스 페이즈 타입
export type BossPhase = {
  phaseNumber: number;
  hpThreshold: number; // HP가 이 퍼센트 이하가 되면 페이즈 전환
  name: string;
  description: string;
  aiPattern: AIPattern;
  damageMultiplier: number;
  defenseMultiplier: number;
  speedMultiplier: number;
  specialMechanics?: BossMechanic[];
};

// 보스 특수 메커니즘
export type BossMechanic = {
  id: string;
  name: string;
  description: string;
  triggerCondition: 'turnCount' | 'hpThreshold' | 'random' | 'playerAction';
  triggerValue?: number;
  effect: BossEffect;
};

// 보스 효과 타입
export type BossEffect = {
  type: 'damage' | 'heal' | 'summon' | 'shield' | 'enrage' | 'special';
  value?: number;
  duration?: number;
  targetType: 'self' | 'player' | 'all';
  additionalData?: any;
};

// 보스 패턴
export type BossPattern = {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  damageMultiplier: number;
  hitCount?: number;
  element?: ElementType;
  statusEffect?: string;
  animation?: string;
};

// 보스 데이터 인터페이스
export interface BossData {
  id: string;
  name: string;
  title: string; // 예: "불의 군주", "얼음 여왕"
  description: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  element: ElementType;
  imageUrl: string;
  size: 'large' | 'huge' | 'colossal';
  
  // 보스 특유 속성
  phases: BossPhase[];
  currentPhase: number;
  patterns: BossPattern[];
  
  // 보상
  rewards: BossReward;
  
  // 특수 능력
  immunities?: string[]; // 면역인 상태이상
  weaknesses?: ElementType[]; // 약점 속성
  resistances?: ElementType[]; // 저항 속성
}

// 보스 보상
export interface BossReward {
  gold: { min: number; max: number };
  exp: number;
  items: BossDropItem[];
  firstClearBonus?: {
    items: BossDropItem[];
    achievement?: string;
  };
}

// 보스 드롭 아이템
export interface BossDropItem {
  itemId: string;
  dropRate: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
}

// 보스 전투 상태
export interface BossState {
  boss: BossData;
  turnCount: number;
  phaseHistory: number[];
  usedPatterns: string[];
  activeMechanics: ActiveMechanic[];
  summonedMinions?: any[];
}

// 활성화된 메커니즘
export interface ActiveMechanic {
  mechanicId: string;
  remainingDuration: number;
  stacks?: number;
}

// 보스 전투 결과
export interface BossBattleResult {
  victory: boolean;
  turnCount: number;
  damageDealt: number;
  damageTaken: number;
  phasesCompleted: number;
  rewards?: {
    gold: number;
    items: Array<{ itemId: string; quantity: number }>;
    exp: number;
  };
  firstClear?: boolean;
  achievements?: string[];
}