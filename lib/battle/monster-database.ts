import type {
  MonsterData,
  MonsterTier,
  CharacterStats,
  BattleSkill
} from '@/lib/types/battle-extended'

// 기본 몬스터 스탯 계산
function createMonsterStats(
  level: number,
  tier: MonsterTier,
  statModifiers?: Partial<CharacterStats>
): CharacterStats {
  const tierMultiplier = {
    common: 1,
    elite: 1.5,
    boss: 2.5,
    legendary: 4
  }

  const mult = tierMultiplier[tier]

  return {
    level,
    hp: Math.floor((100 + level * 20) * mult),
    maxHp: Math.floor((100 + level * 20) * mult),
    mp: Math.floor((50 + level * 10) * mult),
    maxMp: Math.floor((50 + level * 10) * mult),
    attack: Math.floor((10 + level * 5) * mult),
    magicAttack: Math.floor((10 + level * 5) * mult),
    defense: Math.floor((5 + level * 3) * mult),
    magicDefense: Math.floor((5 + level * 3) * mult),
    speed: 10 + level * 2,
    accuracy: 95,
    evasion: 0.05 + (tier === 'elite' ? 0.05 : tier === 'boss' ? 0.1 : 0),
    critical: 0.05 + (tier === 'elite' ? 0.05 : tier === 'boss' ? 0.15 : 0),
    criticalDamage: 1.5,
    critRate: 0.05 + (tier === 'elite' ? 0.05 : tier === 'boss' ? 0.15 : 0),
    dodgeRate: 0.05 + (tier === 'elite' ? 0.05 : tier === 'boss' ? 0.1 : 0),
    ...statModifiers
  }
}

// 기본 스킬 템플릿
export const SKILL_TEMPLATES: { [key: string]: Omit<BattleSkill, 'id' | 'name' | 'description'> } = {
  basicAttack: {
    type: 'damage',
    damageType: 'physical',
    element: 'neutral',
    power: 100,
    accuracy: 100,
    mpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    targetType: 'single',
    range: 1,
    animation: 'slash'
  },
  strongAttack: {
    type: 'damage',
    damageType: 'physical',
    element: 'neutral',
    power: 150,
    accuracy: 90,
    mpCost: 10,
    cooldown: 2,
    currentCooldown: 0,
    targetType: 'single',
    range: 1,
    animation: 'power-strike'
  },
  magicAttack: {
    type: 'damage',
    damageType: 'magical',
    element: 'neutral',
    power: 120,
    accuracy: 95,
    mpCost: 15,
    cooldown: 2,
    currentCooldown: 0,
    targetType: 'single',
    range: 3,
    animation: 'projectile'
  },
  healSelf: {
    type: 'heal',
    healAmount: 100,
    mpCost: 20,
    cooldown: 5,
    currentCooldown: 0,
    targetType: 'self',
    range: 0,
    animation: 'heal',
    power: 0,
    accuracy: 100
  },
  buffAttack: {
    type: 'buff',
    mpCost: 25,
    cooldown: 8,
    currentCooldown: 0,
    targetType: 'self',
    range: 0,
    animation: 'buff',
    power: 0,
    accuracy: 100,
    statusEffect: {
      id: 'attack_up',
      name: '공격력 상승',
      type: 'buff',
      stats: { attack: 20, magicAttack: 20 },
      duration: 5,
      stackable: false,
      value: 20,
      chance: 100
    }
  },
  debuffDefense: {
    type: 'debuff',
    mpCost: 20,
    cooldown: 6,
    currentCooldown: 0,
    targetType: 'single',
    range: 3,
    animation: 'debuff',
    power: 0,
    accuracy: 85,
    statusEffect: {
      id: 'defense_down',
      name: '방어력 감소',
      type: 'debuff',
      stats: { defense: -15, magicDefense: -15 },
      duration: 4,
      stackable: false,
      value: 20,
      chance: 100
    }
  }
}

