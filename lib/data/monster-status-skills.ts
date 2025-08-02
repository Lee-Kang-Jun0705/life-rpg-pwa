import { StatusEffectType } from '../types/status-effects';

// 몬스터 스킬과 상태이상 매핑
export interface MonsterStatusSkill {
  skillName: string;
  statusEffect: StatusEffectType;
  applyChance: number; // 기본 적용 확률
  duration?: number; // 지속 시간 (기본값 사용 시 undefined)
  stacks?: number; // 중첩 수 (기본값 1)
}

// 몬스터 특수 능력별 상태이상 매핑
export const MONSTER_STATUS_SKILLS: Record<string, MonsterStatusSkill> = {
  // 독 계열
  'poison': {
    skillName: '독 공격',
    statusEffect: 'poison',
    applyChance: 30,
    stacks: 1
  },
  'venomStrike': {
    skillName: '맹독 공격',
    statusEffect: 'poison',
    applyChance: 50,
    stacks: 2
  },
  
  // 화염 계열
  'fireBreath': {
    skillName: '화염 숨결',
    statusEffect: 'burn',
    applyChance: 35,
    duration: 3
  },
  'inferno': {
    skillName: '지옥불',
    statusEffect: 'burn',
    applyChance: 60,
    duration: 5
  },
  
  // 얼음 계열
  'freeze': {
    skillName: '냉기 공격',
    statusEffect: 'freeze',
    applyChance: 20,
    duration: 1
  },
  'iceBreath': {
    skillName: '얼음 숨결',
    statusEffect: 'freeze',
    applyChance: 30,
    duration: 2
  },
  
  // 전기 계열
  'paralyze': {
    skillName: '마비 공격',
    statusEffect: 'paralysis',
    applyChance: 25
  },
  'thunderStrike': {
    skillName: '번개 공격',
    statusEffect: 'paralysis',
    applyChance: 40
  },
  
  // 어둠 계열
  'curse': {
    skillName: '저주',
    statusEffect: 'curse',
    applyChance: 20,
    stacks: 1
  },
  'darkMagic': {
    skillName: '어둠 마법',
    statusEffect: 'curse',
    applyChance: 35,
    stacks: 2
  },
  
  // 정신 계열
  'confuse': {
    skillName: '혼란 공격',
    statusEffect: 'confusion',
    applyChance: 25
  },
  'fear': {
    skillName: '공포',
    statusEffect: 'fear',
    applyChance: 30
  },
  
  // 빛 계열
  'blind': {
    skillName: '섬광',
    statusEffect: 'blind',
    applyChance: 35
  },
  
  // 특수
  'silence': {
    skillName: '침묵',
    statusEffect: 'silence',
    applyChance: 20
  },
  'sleep': {
    skillName: '수면',
    statusEffect: 'sleep',
    applyChance: 15
  }
};

// 속성별 추가 상태이상 확률
export const ELEMENT_STATUS_BONUS: Partial<Record<string, { effect: StatusEffectType; chance: number }>> = {
  'fire': { effect: 'burn', chance: 15 },
  'ice': { effect: 'freeze', chance: 10 },
  'electric': { effect: 'paralysis', chance: 15 },
  'dark': { effect: 'curse', chance: 10 },
  'poison': { effect: 'poison', chance: 20 }
};

// 보스 전용 강화 상태이상
export const BOSS_STATUS_ENHANCEMENT: Record<string, number> = {
  'applyChanceBonus': 20, // 보스는 기본 확률 +20%
  'durationBonus': 1, // 보스는 지속시간 +1턴
  'resistancePiercing': 30 // 보스는 저항력 30% 무시
};