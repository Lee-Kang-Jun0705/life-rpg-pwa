/**
 * 스킬 데이터 정의
 */

import type { Skill } from '../types/skill-system'
import { baseSkills } from './base-skills'

// baseSkills와 추가 스킬을 병합
export const allSkills: Record<string, Skill> = {
  // baseSkills의 모든 스킬 포함
  ...baseSkills,
  
  // 기본 스킬 (baseSkills에서 덮어쓰기)
  basic_attack: {
    id: 'basic_attack',
    name: '기본 공격',
    description: '기본적인 물리 공격',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 0,
    mpCost: 0,
    range: 1,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 100, scaling: 1.0 },
      element: 'physical'
    }],
    icon: '⚔️'
  },

  defend: {
    id: 'defend',
    name: '방어',
    description: '받는 피해를 감소시킵니다',
    category: 'defense',
    type: 'active',
    level: 1,
    maxLevel: 5,
    cooldown: 5,
    mpCost: 10,
    range: 0,
    target: 'self',
    effects: [{
      type: 'buff',
      value: 0.5,
      duration: 3
    }],
    icon: '🛡️'
  },

  // 공격 스킬
  power_strike: {
    id: 'power_strike',
    name: '파워 스트라이크',
    description: '강력한 일격을 가합니다',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 3,
    mpCost: { base: 20, perLevel: 5 },
    range: 1,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 150, scaling: 1.5 },
      element: 'physical',
      chance: 30
    }],
    requirements: {
      level: 5
    },
    icon: '💥'
  },

  whirlwind: {
    id: 'whirlwind',
    name: '회전베기',
    description: '주변의 모든 적을 공격합니다',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 8,
    mpCost: { base: 40, perLevel: 10 },
    range: 2,
    target: 'allEnemies',
    effects: [{
      type: 'damage',
      value: { base: 80, scaling: 1.2 },
      element: 'physical'
    }],
    requirements: {
      level: 10,
      skills: [{ id: 'power_strike', level: 3 }]
    },
    icon: '🌪️'
  },

  // 마법 스킬
  fireball: {
    id: 'fireball',
    name: '파이어볼',
    description: '불꽃 구체를 발사합니다',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 2,
    mpCost: { base: 30, perLevel: 5 },
    castTime: 1,
    range: 5,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 120, scaling: 1.8 },
      element: 'fire'
    }, {
      type: 'dot',
      value: 20,
      element: 'fire',
      duration: 3,
      chance: 50
    }],
    icon: '🔥'
  },

  ice_shard: {
    id: 'ice_shard',
    name: '아이스 샤드',
    description: '얼음 파편을 발사합니다',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 2,
    mpCost: { base: 25, perLevel: 5 },
    range: 4,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 100, scaling: 1.5 },
      element: 'ice'
    }, {
      type: 'slow',
      value: 0.3,
      duration: 2,
      chance: 80
    }],
    icon: '❄️'
  },

  lightning_bolt: {
    id: 'lightning_bolt',
    name: '라이트닝 볼트',
    description: '번개를 소환합니다',
    category: 'attack',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 3,
    mpCost: { base: 40, perLevel: 8 },
    castTime: 0.5,
    range: 6,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 150, scaling: 2.0 },
      element: 'lightning'
    }, {
      type: 'stun',
      value: 1,
      duration: 1,
      chance: 20
    }],
    requirements: {
      level: 15
    },
    icon: '⚡'
  },

  // 방어 스킬
  shield_bash: {
    id: 'shield_bash',
    name: '방패 강타',
    description: '방패로 적을 공격하고 기절시킵니다',
    category: 'defense',
    type: 'active',
    level: 1,
    maxLevel: 5,
    cooldown: 10,
    mpCost: 30,
    range: 1,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 50, scaling: 1.0 },
      element: 'physical'
    }, {
      type: 'stun',
      value: 1,
      duration: 2
    }],
    requirements: {
      skills: [{ id: 'defend', level: 3 }]
    },
    icon: '🛡️'
  },

  iron_will: {
    id: 'iron_will',
    name: '강철 의지',
    description: '일정 시간 동안 피해를 크게 감소시킵니다',
    category: 'defense',
    type: 'toggle',
    level: 1,
    maxLevel: 5,
    cooldown: 0,
    mpCost: { base: 5, perLevel: 2 },
    range: 0,
    target: 'self',
    effects: [{
      type: 'buff',
      value: 0.7
    }],
    requirements: {
      level: 20,
      skills: [{ id: 'shield_bash', level: 3 }]
    },
    icon: '🗿'
  },

  // 서포트 스킬
  heal: {
    id: 'heal',
    name: '치유',
    description: '대상의 체력을 회복시킵니다',
    category: 'support',
    type: 'active',
    level: 1,
    maxLevel: 10,
    cooldown: 3,
    mpCost: { base: 30, perLevel: 5 },
    castTime: 1.5,
    range: 3,
    target: 'singleAlly',
    effects: [{
      type: 'heal',
      value: { base: 150, scaling: 2.0 }
    }],
    icon: '💚'
  },

  blessing: {
    id: 'blessing',
    name: '축복',
    description: '아군의 능력치를 향상시킵니다',
    category: 'support',
    type: 'active',
    level: 1,
    maxLevel: 5,
    cooldown: 20,
    mpCost: 50,
    range: 4,
    target: 'singleAlly',
    effects: [{
      type: 'buff',
      value: 1.3,
      duration: 30
    }],
    requirements: {
      level: 10,
      skills: [{ id: 'heal', level: 3 }]
    },
    icon: '✨'
  },

  meditation: {
    id: 'meditation',
    name: '명상',
    description: 'MP 재생률을 증가시킵니다',
    category: 'support',
    type: 'passive',
    level: 1,
    maxLevel: 10,
    cooldown: 0,
    mpCost: 0,
    range: 0,
    target: 'self',
    effects: [{
      type: 'buff',
      value: { base: 2, scaling: 0.5 }
    }],
    icon: '🧘'
  },

  // 특수 스킬
  berserk: {
    id: 'berserk',
    name: '광폭화',
    description: '공격력은 증가하지만 방어력이 감소합니다',
    category: 'special',
    type: 'active',
    level: 1,
    maxLevel: 5,
    cooldown: 60,
    mpCost: 0,
    range: 0,
    target: 'self',
    effects: [{
      type: 'buff',
      value: 1.5,
      duration: 15
    }, {
      type: 'debuff',
      value: 0.7,
      duration: 15
    }],
    requirements: {
      level: 25
    },
    icon: '👹'
  },

  teleport: {
    id: 'teleport',
    name: '순간이동',
    description: '짧은 거리를 순간이동합니다',
    category: 'special',
    type: 'active',
    level: 1,
    maxLevel: 3,
    cooldown: 15,
    mpCost: 50,
    range: 5,
    target: 'area',
    effects: [{
      type: 'teleport',
      value: 5
    }],
    requirements: {
      level: 30
    },
    icon: '🌀'
  },

  // 콤보 스킬
  combo_slash: {
    id: 'combo_slash',
    name: '연속 베기',
    description: '빠른 연속 공격을 가합니다',
    category: 'attack',
    type: 'combo',
    level: 1,
    maxLevel: 5,
    cooldown: 1,
    mpCost: 15,
    range: 1,
    target: 'singleEnemy',
    effects: [{
      type: 'damage',
      value: { base: 60, scaling: 1.0 },
      element: 'physical'
    }],
    requirements: {
      level: 15,
      skills: [{ id: 'basic_attack', level: 5 }]
    },
    icon: '⚔️'
  }
}