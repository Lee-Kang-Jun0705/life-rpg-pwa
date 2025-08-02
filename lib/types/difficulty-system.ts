import { StatusEffect } from './status-effects'
import { ElementType } from './element-system'

// 난이도 레벨
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert' | 'legendary'

// 난이도별 수정자
export interface DifficultyModifiers {
  // 몬스터 스탯 배율
  enemyHpMultiplier: number
  enemyAttackMultiplier: number
  enemyDefenseMultiplier: number
  enemySpeedMultiplier: number
  
  // 보상 배율
  goldMultiplier: number
  itemDropRateMultiplier: number
  rareItemChanceMultiplier: number
  
  // 경험치 배율
  expMultiplier: number
  
  // 전투 난이도 조정
  enemySkillChanceMultiplier: number  // 적 스킬 발동 확률
  enemyCriticalChanceMultiplier: number  // 적 치명타 확률
  playerDamageReduction: number  // 플레이어 받는 피해 감소 (음수면 증가)
  
  // 상태이상 관련
  enemyStatusResistanceBonus: number  // 적 상태이상 저항력 보너스
  playerStatusResistanceBonus: number  // 플레이어 상태이상 저항력 보너스
  statusEffectDurationModifier: number  // 상태이상 지속시간 배율
  
  // AI 관련
  aiIntelligenceBonus: number  // AI 지능 보너스
  aiAggressionBonus: number  // AI 공격성 보너스
  
  // 특수 효과
  enableBossPhases: boolean  // 보스 페이즈 활성화
  enableEliteMonsters: boolean  // 엘리트 몬스터 출현
  eliteMonsterChance: number  // 엘리트 몬스터 확률
}

// 난이도별 설정
export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyModifiers> = {
  easy: {
    enemyHpMultiplier: 0.7,
    enemyAttackMultiplier: 0.7,
    enemyDefenseMultiplier: 0.7,
    enemySpeedMultiplier: 0.8,
    goldMultiplier: 0.8,
    itemDropRateMultiplier: 1.0,
    rareItemChanceMultiplier: 0.5,
    expMultiplier: 0.8,
    enemySkillChanceMultiplier: 0.5,
    enemyCriticalChanceMultiplier: 0.5,
    playerDamageReduction: 0.2,  // 20% 피해 감소
    enemyStatusResistanceBonus: -20,
    playerStatusResistanceBonus: 20,
    statusEffectDurationModifier: 0.8,
    aiIntelligenceBonus: -20,
    aiAggressionBonus: -10,
    enableBossPhases: false,
    enableEliteMonsters: false,
    eliteMonsterChance: 0
  },
  normal: {
    enemyHpMultiplier: 1.0,
    enemyAttackMultiplier: 1.0,
    enemyDefenseMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    goldMultiplier: 1.0,
    itemDropRateMultiplier: 1.0,
    rareItemChanceMultiplier: 1.0,
    expMultiplier: 1.0,
    enemySkillChanceMultiplier: 1.0,
    enemyCriticalChanceMultiplier: 1.0,
    playerDamageReduction: 0,
    enemyStatusResistanceBonus: 0,
    playerStatusResistanceBonus: 0,
    statusEffectDurationModifier: 1.0,
    aiIntelligenceBonus: 0,
    aiAggressionBonus: 0,
    enableBossPhases: true,
    enableEliteMonsters: false,
    eliteMonsterChance: 0
  },
  hard: {
    enemyHpMultiplier: 1.5,
    enemyAttackMultiplier: 1.3,
    enemyDefenseMultiplier: 1.3,
    enemySpeedMultiplier: 1.2,
    goldMultiplier: 1.5,
    itemDropRateMultiplier: 1.3,
    rareItemChanceMultiplier: 1.5,
    expMultiplier: 1.3,
    enemySkillChanceMultiplier: 1.5,
    enemyCriticalChanceMultiplier: 1.5,
    playerDamageReduction: -0.1,  // 10% 피해 증가
    enemyStatusResistanceBonus: 20,
    playerStatusResistanceBonus: -10,
    statusEffectDurationModifier: 1.2,
    aiIntelligenceBonus: 20,
    aiAggressionBonus: 15,
    enableBossPhases: true,
    enableEliteMonsters: true,
    eliteMonsterChance: 0.1  // 10%
  },
  expert: {
    enemyHpMultiplier: 2.0,
    enemyAttackMultiplier: 1.8,
    enemyDefenseMultiplier: 1.6,
    enemySpeedMultiplier: 1.5,
    goldMultiplier: 2.0,
    itemDropRateMultiplier: 1.6,
    rareItemChanceMultiplier: 2.0,
    expMultiplier: 1.6,
    enemySkillChanceMultiplier: 2.0,
    enemyCriticalChanceMultiplier: 2.0,
    playerDamageReduction: -0.2,  // 20% 피해 증가
    enemyStatusResistanceBonus: 40,
    playerStatusResistanceBonus: -20,
    statusEffectDurationModifier: 1.5,
    aiIntelligenceBonus: 40,
    aiAggressionBonus: 25,
    enableBossPhases: true,
    enableEliteMonsters: true,
    eliteMonsterChance: 0.2  // 20%
  },
  legendary: {
    enemyHpMultiplier: 3.0,
    enemyAttackMultiplier: 2.5,
    enemyDefenseMultiplier: 2.0,
    enemySpeedMultiplier: 2.0,
    goldMultiplier: 3.0,
    itemDropRateMultiplier: 2.0,
    rareItemChanceMultiplier: 3.0,
    expMultiplier: 2.0,
    enemySkillChanceMultiplier: 3.0,
    enemyCriticalChanceMultiplier: 3.0,
    playerDamageReduction: -0.3,  // 30% 피해 증가
    enemyStatusResistanceBonus: 60,
    playerStatusResistanceBonus: -30,
    statusEffectDurationModifier: 2.0,
    aiIntelligenceBonus: 60,
    aiAggressionBonus: 40,
    enableBossPhases: true,
    enableEliteMonsters: true,
    eliteMonsterChance: 0.3  // 30%
  }
}

