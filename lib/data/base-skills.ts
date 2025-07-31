/**
 * 기본 스킬 데이터베이스
 * 모든 스킬의 기본 정보 정의
 */

import type { Skill } from '@/lib/types/skill-system'
import { SkillCategory, SkillType, TargetType, ElementType, EffectType } from '@/lib/types/skill-system'

export const baseSkills: Record<string, Skill> = {
  // === 공격 스킬 ===
  // 기본 공격 (스킬이 아닌 기본 공격)
  basic_attack: {
    id: 'basic_attack',
    name: '기본 공격',
    description: '기본적인 공격을 가한다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 1,
    cooldown: 0, // 쿨다운 없음
    mpCost: 0, // MP 소모 없음
    range: 1,
    target: TargetType.SINGLE_ENEMY,
    effects: [{
      type: EffectType.DAMAGE,
      value: { base: 100, scaling: 0 }, // 100% 기본 공격력
      element: ElementType.PHYSICAL
    }],
    icon: '⚔️',
    animation: 'basic_attack',
    sound: 'basic_hit'
  },

  defend: {
    id: 'defend',
    name: '방어',
    description: '방어 자세를 취해 받는 피해를 줄인다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 1,
    cooldown: 0,
    mpCost: 0,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 50, scaling: 0 }, // 50% 방어력 증가
      attribute: 'defense',
      duration: 1
    }],
    icon: '🛡️',
    animation: 'defend',
    sound: 'defend'
  },
  
  // 기본 공격 스킬
  power_strike: {
    id: 'power_strike',
    name: '파워 스트라이크',
    description: '강력한 일격으로 적에게 큰 피해를 입힌다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 10,
    mpCost: 10,
    range: 1,
    target: TargetType.SINGLE_ENEMY,
    effects: [{
      type: EffectType.DAMAGE,
      value: { base: 150, scaling: 20 }, // 150% + 레벨당 20%
      element: ElementType.PHYSICAL
    }],
    icon: '💥',
    animation: 'slash',
    sound: 'sword_hit'
  },

  multi_slash: {
    id: 'multi_slash',
    name: '연속 베기',
    description: '빠른 연속 공격으로 3번 베어낸다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 15,
    mpCost: { base: 15, perLevel: 2 },
    range: 1,
    target: TargetType.SINGLE_ENEMY,
    effects: [{
      type: EffectType.DAMAGE,
      value: { base: 60, scaling: 10 }, // 60% x 3회
      element: ElementType.PHYSICAL,
      stacks: 3
    }],
    requirements: { level: 5 },
    icon: '⚡',
    animation: 'multi_hit',
    sound: 'sword_combo'
  },

  whirlwind: {
    id: 'whirlwind',
    name: '회전 베기',
    description: '회전하며 주변의 모든 적을 베어낸다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 20,
    mpCost: 25,
    range: 2,
    target: TargetType.ALL_ENEMIES,
    effects: [{
      type: EffectType.DAMAGE,
      value: { base: 80, scaling: 15 },
      element: ElementType.PHYSICAL
    }],
    requirements: { level: 10, skills: [{ id: 'multi_slash', level: 3 }] },
    icon: '🌪️',
    animation: 'spin',
    sound: 'whirlwind'
  },

  focus_shot: {
    id: 'focus_shot',
    name: '집중 사격',
    description: '정확한 조준으로 치명타 확률이 높은 공격.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 12,
    mpCost: 15,
    castTime: 1,
    range: 4,
    target: TargetType.SINGLE_ENEMY,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: { base: 200, scaling: 25 },
        element: ElementType.PHYSICAL
      },
      {
        type: EffectType.BUFF,
        value: 50, // 치명타 확률 +50%
        duration: 1
      }
    ],
    icon: '🎯',
    animation: 'aimed_shot',
    sound: 'bow_shot'
  },

  // 마법 공격 스킬
  fireball: {
    id: 'fireball',
    name: '파이어볼',
    description: '화염구를 발사하여 적을 태운다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 8,
    mpCost: 20,
    range: 3,
    target: TargetType.SINGLE_ENEMY,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: { base: 120, scaling: 18 },
        element: ElementType.FIRE
      },
      {
        type: EffectType.DOT,
        value: 10, // 틱당 10 데미지
        duration: 3,
        element: ElementType.FIRE,
        chance: 30
      }
    ],
    icon: '🔥',
    animation: 'fireball',
    sound: 'fire_cast'
  },

  ice_shard: {
    id: 'ice_shard',
    name: '아이스 샤드',
    description: '얼음 파편을 날려 적을 얼린다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 10,
    mpCost: 18,
    range: 3,
    target: TargetType.SINGLE_ENEMY,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: { base: 100, scaling: 15 },
        element: ElementType.ICE
      },
      {
        type: EffectType.SLOW,
        value: 30, // 30% 감속
        duration: 3,
        chance: 50
      }
    ],
    icon: '❄️',
    animation: 'ice_projectile',
    sound: 'ice_cast'
  },

  lightning_bolt: {
    id: 'lightning_bolt',
    name: '라이트닝 볼트',
    description: '번개를 떨어뜨려 적을 감전시킨다.',
    category: SkillCategory.ATTACK,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 15,
    mpCost: 30,
    range: 4,
    target: TargetType.SINGLE_ENEMY,
    effects: [
      {
        type: EffectType.DAMAGE,
        value: { base: 180, scaling: 25 },
        element: ElementType.LIGHTNING
      },
      {
        type: EffectType.STUN,
        value: 1,
        duration: 1,
        chance: 20
      }
    ],
    requirements: { level: 15 },
    icon: '⚡',
    animation: 'lightning_strike',
    sound: 'thunder'
  },

  // === 방어 스킬 ===
  iron_wall: {
    id: 'iron_wall',
    name: '철벽',
    description: '3초간 받는 피해를 크게 줄인다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 30,
    mpCost: 20,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.SHIELD,
      value: { base: 50, scaling: 10 }, // 50% + 레벨당 10% 피해 감소
      duration: 3
    }],
    icon: '🛡️',
    animation: 'shield_up',
    sound: 'shield_cast'
  },

  counter_attack: {
    id: 'counter_attack',
    name: '반격',
    description: '다음 공격을 막고 반격한다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 20,
    mpCost: 15,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.REFLECT,
      value: { base: 100, scaling: 20 }, // 100% + 레벨당 20% 반사
      duration: 1
    }],
    requirements: { level: 8 },
    icon: '🔄',
    animation: 'parry',
    sound: 'counter'
  },

  dodge_master: {
    id: 'dodge_master',
    name: '회피의 달인',
    description: '일정 시간 회피율을 크게 높인다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 25,
    mpCost: 25,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 30, scaling: 5 }, // 회피율 30% + 레벨당 5%
      duration: 5
    }],
    icon: '💨',
    animation: 'dodge_buff',
    sound: 'whoosh'
  },

  regeneration: {
    id: 'regeneration',
    name: '재생',
    description: '체력을 지속적으로 회복한다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 40,
    mpCost: 30,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.HOT,
      value: { base: 20, scaling: 5 }, // 틱당 20 + 레벨당 5 회복
      duration: 10
    }],
    icon: '💚',
    animation: 'heal_aura',
    sound: 'heal_cast'
  },

  // === 서포트 스킬 ===
  berserk: {
    id: 'berserk',
    name: '광폭화',
    description: '공격력은 증가하지만 방어력이 감소한다.',
    category: SkillCategory.SUPPORT,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 60,
    mpCost: 40,
    range: 0,
    target: TargetType.SELF,
    effects: [
      {
        type: EffectType.BUFF,
        value: { base: 50, scaling: 10 }, // 공격력 50% + 레벨당 10%
        duration: 15
      },
      {
        type: EffectType.DEBUFF,
        value: 30, // 방어력 30% 감소
        duration: 15
      }
    ],
    requirements: { level: 20 },
    icon: '😡',
    animation: 'rage',
    sound: 'roar'
  },

  focus: {
    id: 'focus',
    name: '집중',
    description: '치명타 확률과 데미지를 높인다.',
    category: SkillCategory.SUPPORT,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 45,
    mpCost: 35,
    range: 0,
    target: TargetType.SELF,
    effects: [
      {
        type: EffectType.BUFF,
        value: { base: 20, scaling: 3 }, // 치명타 확률
        duration: 10
      },
      {
        type: EffectType.BUFF,
        value: { base: 30, scaling: 5 }, // 치명타 데미지
        duration: 10
      }
    ],
    icon: '🧘',
    animation: 'focus',
    sound: 'concentrate'
  },

  haste: {
    id: 'haste',
    name: '가속',
    description: '공격 속도와 이동 속도를 증가시킨다.',
    category: SkillCategory.SUPPORT,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 35,
    mpCost: 25,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 30, scaling: 5 }, // 속도 30% + 레벨당 5%
      duration: 8
    }],
    icon: '🏃',
    animation: 'speed_up',
    sound: 'haste'
  },

  battle_cry: {
    id: 'battle_cry',
    name: '전투 함성',
    description: '아군 전체의 공격력을 높인다.',
    category: SkillCategory.SUPPORT,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 60,
    mpCost: 50,
    range: 5,
    target: TargetType.ALL_ALLIES,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 20, scaling: 3 },
      duration: 20
    }],
    requirements: { level: 25 },
    icon: '📢',
    animation: 'war_cry',
    sound: 'battle_shout'
  },

  // === 특수 스킬 (조합/희귀) ===
  time_stop: {
    id: 'time_stop',
    name: '시간 정지',
    description: '3초간 모든 적의 시간을 멈춘다.',
    category: SkillCategory.SPECIAL,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 5,
    cooldown: 120,
    mpCost: 100,
    range: 999,
    target: TargetType.ALL_ENEMIES,
    effects: [{
      type: EffectType.STUN,
      value: 1,
      duration: 3
    }],
    requirements: { level: 40 },
    icon: '⏱️',
    animation: 'time_freeze',
    sound: 'time_stop'
  },

  shadow_clone: {
    id: 'shadow_clone',
    name: '분신술',
    description: '자신의 분신을 소환한다.',
    category: SkillCategory.SPECIAL,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 5,
    cooldown: 90,
    mpCost: 80,
    range: 1,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.SUMMON,
      value: { base: 50, scaling: 10 }, // 본체의 50% + 레벨당 10% 능력치
      duration: 30
    }],
    requirements: { level: 35 },
    icon: '👥',
    animation: 'clone_summon',
    sound: 'shadow_appear'
  },

  meteor_storm: {
    id: 'meteor_storm',
    name: '메테오 스톰',
    description: '하늘에서 운석을 떨어뜨린다.',
    category: SkillCategory.SPECIAL,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 5,
    cooldown: 180,
    mpCost: 150,
    castTime: 3,
    range: 5,
    target: TargetType.AREA,
    effects: [{
      type: EffectType.DAMAGE,
      value: { base: 500, scaling: 100 },
      element: ElementType.FIRE,
      stacks: 5 // 5개의 운석
    }],
    requirements: { level: 50, skills: [{ id: 'fireball', level: 10 }] },
    icon: '☄️',
    animation: 'meteor_rain',
    sound: 'meteor_impact'
  },

  divine_blessing: {
    id: 'divine_blessing',
    name: '신의 축복',
    description: '모든 아군을 완전히 회복시킨다.',
    category: SkillCategory.SPECIAL,
    type: SkillType.ACTIVE,
    level: 1,
    maxLevel: 3,
    cooldown: 300,
    mpCost: 200,
    range: 999,
    target: TargetType.ALL_ALLIES,
    effects: [
      {
        type: EffectType.HEAL,
        value: { base: 100, scaling: 0 }, // 100% 회복
      },
      {
        type: EffectType.DISPEL,
        value: 1 // 모든 디버프 제거
      }
    ],
    requirements: { level: 45 },
    icon: '✨',
    animation: 'holy_light',
    sound: 'divine_heal'
  },

  // === 패시브 스킬 ===
  sword_mastery: {
    id: 'sword_mastery',
    name: '검술 숙련',
    description: '검 계열 무기 사용 시 공격력 증가',
    category: SkillCategory.ATTACK,
    type: SkillType.PASSIVE,
    level: 1,
    maxLevel: 20,
    cooldown: 0,
    mpCost: 0,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 5, scaling: 2 }, // 5% + 레벨당 2%
    }],
    icon: '⚔️',
  },

  tough_body: {
    id: 'tough_body',
    name: '강인한 육체',
    description: '최대 HP가 증가한다.',
    category: SkillCategory.DEFENSE,
    type: SkillType.PASSIVE,
    level: 1,
    maxLevel: 20,
    cooldown: 0,
    mpCost: 0,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 10, scaling: 5 }, // 10% + 레벨당 5%
    }],
    icon: '💪',
  },

  lucky_charm: {
    id: 'lucky_charm',
    name: '행운의 부적',
    description: '아이템 드롭률이 증가한다.',
    category: SkillCategory.SUPPORT,
    type: SkillType.PASSIVE,
    level: 1,
    maxLevel: 10,
    cooldown: 0,
    mpCost: 0,
    range: 0,
    target: TargetType.SELF,
    effects: [{
      type: EffectType.BUFF,
      value: { base: 10, scaling: 3 }, // 10% + 레벨당 3%
    }],
    icon: '🍀',
  }
}