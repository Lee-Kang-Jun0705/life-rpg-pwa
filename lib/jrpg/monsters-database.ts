// JRPG 몬스터 데이터베이스
import type { MonsterDefinition } from './types'
import { StatusEffectType } from './types'

export const MONSTER_DATABASE: Record<string, MonsterDefinition> = {
  // 초급 몬스터
  'monster_001': {
    id: 'monster_001',
    name: '슬라임',
    level: 1,
    stats: {
      hp: 50,
      mp: 10,
      attack: 10,
      defense: 5,
      speed: 3,
      magicPower: 5,
      magicResist: 5
    },
    skills: ['skill_001'],
    aiPattern: 'aggressive',
    weaknesses: ['fire'],
    resistances: ['physical'],
    dropTable: {
      gold: { min: 10, max: 20 },
      items: [
        { itemId: 'material_001', dropRate: 0.5 },
        { itemId: 'consumable_001', dropRate: 0.3 }
      ]
    },
    sprite: '🟢',
    icon: '🫧'
  },

  'monster_002': {
    id: 'monster_002',
    name: '고블린',
    level: 3,
    stats: {
      hp: 80,
      mp: 20,
      attack: 15,
      defense: 8,
      speed: 7,
      magicPower: 5,
      magicResist: 5
    },
    skills: ['skill_001', 'skill_002'],
    aiPattern: 'aggressive',
    weaknesses: ['fire', 'light'],
    resistances: [],
    dropTable: {
      gold: { min: 20, max: 40 },
      items: [
        { itemId: 'weapon_001', dropRate: 0.2 },
        { itemId: 'consumable_001', dropRate: 0.4 }
      ]
    },
    sprite: '👺',
    icon: '👹'
  },

  'monster_003': {
    id: 'monster_003',
    name: '늑대',
    level: 5,
    stats: {
      hp: 120,
      mp: 30,
      attack: 25,
      defense: 12,
      speed: 15,
      magicPower: 10,
      magicResist: 10
    },
    skills: ['skill_001', 'skill_002'],
    aiPattern: 'aggressive',
    weaknesses: ['fire'],
    resistances: ['ice'],
    dropTable: {
      gold: { min: 30, max: 60 },
      items: [
        { itemId: 'material_001', dropRate: 0.6 },
        { itemId: 'armor_001', dropRate: 0.1 }
      ]
    },
    sprite: '🐺',
    icon: '🐺'
  },

  // 중급 몬스터
  'monster_004': {
    id: 'monster_004',
    name: '오크 전사',
    level: 10,
    stats: {
      hp: 300,
      mp: 50,
      attack: 40,
      defense: 25,
      speed: 10,
      magicPower: 15,
      magicResist: 20
    },
    skills: ['skill_001', 'skill_002', 'skill_006'],
    aiPattern: 'balanced',
    weaknesses: ['magic'],
    resistances: ['physical'],
    immunities: [StatusEffectType.STUN],
    dropTable: {
      gold: { min: 50, max: 100 },
      items: [
        { itemId: 'weapon_002', dropRate: 0.15 },
        { itemId: 'armor_002', dropRate: 0.15 },
        { itemId: 'consumable_002', dropRate: 0.3 }
      ]
    },
    sprite: '👹'
  },

  'monster_005': {
    id: 'monster_005',
    name: '언데드 기사',
    level: 15,
    stats: {
      hp: 500,
      mp: 100,
      attack: 60,
      defense: 40,
      speed: 12,
      magicPower: 30,
      magicResist: 30
    },
    skills: ['skill_001', 'skill_004', 'skill_009'],
    aiPattern: 'defensive',
    weaknesses: ['light', 'fire'],
    resistances: ['dark', 'ice'],
    immunities: [StatusEffectType.POISON, StatusEffectType.BLEED],
    dropTable: {
      gold: { min: 100, max: 200 },
      items: [
        { itemId: 'weapon_003', dropRate: 0.1 },
        { itemId: 'material_002', dropRate: 0.4 }
      ]
    },
    sprite: '💀'
  },

  // 보스 몬스터
  'boss_001': {
    id: 'boss_001',
    name: '화염 드래곤',
    level: 20,
    isBoss: true,
    stats: {
      hp: 1000,
      mp: 200,
      attack: 80,
      defense: 50,
      speed: 20,
      magicPower: 100,
      magicResist: 50
    },
    skills: ['skill_003', 'skill_007', 'skill_010'],
    aiPattern: 'aggressive',
    phases: [
      {
        hpThreshold: 50,
        pattern: 'berserk',
        newSkills: ['skill_008']
      }
    ],
    weaknesses: ['ice', 'thunder'],
    resistances: ['fire', 'physical'],
    immunities: [StatusEffectType.BURN, StatusEffectType.STUN],
    dropTable: {
      gold: { min: 500, max: 1000 },
      items: [
        { itemId: 'weapon_004', dropRate: 0.3 },
        { itemId: 'material_003', dropRate: 0.5 },
        { itemId: 'accessory_002', dropRate: 0.2 }
      ]
    },
    sprite: '🐉'
  },

  'boss_002': {
    id: 'boss_002',
    name: '얼음 여왕',
    level: 25,
    isBoss: true,
    stats: {
      hp: 1500,
      mp: 300,
      attack: 70,
      defense: 60,
      speed: 25,
      magicPower: 120,
      magicResist: 80
    },
    skills: ['skill_004', 'skill_005', 'skill_007'],
    aiPattern: 'balanced',
    phases: [
      {
        hpThreshold: 70,
        pattern: 'defensive',
        newSkills: ['skill_006']
      },
      {
        hpThreshold: 30,
        pattern: 'berserk',
        newSkills: ['skill_008', 'skill_010']
      }
    ],
    weaknesses: ['fire'],
    resistances: ['ice', 'water'],
    immunities: [StatusEffectType.FREEZE],
    dropTable: {
      gold: { min: 800, max: 1500 },
      items: [
        { itemId: 'armor_003', dropRate: 0.3 },
        { itemId: 'accessory_003', dropRate: 0.2 },
        { itemId: 'consumable_003', dropRate: 0.5 }
      ]
    },
    sprite: '👸'
  },

  // 최종 보스
  'boss_003': {
    id: 'boss_003',
    name: '혼돈의 군주',
    level: 50,
    isBoss: true,
    stats: {
      hp: 5000,
      mp: 500,
      attack: 150,
      defense: 100,
      speed: 50,
      magicPower: 200,
      magicResist: 100
    },
    skills: ['skill_007', 'skill_008', 'skill_009', 'skill_010'],
    aiPattern: 'balanced',
    phases: [
      {
        hpThreshold: 75,
        pattern: 'aggressive',
        newSkills: []
      },
      {
        hpThreshold: 50,
        pattern: 'defensive',
        newSkills: ['skill_005', 'skill_006']
      },
      {
        hpThreshold: 25,
        pattern: 'berserk',
        newSkills: []
      }
    ],
    weaknesses: ['light'],
    resistances: ['dark', 'physical', 'magic'],
    immunities: [StatusEffectType.STUN, StatusEffectType.PARALYZE],
    dropTable: {
      gold: { min: 5000, max: 10000 },
      items: [
        { itemId: 'weapon_005', dropRate: 0.5 },
        { itemId: 'weapon_006', dropRate: 0.1 },
        { itemId: 'material_003', dropRate: 1, quantity: { min: 3, max: 5 } }
      ]
    },
    sprite: '👹'
  }
}

