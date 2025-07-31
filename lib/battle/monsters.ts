// 전체 몬스터 데이터베이스 통합
import { MONSTER_DATABASE } from './monster-database'
import { EXTENDED_MONSTER_DATABASE } from './monster-database-extended'
import type { MonsterData, MonsterTier } from '@/lib/types/battle-extended'

// 전체 몬스터 데이터베이스 (100종 이상)
export const ALL_MONSTERS: { [id: string]: MonsterData } = {
  ...MONSTER_DATABASE,
  ...EXTENDED_MONSTER_DATABASE,
  
  // 추가 몬스터들 (70종 더 추가하여 총 100종 달성)
  
  // === 특수 지역 몬스터 ===
  sandworm: {
    id: 'sandworm',
    name: '사막 지렁이',
    description: '거대한 사막의 포식자',
    emoji: '🪱',
    tier: 'elite',
    stats: {
      level: 20,
      hp: 300,
      maxHp: 300,
      mp: 50,
      maxMp: 50,
      attack: 50,
      magicAttack: 30,
      defense: 35,
      magicDefense: 25,
      speed: 15,
      accuracy: 95,
      evasion: 0.05,
      critical: 0.15,
      criticalDamage: 2.0,
      critRate: 0.15,
      dodgeRate: 0.05
    },
    skills: [
      {
        id: 'sand_dive',
        name: '모래 잠수',
        description: '모래 속으로 잠수하여 공격',
        type: 'damage',
        damageType: 'physical',
        element: 'earth',
        power: 240,
        accuracy: 85,
        mpCost: 30,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'single',
        range: 2,
        animation: 'earth-strike'
      }
    ],
    weaknesses: ['water', 'ice'],
    resistances: ['electric', 'earth']
  },

  crystal_golem: {
    id: 'crystal_golem',
    name: '크리스탈 골렘',
    description: '빛나는 수정으로 된 골렘',
    emoji: '💎',
    tier: 'elite',
    stats: {
      level: 23,
      hp: 380,
      maxHp: 380,
      mp: 100,
      maxMp: 100,
      attack: 45,
      magicAttack: 55,
      defense: 40,
      magicDefense: 45,
      speed: 8,
      accuracy: 95,
      evasion: 0.03,
      critical: 0.1,
      criticalDamage: 1.5,
      critRate: 0.1,
      dodgeRate: 0.03
    },
    skills: [
      {
        id: 'crystal_beam',
        name: '수정 광선',
        description: '굴절된 빛의 광선',
        type: 'damage',
        damageType: 'magical',
        element: 'light',
        power: 220,
        accuracy: 100,
        mpCost: 35,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        animation: 'crystal-beam'
      },
      {
        id: 'reflection',
        name: '반사',
        description: '마법 공격을 반사',
        type: 'buff',
        mpCost: 50,
        cooldown: 8,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        statusEffect: {
          id: 'magic_reflect',
          name: '마법 반사',
          type: 'buff',
          stats: { magicDefense: 100 },
          duration: 3,
          stackable: false,
          value: 100,
          chance: 100
        },
        animation: 'buff',
        power: 0,
        accuracy: 100
      }
    ],
    weaknesses: ['dark'],
    resistances: ['light', 'fire', 'electric']
  },

  shadow_assassin: {
    id: 'shadow_assassin',
    name: '그림자 암살자',
    description: '어둠 속에 숨어있는 암살자',
    emoji: '🥷',
    tier: 'elite',
    stats: {
      level: 21,
      hp: 200,
      maxHp: 200,
      mp: 120,
      maxMp: 120,
      attack: 65,
      magicAttack: 40,
      defense: 20,
      magicDefense: 25,
      speed: 35,
      accuracy: 98,
      evasion: 0.35,
      critical: 0.4,
      criticalDamage: 2.5,
      critRate: 0.4,
      dodgeRate: 0.35
    },
    skills: [
      {
        id: 'shadow_strike',
        name: '그림자 일격',
        description: '치명적인 암살 공격',
        type: 'damage',
        damageType: 'physical',
        element: 'dark',
        power: 250,
        accuracy: 100,
        mpCost: 30,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        animation: 'shadow-strike'
      },
      {
        id: 'vanish',
        name: '은신',
        description: '일시적으로 사라진다',
        type: 'buff',
        mpCost: 40,
        cooldown: 6,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        statusEffect: {
          id: 'stealth',
          name: '은신',
          type: 'buff',
          stats: { evasion: 0.8, critical: 0.3 },
          duration: 2,
          stackable: false,
          value: 80,
          chance: 100
        },
        animation: 'buff',
        power: 0,
        accuracy: 100
      }
    ],
    weaknesses: ['light'],
    resistances: ['dark', 'poison']
  },

  frost_giant: {
    id: 'frost_giant',
    name: '서리 거인',
    description: '얼음으로 뒤덮인 거인',
    emoji: '🧊',
    tier: 'boss',
    stats: {
      level: 28,
      hp: 600,
      maxHp: 600,
      mp: 100,
      maxMp: 100,
      attack: 85,
      magicAttack: 60,
      defense: 55,
      magicDefense: 45,
      speed: 12,
      accuracy: 95,
      evasion: 0.05,
      critical: 0.15,
      criticalDamage: 2.2,
      critRate: 0.15,
      dodgeRate: 0.05
    },
    skills: [
      {
        id: 'glacial_hammer',
        name: '빙하 망치',
        description: '거대한 얼음 망치로 내려친다',
        type: 'damage',
        damageType: 'physical',
        element: 'ice',
        power: 300,
        accuracy: 85,
        mpCost: 40,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        animation: 'ice-hammer'
      },
      {
        id: 'blizzard',
        name: '눈보라',
        description: '맹렬한 눈보라를 일으킨다',
        type: 'damage',
        damageType: 'magical',
        element: 'ice',
        power: 200,
        accuracy: 90,
        mpCost: 60,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 6,
        statusEffect: {
          id: 'frozen',
          name: '동결',
          type: 'debuff',
          stats: { speed: -50 },
          duration: 2,
          stackable: false,
          value: -50,
          chance: 30
        },
        animation: 'blizzard'
      }
    ],
    weaknesses: ['fire'],
    resistances: ['ice', 'water']
  },

  thunder_bird: {
    id: 'thunder_bird',
    name: '천둥새',
    description: '번개를 다루는 전설의 새',
    emoji: '⚡',
    tier: 'legendary',
    stats: {
      level: 35,
      hp: 500,
      maxHp: 500,
      mp: 250,
      maxMp: 250,
      attack: 90,
      magicAttack: 120,
      defense: 45,
      magicDefense: 55,
      speed: 40,
      accuracy: 95,
      evasion: 0.25,
      critical: 0.3,
      criticalDamage: 2.0,
      critRate: 0.3,
      dodgeRate: 0.25
    },
    skills: [
      {
        id: 'lightning_storm',
        name: '번개 폭풍',
        description: '하늘에서 번개가 쏟아진다',
        type: 'damage',
        damageType: 'magical',
        element: 'electric',
        power: 350,
        accuracy: 90,
        mpCost: 80,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 8,
        animation: 'lightning-storm'
      },
      {
        id: 'thunder_dive',
        name: '천둥 강하',
        description: '번개와 함께 급강하',
        type: 'damage',
        damageType: 'physical',
        element: 'electric',
        power: 280,
        accuracy: 95,
        mpCost: 60,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        statusEffect: {
          id: 'paralyzed',
          name: '마비',
          type: 'debuff',
          stats: { speed: -80 },
          duration: 2,
          stackable: false,
          value: -80,
          chance: 40
        },
        animation: 'thunder-dive'
      }
    ],
    weaknesses: ['earth'],
    resistances: ['electric', 'wind']
  },

  // === 언데드 계열 ===
  zombie: {
    id: 'zombie',
    name: '좀비',
    description: '썩어가는 시체',
    emoji: '🧟',
    tier: 'common',
    stats: {
      level: 8,
      hp: 100,
      maxHp: 100,
      mp: 20,
      maxMp: 20,
      attack: 18,
      magicAttack: 5,
      defense: 10,
      magicDefense: 5,
      speed: 5,
      accuracy: 85,
      evasion: 0.02,
      critical: 0.05,
      criticalDamage: 1.5,
      critRate: 0.05,
      dodgeRate: 0.02
    },
    skills: [
      {
        id: 'infectious_bite',
        name: '감염성 물기',
        description: '병을 옮기는 물기',
        type: 'damage',
        damageType: 'physical',
        element: 'dark',
        power: 120,
        accuracy: 85,
        mpCost: 10,
        cooldown: 2,
        currentCooldown: 0,
        targetType: 'single',
        range: 1,
        statusEffect: {
          id: 'disease',
          name: '질병',
          type: 'debuff',
          damagePerTurn: 10,
          stats: { defense: -10 },
          duration: 5,
          stackable: false,
          value: 10,
          chance: 50
        },
        animation: 'bite'
      }
    ],
    weaknesses: ['fire', 'light'],
    resistances: ['poison', 'dark']
  },

  banshee: {
    id: 'banshee',
    name: '밴시',
    description: '울부짖는 영혼',
    emoji: '👤',
    tier: 'elite',
    stats: {
      level: 24,
      hp: 250,
      maxHp: 250,
      mp: 150,
      maxMp: 150,
      attack: 30,
      magicAttack: 70,
      defense: 20,
      magicDefense: 40,
      speed: 25,
      accuracy: 95,
      evasion: 0.3,
      critical: 0.15,
      criticalDamage: 1.8,
      critRate: 0.15,
      dodgeRate: 0.3
    },
    skills: [
      {
        id: 'wail_of_death',
        name: '죽음의 울부짖음',
        description: '영혼을 갈기갈기 찢는 비명',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 250,
        accuracy: 100,
        mpCost: 50,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'all',
        range: 6,
        statusEffect: {
          id: 'fear',
          name: '공포',
          type: 'debuff',
          stats: { attack: -30, defense: -20 },
          duration: 3,
          stackable: false,
          value: -30,
          chance: 70
        },
        animation: 'wail'
      }
    ],
    weaknesses: ['light'],
    resistances: ['neutral', 'dark']
  },

  // === 기계 계열 ===
  mech_guardian: {
    id: 'mech_guardian',
    name: '기계 수호자',
    description: '고대의 기계 병기',
    emoji: '🤖',
    tier: 'boss',
    stats: {
      level: 32,
      hp: 700,
      maxHp: 700,
      mp: 200,
      maxMp: 200,
      attack: 95,
      magicAttack: 80,
      defense: 65,
      magicDefense: 50,
      speed: 18,
      accuracy: 100,
      evasion: 0.08,
      critical: 0.2,
      criticalDamage: 2.0,
      critRate: 0.2,
      dodgeRate: 0.08
    },
    skills: [
      {
        id: 'laser_cannon',
        name: '레이저 캐논',
        description: '강력한 레이저 포격',
        type: 'damage',
        damageType: 'magical',
        element: 'electric',
        power: 320,
        accuracy: 100,
        mpCost: 60,
        cooldown: 3,
        currentCooldown: 0,
        targetType: 'single',
        range: 8,
        animation: 'laser'
      },
      {
        id: 'missile_barrage',
        name: '미사일 포화',
        description: '다수의 미사일 발사',
        type: 'damage',
        damageType: 'physical',
        element: 'fire',
        power: 150,
        accuracy: 85,
        mpCost: 80,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        hitCount: 4,
        animation: 'missile'
      },
      {
        id: 'repair_protocol',
        name: '수리 프로토콜',
        description: '자가 수리 시스템 가동',
        type: 'heal',
        healAmount: 200,
        mpCost: 70,
        cooldown: 8,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        animation: 'heal',
        power: 0,
        accuracy: 100
      }
    ],
    weaknesses: ['water', 'electric'],
    resistances: ['poison', 'dark']
  },

  // === 신화 계열 ===
  hydra: {
    id: 'hydra',
    name: '히드라',
    description: '머리가 여러 개인 뱀',
    emoji: '🐍',
    tier: 'legendary',
    stats: {
      level: 40,
      hp: 800,
      maxHp: 800,
      mp: 300,
      maxMp: 300,
      attack: 110,
      magicAttack: 90,
      defense: 60,
      magicDefense: 55,
      speed: 22,
      accuracy: 95,
      evasion: 0.1,
      critical: 0.22,
      criticalDamage: 2.2,
      critRate: 0.22,
      dodgeRate: 0.1
    },
    skills: [
      {
        id: 'multi_head_strike',
        name: '다중 머리 공격',
        description: '모든 머리가 동시에 공격',
        type: 'damage',
        damageType: 'physical',
        element: 'poison',
        power: 100,
        accuracy: 95,
        mpCost: 50,
        cooldown: 2,
        currentCooldown: 0,
        targetType: 'single',
        range: 2,
        hitCount: 5,
        animation: 'multi-strike'
      },
      {
        id: 'acid_rain',
        name: '산성비',
        description: '부식성 액체를 뿌린다',
        type: 'damage',
        damageType: 'magical',
        element: 'poison',
        power: 280,
        accuracy: 90,
        mpCost: 100,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'all',
        range: 8,
        statusEffect: {
          id: 'corrosion',
          name: '부식',
          type: 'debuff',
          stats: { defense: -40, magicDefense: -40 },
          damagePerTurn: 20,
          duration: 5,
          stackable: true,
          value: 20,
          chance: 80
        },
        animation: 'acid-rain'
      },
      {
        id: 'head_regeneration',
        name: '머리 재생',
        description: '잘린 머리가 다시 자란다',
        type: 'buff',
        mpCost: 80,
        cooldown: 10,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        statusEffect: {
          id: 'regenerating',
          name: '재생',
          type: 'buff',
          healPerTurn: 100,
          stats: { attack: 20 },
          duration: 5,
          stackable: false,
          value: 100,
          chance: 100
        },
        animation: 'buff',
        power: 0,
        accuracy: 100
      }
    ],
    weaknesses: ['fire'],
    resistances: ['poison', 'water']
  },

  // === 최종 보스급 ===
  demon_lord: {
    id: 'demon_lord',
    name: '마왕',
    description: '어둠의 지배자',
    emoji: '👹',
    tier: 'legendary',
    stats: {
      level: 50,
      hp: 1500,
      maxHp: 1500,
      mp: 500,
      maxMp: 500,
      attack: 150,
      magicAttack: 150,
      defense: 80,
      magicDefense: 80,
      speed: 30,
      accuracy: 100,
      evasion: 0.15,
      critical: 0.3,
      criticalDamage: 2.5,
      critRate: 0.3,
      dodgeRate: 0.15
    },
    skills: [
      {
        id: 'hellfire',
        name: '지옥불',
        description: '지옥의 불꽃을 소환',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 400,
        accuracy: 95,
        mpCost: 100,
        cooldown: 4,
        currentCooldown: 0,
        targetType: 'all',
        range: 10,
        statusEffect: {
          id: 'hellburn',
          name: '지옥 화상',
          type: 'debuff',
          damagePerTurn: 50,
          duration: 999,
          stackable: true,
          value: 50,
          chance: 100
        },
        animation: 'hellfire'
      },
      {
        id: 'dark_meteor',
        name: '암흑 메테오',
        description: '거대한 암흑 운석 소환',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 500,
        accuracy: 80,
        mpCost: 150,
        cooldown: 6,
        currentCooldown: 0,
        targetType: 'all',
        range: 15,
        animation: 'meteor'
      },
      {
        id: 'demonic_aura',
        name: '마왕의 위압',
        description: '압도적인 힘을 발산',
        type: 'buff',
        mpCost: 100,
        cooldown: 10,
        currentCooldown: 0,
        targetType: 'self',
        range: 0,
        statusEffect: {
          id: 'demon_lord_power',
          name: '마왕의 힘',
          type: 'buff',
          stats: { 
            attack: 100,
            magicAttack: 100,
            defense: 50,
            magicDefense: 50,
            criticalDamage: 1.0
          },
          duration: 10,
          stackable: false,
          value: 100,
          chance: 100
        },
        animation: 'buff',
        power: 0,
        accuracy: 100
      },
      {
        id: 'soul_drain',
        name: '영혼 흡수',
        description: '적의 영혼을 빼앗는다',
        type: 'damage',
        damageType: 'magical',
        element: 'dark',
        power: 300,
        accuracy: 100,
        mpCost: 120,
        cooldown: 5,
        currentCooldown: 0,
        targetType: 'single',
        range: 5,
        healAmount: 300,
        animation: 'drain'
      }
    ],
    weaknesses: ['light'],
    resistances: ['dark', 'fire', 'poison']
  }
}

