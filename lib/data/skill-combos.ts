/**
 * 스킬 콤보 데이터
 * 특정 순서로 스킬을 사용하면 발동하는 콤보
 */

import type { SkillCombo } from '@/lib/types/skill-system'

export const skillCombos: Record<string, SkillCombo> = {
  // 기본 콤보
  triple_strike: {
    id: 'triple_strike',
    name: '삼연격',
    description: '연속으로 3번 공격하면 추가 피해',
    sequence: ['power_strike', 'power_strike', 'power_strike'],
    timeWindow: 3000,
    bonusEffect: {
      type: 'damage',
      value: 50 // 50% 추가 피해
    },
    replaceWithSkill: 'triple_strike_finisher'
  },

  elemental_burst: {
    id: 'elemental_burst',
    name: '원소 폭발',
    description: '서로 다른 원소 마법을 연속 사용',
    sequence: ['fireball', 'ice_shard', 'lightning_bolt'],
    timeWindow: 5000,
    bonusEffect: {
      type: 'damage',
      value: 100, // 100% 추가 피해
      element: 'neutral'
    },
    replaceWithSkill: 'elemental_explosion'
  },

  defensive_counter: {
    id: 'defensive_counter',
    name: '완벽한 반격',
    description: '방어 후 즉시 반격',
    sequence: ['iron_wall', 'counter_attack', 'power_strike'],
    timeWindow: 4000,
    bonusEffect: {
      type: 'damage',
      value: { base: 200, scaling: 0 }, // 200% 피해
      stacks: 1
    }
  },

  speed_blitz: {
    id: 'speed_blitz',
    name: '스피드 블리츠',
    description: '가속 상태에서 연속 공격',
    sequence: ['haste', 'multi_slash', 'multi_slash'],
    timeWindow: 3000,
    bonusEffect: {
      type: 'damage',
      value: 30,
      duration: 5
    }
  },

  berserker_rage: {
    id: 'berserker_rage',
    name: '광전사의 분노',
    description: '광폭화 상태에서 회전 베기',
    sequence: ['berserk', 'whirlwind'],
    timeWindow: 2000,
    bonusEffect: {
      type: 'damage',
      value: 75,
      element: 'physical'
    }
  },

  focused_destruction: {
    id: 'focused_destruction',
    name: '집중 파괴',
    description: '집중 후 정확한 일격',
    sequence: ['focus', 'focus_shot'],
    timeWindow: 3000,
    bonusEffect: {
      type: 'damage',
      value: 100 // 100% 추가 피해
    }
  },

  // 고급 콤보
  elemental_mastery: {
    id: 'elemental_mastery',
    name: '원소의 지배',
    description: '모든 기본 원소 마법 연속 시전',
    sequence: ['fireball', 'ice_shard', 'lightning_bolt', 'fireball'],
    timeWindow: 6000,
    replaceWithSkill: 'elemental_storm'
  },

  perfect_defense: {
    id: 'perfect_defense',
    name: '완벽한 방어',
    description: '모든 방어 기술 연계',
    sequence: ['iron_wall', 'dodge_master', 'counter_attack'],
    timeWindow: 5000,
    bonusEffect: {
      type: 'shield',
      value: { min: 100, max: 200 },
      duration: 10
    }
  },

  blade_dance: {
    id: 'blade_dance',
    name: '검무',
    description: '다양한 검술 연계',
    sequence: ['power_strike', 'multi_slash', 'whirlwind', 'power_strike'],
    timeWindow: 8000,
    bonusEffect: {
      type: 'damage',
      value: 50,
      stacks: 3
    }
  },

  // 특수 콤보 (히든)
  forbidden_art: {
    id: 'forbidden_art',
    name: '금단의 기술',
    description: '시간을 멈추고 분신과 함께 공격',
    sequence: ['time_stop', 'shadow_clone', 'meteor_storm'],
    timeWindow: 10000,
    replaceWithSkill: 'apocalypse'
  },

  divine_intervention: {
    id: 'divine_intervention',
    name: '신의 개입',
    description: '방어와 회복의 완벽한 조합',
    sequence: ['iron_wall', 'regeneration', 'divine_blessing'],
    timeWindow: 8000,
    bonusEffect: {
      type: 'heal',
      value: { base: 50, scaling: 0 } // 50% 추가 회복
    }
  },

  // 직업별 특수 콤보
  warrior_ultimate: {
    id: 'warrior_ultimate',
    name: '전사의 극의',
    description: '전사 직업 전용 궁극 콤보',
    sequence: ['berserk', 'battle_cry', 'whirlwind', 'power_strike'],
    timeWindow: 10000,
    bonusEffect: {
      type: 'damage',
      value: 150,
      duration: 5
    },
    replaceWithSkill: 'warrior_finisher'
  },

  mage_ultimate: {
    id: 'mage_ultimate',
    name: '대마법사의 비전',
    description: '마법사 직업 전용 궁극 콤보',
    sequence: ['focus', 'fireball', 'ice_shard', 'lightning_bolt', 'meteor_storm'],
    timeWindow: 12000,
    replaceWithSkill: 'arcane_annihilation'
  },

  // 연속기 콤보
  chain_lightning: {
    id: 'chain_lightning',
    name: '연쇄 번개',
    description: '번개 마법 연속 시전',
    sequence: ['lightning_bolt', 'lightning_bolt', 'lightning_bolt'],
    timeWindow: 4000,
    bonusEffect: {
      type: 'damage',
      value: 25,
      element: 'lightning',
      chance: 100
    }
  },

  ice_prison: {
    id: 'ice_prison',
    name: '얼음 감옥',
    description: '얼음 마법으로 적을 완전히 얼림',
    sequence: ['ice_shard', 'ice_shard', 'ice_shard'],
    timeWindow: 4000,
    bonusEffect: {
      type: 'stun',
      value: 1,
      duration: 3
    }
  },

  inferno: {
    id: 'inferno',
    name: '지옥불',
    description: '화염 마법 연속으로 강력한 화상',
    sequence: ['fireball', 'fireball', 'fireball'],
    timeWindow: 4000,
    bonusEffect: {
      type: 'dot',
      value: 50,
      duration: 10,
      element: 'fire'
    }
  }
}

// 콤보 달성 조건 체크 함수
export function checkComboActivation(
  recentSkills: { skillId: string; timestamp: number }[],
  combos: SkillCombo[]
): SkillCombo | null {
  const now = Date.now()

  for (const combo of combos) {
    // 시간 범위 내의 스킬만 필터링
    const validSkills = recentSkills
      .filter(s => now - s.timestamp <= combo.timeWindow)
      .map(s => s.skillId)

    // 콤보 시퀀스와 비교
    if (validSkills.length >= combo.sequence.length) {
      const recentSequence = validSkills.slice(-combo.sequence.length)

      if (JSON.stringify(recentSequence) === JSON.stringify(combo.sequence)) {
        return combo
      }
    }
  }

  return null
}
