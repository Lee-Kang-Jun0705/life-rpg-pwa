// 스킬 관련 타입 정의

export type SkillType = 'active' | 'passive' | 'buff'
export type SkillRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type SkillTarget = 'self' | 'enemy' | 'all_enemies' | 'ally' | 'all_allies'

// 스킬 효과 타입
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special'
  value: number // 기본값 또는 배율
  duration?: number // 버프/디버프 지속 턴
  stat?: 'attack' | 'defense' | 'speed' | 'hp' // 버프/디버프 대상 스탯
  special?: string // 특수 효과 ID
}

// 스킬 정의
export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  type: SkillType
  rarity: SkillRarity
  levelRequirement: number
  
  // 스킬 비용
  mpCost?: number
  cooldown?: number // 재사용 대기 턴
  
  // 스킬 효과
  target: SkillTarget
  effects: SkillEffect[]
  
  // 스킬 레벨
  maxLevel: number
  levelBonus: number // 레벨당 효과 증가율 (%)
}

// 학습된 스킬
export interface LearnedSkill {
  skillId: string
  level: number
  experience: number // 스킬 경험치
  experienceToNext: number
  equipped: boolean // 장착 여부
  slot?: number // 장착 슬롯 (1-4)
}

// 플레이어 스킬 데이터
export interface PlayerSkills {
  userId: string
  learnedSkills: LearnedSkill[]
  equippedSkills: (string | null)[] // 장착된 스킬 ID 배열 (최대 4개)
  skillPoints: number // 사용 가능한 스킬 포인트
}

// 전투 중 스킬 상태
export interface BattleSkillState {
  skillId: string
  remainingCooldown: number
  lastUsedTurn: number
}

// 스킬 상수
export const SKILL_CONSTANTS = {
  MAX_EQUIPPED_SKILLS: 4,
  SKILL_POINT_PER_LEVEL: 1,
  BASE_SKILL_EXPERIENCE_REQUIRED: 100,
  SKILL_EXPERIENCE_MULTIPLIER: 1.5
}