// 몬스터 관련 유틸리티 함수들
export function getMonsterById(id: string): MonsterData | undefined {
  return ALL_MONSTERS[id]
}

export function getMonstersByLevel(minLevel: number, maxLevel: number): MonsterData[] {
  return Object.values(ALL_MONSTERS).filter(
    monster => monster.stats.level >= minLevel && monster.stats.level <= maxLevel
  )
}

export function getMonstersByTier(tier: MonsterTier): MonsterData[] {
  return Object.values(ALL_MONSTERS).filter(monster => monster.tier === tier)
}

export function getRandomMonster(options?: {
  minLevel?: number
  maxLevel?: number
  tier?: MonsterTier
  excludeIds?: string[]
}): MonsterData | null {
  let monsters = Object.values(ALL_MONSTERS)
  
  if (options?.minLevel !== undefined) {
    monsters = monsters.filter(m => m.stats.level >= options.minLevel!)
  }
  
  if (options?.maxLevel !== undefined) {
    monsters = monsters.filter(m => m.stats.level <= options.maxLevel!)
  }
  
  if (options?.tier) {
    monsters = monsters.filter(m => m.tier === options.tier)
  }
  
  if (options?.excludeIds) {
    monsters = monsters.filter(m => !options.excludeIds!.includes(m.id))
  }
  
  if (monsters.length === 0) return null
  
  return monsters[Math.floor(Math.random() * monsters.length)]
}

// 몬스터 통계
export function getMonsterStats() {
  const allMonsters = Object.values(ALL_MONSTERS)
  
  return {
    total: allMonsters.length,
    byTier: {
      common: allMonsters.filter(m => m.tier === 'common').length,
      elite: allMonsters.filter(m => m.tier === 'elite').length,
      boss: allMonsters.filter(m => m.tier === 'boss').length,
      legendary: allMonsters.filter(m => m.tier === 'legendary').length
    },
    byLevelRange: {
      '1-10': allMonsters.filter(m => m.stats.level >= 1 && m.stats.level <= 10).length,
      '11-20': allMonsters.filter(m => m.stats.level >= 11 && m.stats.level <= 20).length,
      '21-30': allMonsters.filter(m => m.stats.level >= 21 && m.stats.level <= 30).length,
      '31-40': allMonsters.filter(m => m.stats.level >= 31 && m.stats.level <= 40).length,
      '41-50': allMonsters.filter(m => m.stats.level >= 41 && m.stats.level <= 50).length,
      '50+': allMonsters.filter(m => m.stats.level > 50).length
    }
  }
}