import type {
  MonsterData,
  MonsterTier,
  CharacterStats,
  BattleSkill
} from '@/lib/types/battle-extended'
import { SKILL_TEMPLATES } from './monster-database'

// 레벨에 따른 스탯 스케일링 - 강화된 버전
function scaleMonsterStats(
  baseStats: CharacterStats,
  level: number,
  tier: MonsterTier
): CharacterStats {
  // 레벨이 높을수록 더 큰 증가율 (기하급수적 성장)
  const levelMultiplier = Math.pow(1.25, (level - 1) / 5) // 5레벨마다 25% 증가
  
  // 티어별 보너스도 상향
  const tierBonus = {
    common: 1,
    elite: 1.5,
    boss: 2.2,
    legendary: 3.0
  }[tier]

  // 던전 난이도에 따른 추가 보너스 (고레벨 던전일수록 더 강함)
  const difficultyBonus = 1 + Math.floor(level / 10) * 0.3

  return {
    ...baseStats,
    level,
    hp: Math.floor(baseStats.hp * levelMultiplier * tierBonus * difficultyBonus),
    maxHp: Math.floor(baseStats.maxHp * levelMultiplier * tierBonus * difficultyBonus),
    mp: Math.floor(baseStats.mp * levelMultiplier * tierBonus),
    maxMp: Math.floor(baseStats.maxMp * levelMultiplier * tierBonus),
    attack: Math.floor(baseStats.attack * levelMultiplier * tierBonus * difficultyBonus),
    magicAttack: Math.floor(baseStats.magicAttack * levelMultiplier * tierBonus * difficultyBonus),
    defense: Math.floor(baseStats.defense * levelMultiplier * tierBonus * difficultyBonus),
    magicDefense: Math.floor(baseStats.magicDefense * levelMultiplier * tierBonus * difficultyBonus),
    speed: Math.floor(baseStats.speed * (1 + (level - 1) * 0.08)),
    accuracy: Math.min(100, baseStats.accuracy + level * 0.5),
    evasion: Math.min(0.5, baseStats.evasion + level * 0.005),
    critical: Math.min(0.5, baseStats.critical + level * 0.01),
    criticalDamage: baseStats.criticalDamage + level * 0.02
  }
}

// 몬스터 특성 시스템
export interface MonsterTrait {
  id: string
  name: string
  description: string
  effects: {
    statModifiers?: Partial<CharacterStats>
    combatModifiers?: {
      damageReduction?: number
      damageBonus?: number
      healingBonus?: number
      criticalBonus?: number
    }
    specialAbilities?: string[]
  }
}

export const MONSTER_TRAITS: Record<string, MonsterTrait> = {
  regenerating: {
    id: 'regenerating',
    name: '재생',
    description: '매 턴 HP를 회복한다',
    effects: {
      specialAbilities: ['regen_10_per_turn']
    }
  },
  armored: {
    id: 'armored',
    name: '중장갑',
    description: '물리 피해를 감소시킨다',
    effects: {
      statModifiers: { defense: 50 },
      combatModifiers: { damageReduction: 0.2 }
    }
  },
  swift: {
    id: 'swift',
    name: '신속',
    description: '빠른 속도와 높은 회피율',
    effects: {
      statModifiers: { speed: 30, evasion: 0.2 }
    }
  },
  venomous: {
    id: 'venomous',
    name: '맹독',
    description: '공격 시 독 효과 부여',
    effects: {
      specialAbilities: ['poison_on_hit']
    }
  },
  berserker: {
    id: 'berserker',
    name: '광폭화',
    description: 'HP가 낮을수록 공격력 증가',
    effects: {
      specialAbilities: ['berserk_mode']
    }
  },
  ethereal: {
    id: 'ethereal',
    name: '에테르',
    description: '물리 공격에 대한 저항',
    effects: {
      statModifiers: { evasion: 0.3 },
      combatModifiers: { damageReduction: 0.3 }
    }
  },
  elemental_affinity: {
    id: 'elemental_affinity',
    name: '원소 친화',
    description: '특정 원소 공격 강화',
    effects: {
      combatModifiers: { damageBonus: 0.3 }
    }
  }
}

