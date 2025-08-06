// 던전 시스템 타입 정의

// 캐릭터 전투 스탯
export interface CharacterBattleStats {
  // 기본 스탯
  health: number          // 체력
  maxHealth: number       // 최대 체력
  attack: number          // 공격력
  defense: number         // 방어력
  
  // 부가 스탯
  attackSpeed: number     // 공격속도 (%)
  criticalChance: number  // 치명타 확률 (%)
  criticalDamage: number  // 치명타 데미지 (%)
  evasion: number         // 회피율 (%)
  penetration: number     // 관통력 (%)
  lifeSteal: number       // 흡혈 (%)
  
  // 레벨 정보
  totalLevel: number      // 총 레벨
  healthLevel: number     // 건강 레벨
  learningLevel: number   // 학습 레벨
  relationshipLevel: number // 관계 레벨
  achievementLevel: number  // 성취 레벨
}

// 몬스터 정보
export interface Monster {
  id: string
  name: string
  level: number
  tier: 'common' | 'elite' | 'boss' | 'legendary'
  health: number
  maxHealth: number
  attack: number
  defense: number
  attackSpeed: number
  criticalChance: number
  evasion: number
  
  // 보상
  goldReward: number
  itemDropRate: number
}

// 아이템 등급
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

// 아이템 타입
export type ItemType = 'weapon' | 'armor' | 'accessory'

// 아이템 스탯 보너스
export interface ItemBonus {
  stat: keyof CharacterBattleStats
  value: number // 퍼센트 값
}

// 아이템
export interface Item {
  id: string
  name: string
  type: ItemType
  rarity: ItemRarity
  bonuses: ItemBonus[]
  specialEffect?: string
}

// 던전 타입
export type DungeonType = 'normal' | 'elite' | 'boss' | 'infinite'

// 던전 정보
export interface Dungeon {
  type: DungeonType
  name: string
  description: string
  minLevel: number
  monsterLevelRange: [number, number]
  goldMultiplier: number
  itemDropMultiplier: number
}

// 전투 상태
export interface BattleState {
  isActive: boolean
  isPaused: boolean
  currentMonster: Monster | null
  playerStats: CharacterBattleStats
  battleLog: BattleLogEntry[]
  stage: number
  totalGold: number
  obtainedItems: Item[]
  speed: 1 | 2 | 3
}

// 전투 로그 엔트리
export interface BattleLogEntry {
  timestamp: number
  type: 'attack' | 'critical' | 'evade' | 'defeat' | 'victory' | 'item' | 'gold'
  attacker: 'player' | 'monster'
  damage?: number
  message: string
}

// 데미지 계산 결과
export interface DamageResult {
  damage: number
  isCritical: boolean
  isEvaded: boolean
  actualDamage: number
}

// 아이템 드롭 테이블
export interface ItemDropTable {
  [key in ItemRarity]: number // 드롭 확률 (%)
}

// 아이템 등급별 설정
export interface ItemRarityConfig {
  color: string
  minBonuses: number
  maxBonuses: number
  minBonusValue: number
  maxBonusValue: number
  dropRate: number
}

// 전투 설정
export interface BattleConfig {
  baseAttackInterval: number // 기본 공격 간격 (ms)
  minDamage: number // 최소 데미지
  healthRegenPerSecond: number // 초당 체력 재생
  stageTransitionDelay: number // 스테이지 전환 딜레이 (ms)
}