// 몬스터 데이터베이스
export const MONSTER_DATABASE: { [id: string]: MonsterData } = {
  // === 초급 몬스터 (레벨 1-10) ===
  slime_green: {
    id: 'slime_green',
    name: '초록 슬라임',
    description: '가장 약한 몬스터. 초보자에게 적합하다.',
    emoji: '🟢',
    _tier: 'common',
    stats: createMonsterStats(1, 'common'),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'slime_bounce',
        name: '슬라임 바운스',
        description: '튀어오르며 공격한다'
      }
    ],
    weaknesses: ['fire'],
    resistances: ['water']
  },

  slime_blue: {
    id: 'slime_blue',
    name: '파란 슬라임',
    description: '물 속성을 가진 슬라임',
    emoji: '🔵',
    _tier: 'common',
    stats: createMonsterStats(2, 'common'),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'water_splash',
        name: '물 튀기기',
        description: '물을 튀겨 공격한다',
        element: 'water'
      }
    ],
    weaknesses: ['electric'],
    resistances: ['fire']
  },

  mushroom_red: {
    id: 'mushroom_red',
    name: '붉은 버섯',
    description: '독을 품은 버섯 몬스터',
    emoji: '🍄',
    _tier: 'common',
    stats: createMonsterStats(3, 'common'),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'spore_attack',
        name: '포자 공격',
        description: '독 포자를 뿌린다'
      },
      {
        type: 'damage',
        damageType: 'magical',
        element: 'poison',
        id: 'poison_spore',
        name: '독 포자',
        description: '독 상태를 유발한다',
        power: 80,
        accuracy: 90,
        mpCost: 15,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 2,
        animation: 'projectile',
        statusEffect: {
          id: 'poison',
          name: '독',
          type: 'debuff',
          damagePerTurn: 10,
          duration: 3,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    weaknesses: ['fire'],
    resistances: ['earth']
  },

  goblin_scout: {
    id: 'goblin_scout',
    name: '고블린 정찰병',
    description: '빠르고 교활한 고블린',
    emoji: '👺',
    _tier: 'common',
    stats: createMonsterStats(4, 'common', { speed: 20 }),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'quick_stab',
        name: '빠른 찌르기',
        description: '재빠르게 찌른다'
      },
      {
        ...SKILL_TEMPLATES.strongAttack,
        id: 'sneak_attack',
        name: '기습 공격',
        description: '치명타율이 높은 공격'
      }
    ]
  },

  wolf_gray: {
    id: 'wolf_gray',
    name: '회색 늑대',
    description: '무리를 지어 사냥하는 늑대',
    emoji: '🐺',
    _tier: 'common',
    stats: createMonsterStats(5, 'common', { attack: 15 }),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'bite',
        name: '물기',
        description: '날카로운 이빨로 문다'
      },
      {
        ...SKILL_TEMPLATES.strongAttack,
        id: 'fierce_bite',
        name: '맹렬한 물기',
        description: '강력하게 물어뜯는다',
        power: 180
      }
    ]
  },

  bat_cave: {
    id: 'bat_cave',
    name: '동굴 박쥐',
    description: '어둠 속에서 공격하는 박쥐',
    emoji: '🦇',
    _tier: 'common',
    stats: createMonsterStats(6, 'common', { evasion: 0.15 }),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'sonic_wave',
        name: '음파 공격',
        description: '초음파로 공격한다',
        damageType: 'magical'
      },
      {
        type: 'debuff',
        id: 'confuse',
        name: '혼란',
        description: '적을 혼란시킨다',
        mpCost: 20,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 3,
        animation: 'debuff',
        power: 0,
        accuracy: 85,
        statusEffect: {
          id: 'confusion',
          name: '혼란',
          type: 'debuff',
          stats: { accuracy: -30 },
          duration: 3,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    weaknesses: ['light'],
    resistances: ['dark']
  },

  // === 중급 몬스터 (레벨 10-20) ===
  orc_warrior: {
    id: 'orc_warrior',
    name: '오크 전사',
    description: '강력한 힘을 가진 오크',
    emoji: '👹',
    _tier: 'common',
    stats: createMonsterStats(10, 'common', { hp: 200, attack: 30 }),
    skills: [
      {
        ...SKILL_TEMPLATES.strongAttack,
        id: 'orc_smash',
        name: '오크 강타',
        description: '무기로 강하게 내리친다',
        power: 200
      },
      {
        ...SKILL_TEMPLATES.buffAttack,
        id: 'war_cry',
        name: '전투 함성',
        description: '공격력을 높인다'
      }
    ]
  },

  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: '스켈레톤 전사',
    description: '죽음에서 되살아난 전사',
    emoji: '💀',
    _tier: 'common',
    stats: createMonsterStats(12, 'common', { defense: 20 }),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'bone_strike',
        name: '뼈 타격',
        description: '뼈로 된 무기로 공격'
      },
      {
        type: 'buff',
        id: 'bone_shield',
        name: '뼈 방패',
        description: '방어력을 높인다',
        mpCost: 25,
        cooldown: 6,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'buff',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'defense_up',
          name: '방어력 상승',
          type: 'buff',
          stats: { defense: 30, magicDefense: 30 },
          duration: 5,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    resistances: ['dark', 'poison'],
    weaknesses: ['light', 'fire']
  },

  harpy: {
    id: 'harpy',
    name: '하피',
    description: '날개를 가진 반인반조 몬스터',
    emoji: '🦅',
    _tier: 'common',
    stats: createMonsterStats(14, 'common', { speed: 25, evasion: 0.2 }),
    skills: [
      {
        ...SKILL_TEMPLATES.basicAttack,
        id: 'claw_attack',
        name: '발톱 공격',
        description: '날카로운 발톱으로 할퀸다'
      },
      {
        type: 'damage',
        damageType: 'physical',
        element: 'wind',
        id: 'wind_slash',
        name: '바람 가르기',
        description: '바람의 칼날로 공격',
        power: 140,
        accuracy: 95,
        mpCost: 20,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 3,
        animation: 'wind-slash'
      }
    ],
    weaknesses: ['electric'],
    resistances: ['earth']
  },

  // === 엘리트 몬스터 ===
  goblin_chief: {
    id: 'goblin_chief',
    name: '고블린 족장',
    description: '고블린들의 리더',
    emoji: '👺',
    _tier: 'elite',
    stats: createMonsterStats(15, 'elite'),
    skills: [
      {
        ...SKILL_TEMPLATES.strongAttack,
        id: 'chief_strike',
        name: '족장의 일격',
        description: '강력한 일격',
        power: 250
      },
      {
        ...SKILL_TEMPLATES.buffAttack,
        id: 'leadership',
        name: '지도력',
        description: '모든 능력치 상승',
        statusEffect: {
          id: 'leadership_buff',
          name: '지도력',
          type: 'buff',
          stats: { attack: 30, defense: 20, speed: 10 },
          duration: 6,
          stackable: false,
          value: 20,
          chance: 100
        }
      },
      {
        type: 'damage',
        damageType: 'physical',
        element: 'neutral',
        id: 'rally_cry',
        name: '집결의 외침',
        description: '연속 공격',
        power: 80,
        accuracy: 95,
        mpCost: 30,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        hitCount: 3,
        animation: 'multi-strike'
      }
    ]
  },

  dark_mage: {
    id: 'dark_mage',
    name: '어둠의 마법사',
    description: '어둠의 마법을 다루는 마법사',
    emoji: '🧙',
    _tier: 'elite',
    stats: createMonsterStats(18, 'elite', { magicAttack: 50, mp: 200 }),
    skills: [
      {
        ...SKILL_TEMPLATES.magicAttack,
        id: 'dark_bolt',
        name: '어둠의 화살',
        description: '어둠 속성 마법 공격',
        element: 'dark',
        power: 150
      },
      {
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        id: 'shadow_explosion',
        name: '그림자 폭발',
        description: '강력한 어둠 마법',
        power: 300,
        accuracy: 85,
        mpCost: 50,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        animation: 'dark-explosion'
      },
      {
        ...SKILL_TEMPLATES.debuffDefense,
        id: 'curse',
        name: '저주',
        description: '모든 능력치 감소',
        statusEffect: {
          id: 'curse',
          name: '저주',
          type: 'debuff',
          stats: {
            attack: -20,
            defense: -20,
            speed: -10,
            accuracy: -20
          },
          duration: 5,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    weaknesses: ['light'],
    resistances: ['dark']
  },

  // === 보스 몬스터 ===
  dragon_red: {
    id: 'dragon_red',
    name: '붉은 용',
    description: '화염을 다루는 강력한 용',
    emoji: '🐉',
    _tier: 'boss',
    stats: createMonsterStats(25, 'boss', { hp: 1000, attack: 80, magicAttack: 80 }),
    skills: [
      {
        ...SKILL_TEMPLATES.strongAttack,
        id: 'dragon_claw',
        name: '용의 발톱',
        description: '거대한 발톱으로 할퀸다',
        power: 300
      },
      {
        type: 'damage',
        damageType: 'magical',
        element: 'fire',
        id: 'fire_breath',
        name: '화염 브레스',
        description: '강력한 화염을 내뿜는다',
        power: 400,
        accuracy: 90,
        mpCost: 80,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        animation: 'fire-breath'
      },
      {
        type: 'buff',
        id: 'dragon_scales',
        name: '용의 비늘',
        description: '방어력 대폭 상승',
        mpCost: 50,
        cooldown: 10,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'buff',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'dragon_scales',
          name: '용의 비늘',
          type: 'buff',
          stats: { defense: 100, magicDefense: 100 },
          duration: 8,
          stackable: false,
          value: 20,
          chance: 100
        }
      },
      {
        ...SKILL_TEMPLATES.healSelf,
        id: 'regeneration',
        name: '재생',
        description: 'HP를 회복한다',
        healAmount: 300
      }
    ],
    weaknesses: ['ice', 'water'],
    resistances: ['fire']
  },

  lich_king: {
    id: 'lich_king',
    name: '리치 킹',
    description: '죽음을 초월한 언데드의 왕',
    emoji: '👑',
    _tier: 'boss',
    stats: createMonsterStats(30, 'boss', { magicAttack: 100, magicDefense: 80 }),
    skills: [
      {
        ...SKILL_TEMPLATES.magicAttack,
        id: 'death_ray',
        name: '죽음의 광선',
        description: '즉사 효과가 있는 광선',
        element: 'dark',
        power: 500,
        accuracy: 80
      },
      {
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        id: 'necrotic_wave',
        name: '네크로틱 웨이브',
        description: '죽음의 파동',
        power: 350,
        accuracy: 95,
        mpCost: 100,
        cooldown: 6,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        animation: 'dark-wave',
        statusEffect: {
          id: 'necrosis',
          name: '괴사',
          type: 'debuff',
          damagePerTurn: 50,
          duration: 5,
          stackable: true,
          value: 50,
          chance: 100
        }
      },
      {
        type: 'buff',
        id: 'undead_army',
        name: '언데드 군단',
        description: '언데드를 소환한다',
        mpCost: 150,
        cooldown: 10,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'summon',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'undead_army',
          name: '언데드 군단',
          type: 'buff',
          stats: { attack: 50, defense: 50 },
          duration: 10,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    weaknesses: ['light', 'fire'],
    resistances: ['dark', 'ice', 'poison']
  }
}

// ID로 몬스터 가져오기
export function getMonsterById(id: string): MonsterData | undefined {
  return MONSTER_DATABASE[id]
}

// 티어별 몬스터 목록
export function getMonstersByTier(tier: MonsterTier): MonsterData[] {
  return Object.values(MONSTER_DATABASE).filter(m => m._tier === tier)
}

// 레벨 범위로 몬스터 목록
export function getMonstersByLevelRange(minLevel: number, maxLevel: number): MonsterData[] {
  return Object.values(MONSTER_DATABASE).filter(
    m => m.stats.level >= minLevel && m.stats.level <= maxLevel
  )
}

// 랜덤 몬스터 선택
export function getRandomMonster(options?: {
  tier?: MonsterTier
  minLevel?: number
  maxLevel?: number
}): MonsterData {
  let monsters = Object.values(MONSTER_DATABASE)

  if (options?.tier) {
    monsters = monsters.filter(m => m._tier === options.tier)
  }

  if (options?.minLevel !== undefined) {
    monsters = monsters.filter(m => m.stats.level >= options.minLevel!)
  }

  if (options?.maxLevel !== undefined) {
    monsters = monsters.filter(m => m.stats.level <= options.maxLevel!)
  }

  return monsters[Math.floor(Math.random() * monsters.length)]
}