// 몬스터 스폰 테이블 (던전별)
export const MONSTER_SPAWN_TABLES = {
  beginner_dungeon: {
    common: ['monster_001', 'monster_002'],
    rare: ['monster_003'],
    boss: []
  },
  intermediate_dungeon: {
    common: ['monster_003'],
    rare: ['monster_004', 'monster_005'],
    boss: ['boss_001']
  },
  advanced_dungeon: {
    common: ['monster_004', 'monster_005'],
    rare: [],
    boss: ['boss_002']
  },
  final_dungeon: {
    common: ['monster_005'],
    rare: ['boss_001', 'boss_002'],
    boss: ['boss_003']
  }
}

// AI 패턴 정의
export const AI_PATTERNS = {
  aggressive: {
    description: '공격 위주의 AI',
    attackPriority: 0.8,
    defensePriority: 0.1,
    supportPriority: 0.1
  },
  defensive: {
    description: '방어 위주의 AI',
    attackPriority: 0.3,
    defensePriority: 0.5,
    supportPriority: 0.2
  },
  balanced: {
    description: '균형잡힌 AI',
    attackPriority: 0.5,
    defensePriority: 0.3,
    supportPriority: 0.2
  },
  berserk: {
    description: '광폭화 상태의 AI',
    attackPriority: 1.0,
    defensePriority: 0.0,
    supportPriority: 0.0
  }
}