// 엘리트 몬스터 수정자
export interface EliteModifiers {
  hpMultiplier: number
  attackMultiplier: number
  defenseMultiplier: number
  goldMultiplier: number
  guaranteedRareDrop: boolean
  additionalStatusEffects?: StatusEffect[]
  glowColor: string  // UI 표시용
}

// 엘리트 타입
export type EliteType = 'champion' | 'veteran' | 'boss_minion'

// 엘리트 몬스터 설정
export const ELITE_MODIFIERS: Record<EliteType, EliteModifiers> = {
  champion: {
    hpMultiplier: 2.0,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.5,
    goldMultiplier: 3.0,
    guaranteedRareDrop: true,
    glowColor: '#FFD700'  // 금색
  },
  veteran: {
    hpMultiplier: 1.5,
    attackMultiplier: 1.3,
    defenseMultiplier: 1.3,
    goldMultiplier: 2.0,
    guaranteedRareDrop: false,
    glowColor: '#9400D3'  // 보라색
  },
  boss_minion: {
    hpMultiplier: 1.3,
    attackMultiplier: 1.2,
    defenseMultiplier: 1.1,
    goldMultiplier: 1.5,
    guaranteedRareDrop: false,
    glowColor: '#FF4500'  // 빨간색
  }
}

// 동적 난이도 조정
export interface DynamicDifficultyState {
  baseLevel: DifficultyLevel
  playerDeathCount: number
  playerVictoryStreak: number
  averageBattleDuration: number
  playerLevelDifference: number  // 권장 레벨과의 차이
}

// 동적 난이도 계산
export function calculateDynamicDifficulty(state: DynamicDifficultyState): Partial<DifficultyModifiers> {
  const modifiers: Partial<DifficultyModifiers> = {}
  
  // 죽음 횟수에 따른 조정 (5회마다 10% 쉬워짐)
  const deathPenalty = Math.min(0.5, state.playerDeathCount * 0.02)
  modifiers.enemyHpMultiplier = 1 - deathPenalty
  modifiers.enemyAttackMultiplier = 1 - deathPenalty
  
  // 연승에 따른 조정 (3연승마다 10% 어려워짐)
  const streakBonus = Math.min(0.5, Math.floor(state.playerVictoryStreak / 3) * 0.1)
  modifiers.goldMultiplier = 1 + streakBonus
  modifiers.expMultiplier = 1 + streakBonus
  
  // 레벨 차이에 따른 조정
  if (state.playerLevelDifference < -5) {
    // 플레이어가 5레벨 이상 낮음
    modifiers.playerDamageReduction = 0.3
  } else if (state.playerLevelDifference > 5) {
    // 플레이어가 5레벨 이상 높음
    modifiers.enemyHpMultiplier = 1.2
    modifiers.enemyAttackMultiplier = 1.2
  }
  
  return modifiers
}

// 난이도 설명
export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, {
  name: string
  description: string
  color: string
  recommendedLevel: string
}> = {
  easy: {
    name: '쉬움',
    description: '초보자를 위한 난이도입니다. 적이 약하고 피해를 덜 받습니다.',
    color: '#4CAF50',
    recommendedLevel: '1-10'
  },
  normal: {
    name: '보통',
    description: '표준 난이도입니다. 적절한 도전과 보상을 제공합니다.',
    color: '#2196F3',
    recommendedLevel: '10-30'
  },
  hard: {
    name: '어려움',
    description: '숙련자를 위한 난이도입니다. 적이 강하고 엘리트 몬스터가 출현합니다.',
    color: '#FF9800',
    recommendedLevel: '30-50'
  },
  expert: {
    name: '전문가',
    description: '전문가를 위한 난이도입니다. 극도로 어려운 전투가 기다립니다.',
    color: '#F44336',
    recommendedLevel: '50-70'
  },
  legendary: {
    name: '전설',
    description: '전설적인 영웅을 위한 난이도입니다. 최고의 보상과 명예가 기다립니다.',
    color: '#9C27B0',
    recommendedLevel: '70+'
  }
}