// 확장된 몬스터 데이터베이스
export const EXTENDED_MONSTER_DATABASE: Record<string, MonsterData> = {
  // === 특수 슬라임 계열 ===
  slime_king: {
    id: 'slime_king',
    name: '슬라임 킹',
    description: '모든 슬라임의 왕',
    emoji: '👑',
    _tier: 'boss',
    traits: ['regenerating', 'armored'],
    stats: scaleMonsterStats({
      level: 20,
      hp: 800,
      maxHp: 800,
      mp: 200,
      maxMp: 200,
      attack: 60,
      magicAttack: 50,
      defense: 70,
      magicDefense: 60,
      speed: 15,
      accuracy: 90,
      evasion: 0.1,
      critical: 0.15,
      criticalDamage: 2.0,
      critRate: 0.15,
      dodgeRate: 0.1
    }, 20, 'boss'),
    skills: [
      {
        id: 'royal_bounce',
        name: '로열 바운스',
        description: '거대한 몸으로 압살한다',
        type: 'damage',
        damageType: 'physical',
        element: 'neutral',
        power: 300,
        accuracy: 95,
        mpCost: 30,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'all',
        range: 3,
        animation: 'earthquake'
      },
      {
        id: 'slime_division',
        name: '분열',
        description: '작은 슬라임으로 분열한다',
        type: 'buff',
        mpCost: 50,
        cooldown: 8,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'summon',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'division',
          name: '분열',
          type: 'buff',
          stats: { evasion: 0.5, speed: 20 },
          duration: 5,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    resistances: ['water', 'poison'],
    weaknesses: ['fire', 'ice']
  },

  // === 원소 정령 계열 ===
  fire_elemental: {
    id: 'fire_elemental',
    name: '화염 정령',
    description: '순수한 화염으로 이루어진 정령',
    emoji: '🔥',
    _tier: 'elite',
    traits: ['elemental_affinity'],
    stats: scaleMonsterStats({
      level: 15,
      hp: 300,
      maxHp: 300,
      mp: 150,
      maxMp: 150,
      attack: 40,
      magicAttack: 80,
      defense: 30,
      magicDefense: 50,
      speed: 25,
      accuracy: 95,
      evasion: 0.15,
      critical: 0.2,
      criticalDamage: 2.0,
      critRate: 0.2,
      dodgeRate: 0.15
    }, 15, 'elite'),
    skills: [
      {
        id: 'flame_burst',
        name: '화염 폭발',
        description: '화염을 폭발시킨다',
        type: 'damage',
        damageType: 'magical',
        element: 'fire',
        power: 200,
        accuracy: 90,
        mpCost: 25,
        cooldown: 2,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        animation: 'fire-explosion'
      },
      {
        id: 'ignite',
        name: '점화',
        description: '적을 불태운다',
        type: 'damage',
        damageType: 'magical',
        element: 'fire',
        power: 100,
        accuracy: 100,
        mpCost: 15,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 4,
        animation: 'fire',
        statusEffect: {
          id: 'burn',
          name: '화상',
          type: 'debuff',
          damagePerTurn: 30,
          duration: 4,
          stackable: true,
          value: 30,
          chance: 100
        }
      }
    ],
    resistances: ['fire'],
    weaknesses: ['water', 'ice']
  },

  ice_elemental: {
    id: 'ice_elemental',
    name: '얼음 정령',
    description: '차가운 얼음으로 이루어진 정령',
    emoji: '❄️',
    _tier: 'elite',
    traits: ['elemental_affinity', 'armored'],
    stats: scaleMonsterStats({
      level: 15,
      hp: 350,
      maxHp: 350,
      mp: 120,
      maxMp: 120,
      attack: 35,
      magicAttack: 70,
      defense: 60,
      magicDefense: 40,
      speed: 18,
      accuracy: 95,
      evasion: 0.1,
      critical: 0.15,
      criticalDamage: 2.0,
      critRate: 0.15,
      dodgeRate: 0.1
    }, 15, 'elite'),
    skills: [
      {
        id: 'ice_spear',
        name: '얼음 창',
        description: '얼음 창을 발사한다',
        type: 'damage',
        damageType: 'magical',
        element: 'ice',
        power: 180,
        accuracy: 95,
        mpCost: 20,
        cooldown: 2,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        animation: 'ice-projectile'
      },
      {
        id: 'freeze',
        name: '동결',
        description: '적을 얼린다',
        type: 'debuff',
        mpCost: 30,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 3,
        animation: 'freeze',
        power: 0,
        accuracy: 85,
        statusEffect: {
          id: 'frozen',
          name: '동결',
          type: 'debuff',
          stats: { speed: -50 },
          skipTurn: true,
          duration: 2,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    resistances: ['ice', 'water'],
    weaknesses: ['fire', 'electric']
  },

  // === 고대 수호자 계열 ===
  stone_guardian: {
    id: 'stone_guardian',
    name: '돌 수호자',
    description: '고대 유적을 지키는 거대한 골렘',
    emoji: '🗿',
    _tier: 'boss',
    traits: ['armored', 'regenerating'],
    stats: scaleMonsterStats({
      level: 25,
      hp: 1200,
      maxHp: 1200,
      mp: 100,
      maxMp: 100,
      attack: 90,
      magicAttack: 30,
      defense: 120,
      magicDefense: 80,
      speed: 10,
      accuracy: 85,
      evasion: 0.05,
      critical: 0.1,
      criticalDamage: 2.5,
      critRate: 0.1,
      dodgeRate: 0.05
    }, 25, 'boss'),
    skills: [
      {
        id: 'stone_crush',
        name: '암석 분쇄',
        description: '거대한 주먹으로 내리친다',
        type: 'damage',
        damageType: 'physical',
        element: 'earth',
        power: 350,
        accuracy: 90,
        mpCost: 20,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        animation: 'earthquake'
      },
      {
        id: 'earthquake',
        name: '지진',
        description: '대지를 뒤흔든다',
        type: 'damage',
        damageType: 'physical',
        element: 'earth',
        power: 250,
        accuracy: 100,
        mpCost: 40,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        animation: 'earthquake'
      },
      {
        id: 'stone_skin',
        name: '암석 피부',
        description: '방어력을 극대화한다',
        type: 'buff',
        mpCost: 30,
        cooldown: 8,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'buff',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'stone_skin',
          name: '암석 피부',
          type: 'buff',
          stats: { defense: 200, magicDefense: 100 },
          damageReduction: 0.5,
          duration: 5,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ],
    resistances: ['earth', 'physical'],
    weaknesses: ['water', 'ice']
  },

  // === 마계 생물 계열 ===
  demon_lord: {
    id: 'demon_lord',
    name: '데몬 로드',
    description: '마계의 군주',
    emoji: '😈',
    _tier: 'legendary',
    traits: ['berserker', 'regenerating'],
    stats: scaleMonsterStats({
      level: 35,
      hp: 1500,
      maxHp: 1500,
      mp: 300,
      maxMp: 300,
      attack: 120,
      magicAttack: 100,
      defense: 80,
      magicDefense: 90,
      speed: 35,
      accuracy: 95,
      evasion: 0.2,
      critical: 0.3,
      criticalDamage: 3.0,
      critRate: 0.3,
      dodgeRate: 0.2
    }, 35, 'legendary'),
    skills: [
      {
        id: 'hellfire',
        name: '지옥불',
        description: '지옥의 불꽃으로 태운다',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 500,
        accuracy: 90,
        mpCost: 60,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        animation: 'hellfire'
      },
      {
        id: 'demonic_presence',
        name: '마왕의 위압',
        description: '적을 공포에 떨게 한다',
        type: 'debuff',
        mpCost: 40,
        cooldown: 6,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        animation: 'fear',
        power: 0,
        accuracy: 100,
        statusEffect: {
          id: 'fear',
          name: '공포',
          type: 'debuff',
          stats: { attack: -50, defense: -50, accuracy: -30 },
          skipTurn: true,
          duration: 3,
          stackable: false,
          value: 20,
          chance: 100
        }
      },
      {
        id: 'soul_drain',
        name: '영혼 흡수',
        description: '적의 생명력을 흡수한다',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 300,
        accuracy: 95,
        mpCost: 50,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        animation: 'life-drain',
        lifeSteal: 0.5
      }
    ],
    resistances: ['dark', 'fire'],
    weaknesses: ['light', 'holy']
  },

  // === 특수 보스 계열 ===
  mimic: {
    id: 'mimic',
    name: '미믹',
    description: '보물상자로 위장한 몬스터',
    emoji: '📦',
    _tier: 'elite',
    traits: ['swift', 'venomous'],
    stats: scaleMonsterStats({
      level: 18,
      hp: 400,
      maxHp: 400,
      mp: 100,
      maxMp: 100,
      attack: 70,
      magicAttack: 40,
      defense: 50,
      magicDefense: 40,
      speed: 40,
      accuracy: 100,
      evasion: 0.3,
      critical: 0.25,
      criticalDamage: 2.5,
      critRate: 0.25,
      dodgeRate: 0.3
    }, 18, 'elite'),
    skills: [
      {
        id: 'surprise_bite',
        name: '기습 물기',
        description: '갑작스럽게 물어뜯는다',
        type: 'damage',
        damageType: 'physical',
        element: 'neutral',
        power: 250,
        accuracy: 100,
        mpCost: 0,
        cooldown: 2,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        animation: 'bite',
        criticalBonus: 0.3
      },
      {
        id: 'sticky_tongue',
        name: '끈적한 혀',
        description: '혀로 휘감아 움직임을 봉인한다',
        type: 'debuff',
        mpCost: 20,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'single',
        range: 3,
        animation: 'bind',
        power: 0,
        accuracy: 90,
        statusEffect: {
          id: 'bind',
          name: '속박',
          type: 'debuff',
          stats: { speed: -80, evasion: -0.5 },
          duration: 3,
          stackable: false,
          value: 20,
          chance: 100
        }
      }
    ]
  }
}

// 레벨에 따라 몬스터 스탯 조정
export function createScaledMonster(
  monsterId: string,
  level: number,
  tierOverride?: MonsterTier
): MonsterData | undefined {
  const baseMonster = EXTENDED_MONSTER_DATABASE[monsterId]
  if (!baseMonster) return undefined

  const tier = tierOverride || baseMonster._tier
  const scaledStats = scaleMonsterStats(baseMonster.stats, level, tier)

  return {
    ...baseMonster,
    _tier: tier,
    stats: scaledStats
  }
}

// 특성에 따른 몬스터 능력 적용
export function applyMonsterTraits(
  monster: MonsterData,
  traits?: string[]
): MonsterData {
  if (!traits || traits.length === 0) return monster

  let modifiedMonster = { ...monster }

  traits.forEach(traitId => {
    const trait = MONSTER_TRAITS[traitId]
    if (!trait) return

    // 스탯 수정자 적용
    if (trait.effects.statModifiers) {
      modifiedMonster.stats = {
        ...modifiedMonster.stats,
        ...Object.entries(trait.effects.statModifiers).reduce((acc, [key, value]) => {
          const statKey = key as keyof CharacterStats
          if (typeof modifiedMonster.stats[statKey] === 'number' && typeof value === 'number') {
            acc[statKey] = (modifiedMonster.stats[statKey] as number) + value
          }
          return acc
        }, {} as Partial<CharacterStats>)
      }
    }
  })

  return modifiedMonster
}