/**
 * 컴패니언(펫) 시스템 타입 정의
 */

// 컴패니언 희귀도
export type CompanionRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

// 컴패니언 타입
export type CompanionType = 'offensive' | 'defensive' | 'support' | 'balanced'

// 컴패니언 속성
export type CompanionElement = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark' | 'normal'

// 컴패니언 상태
export type CompanionMood = 'happy' | 'normal' | 'sad' | 'tired' | 'hungry'

// 컴패니언 기본 정보
export interface CompanionData {
  id: string
  name: string
  species: string // 종족 (고양이, 드래곤, 정령 등)
  emoji: string
  description: string
  rarity: CompanionRarity
  type: CompanionType
  element: CompanionElement
  
  // 기본 스탯
  baseStats: {
    hp: number
    attack: number
    defense: number
    speed: number
    critRate: number
    critDamage: number
  }
  
  // 성장 계수
  growthRates: {
    hp: number
    attack: number
    defense: number
    speed: number
  }
  
  // 스킬
  skills: CompanionSkill[]
  
  // 특성
  traits: CompanionTrait[]
  
  // 진화 정보
  evolution?: {
    toCompanionId: string
    requiredLevel: number
    requiredItems?: { itemId: string; quantity: number }[]
  }
}

// 플레이어가 소유한 컴패니언 인스턴스
export interface CompanionInstance {
  id: string // 인스턴스 고유 ID
  companionId: string // CompanionData의 ID
  nickname?: string // 플레이어가 지정한 이름
  
  // 레벨과 경험치
  level: number
  exp: number
  expToNext: number
  
  // 현재 스탯 (기본 스탯 + 레벨 보너스 + 장비 보너스)
  currentStats: {
    hp: number
    maxHp: number
    attack: number
    defense: number
    speed: number
    critRate: number
    critDamage: number
  }
  
  // 상태
  mood: CompanionMood
  loyalty: number // 0-100, 충성도
  hunger: number // 0-100, 배고픔 (100이 배부름)
  fatigue: number // 0-100, 피로도
  
  // 장착 중인 아이템
  equipment?: {
    accessory?: string // 액세서리 아이템 ID
    costume?: string // 코스튬 아이템 ID
  }
  
  // 활성 스킬
  unlockedSkills: string[] // 스킬 ID 목록
  
  // 획득 정보
  obtainedAt: string // ISO date
  lastInteractionAt: string // 마지막 상호작용 시간
  
  // 전투 통계
  battleStats: {
    victories: number
    defeats: number
    assistKills: number
    damageDealt: number
    healingDone: number
  }
}

// 컴패니언 스킬
export interface CompanionSkill {
  id: string
  name: string
  description: string
  icon: string
  
  // 스킬 타입
  type: 'active' | 'passive'
  targetType: 'self' | 'player' | 'enemy' | 'all-enemies' | 'all-allies'
  
  // 언락 조건
  unlockLevel: number
  
  // 효과
  effects: {
    damage?: number // 데미지 배율
    healing?: number // 힐링 배율
    buff?: {
      stat: 'attack' | 'defense' | 'speed' | 'critRate' | 'critDamage'
      value: number // 증가 %
      duration: number // 턴 수
    }
    debuff?: {
      stat: 'attack' | 'defense' | 'speed'
      value: number // 감소 %
      duration: number // 턴 수
    }
    statusEffect?: {
      type: string // 상태이상 타입
      chance: number // 확률 %
      duration: number
    }
  }
  
  // 쿨다운 (액티브 스킬만)
  cooldown?: number
  currentCooldown?: number
}

// 컴패니언 특성
export interface CompanionTrait {
  id: string
  name: string
  description: string
  
  // 특성 효과
  effects: {
    // 스탯 보너스
    statBonus?: {
      stat: keyof CompanionInstance['currentStats']
      value: number // % 증가
    }
    // 전투 특수 효과
    combatEffect?: {
      type: 'lifesteal' | 'thorns' | 'dodge' | 'counter' | 'shield'
      value: number
      chance?: number // 발동 확률
    }
    // 비전투 효과
    utilityEffect?: {
      type: 'exp-bonus' | 'gold-bonus' | 'item-find' | 'loyalty-gain'
      value: number // % 증가
    }
  }
}

// 컴패니언 활동
export interface CompanionActivity {
  type: 'feed' | 'play' | 'train' | 'rest' | 'gift'
  companionId: string
  timestamp: string
  
  // 활동 결과
  result: {
    moodChange?: number
    loyaltyChange?: number
    hungerChange?: number
    fatigueChange?: number
    expGained?: number
  }
}

// 컴패니언 관리 설정
export interface CompanionSettings {
  activeCompanionId?: string // 현재 활성화된 컴패니언
  autoFeed: boolean // 자동 먹이 주기
  notifyLowMood: boolean // 기분 나쁨 알림
  notifyHungry: boolean // 배고픔 알림
}

// 컴패니언 획득 방법
export interface CompanionObtainMethod {
  type: 'gacha' | 'quest' | 'achievement' | 'event' | 'shop' | 'evolution'
  details: {
    gachaRate?: number // 가챠 확률
    questId?: string // 퀘스트 ID
    achievementId?: string // 업적 ID
    eventId?: string // 이벤트 ID
    shopPrice?: { currency: string; amount: number } // 상점 가격
    evolutionFrom?: string // 진화 전 컴패니언 ID
  }
}