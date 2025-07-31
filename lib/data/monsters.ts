/**
 * 몬스터 데이터베이스
 * 레벨별, 던전별 몬스터 정보
 */

import type { DungeonMonster } from '@/lib/types/dungeon'
import type { SkillEffect } from '@/lib/types/skill-system'

// 몬스터 기본 타입 확장
export interface MonsterData extends Omit<DungeonMonster, 'drops'> {
  description?: string
  type: string // 몬스터 타입 (beast, undead, demon 등)
  element?: string // 속성 (fire, ice, neutral 등)
  speed?: number // 속도 스탯
  aiPattern: 'aggressive' | 'defensive' | 'balanced' | 'strategic'
  drops: MonsterDrop[]
  resistances?: ElementalResistance
}

export interface MonsterDrop {
  itemId: string
  dropRate: number // 0-1
  minQuantity?: number
  maxQuantity?: number
}

export interface ElementalResistance {
  fire?: number    // -100 ~ 100 (음수는 약점)
  ice?: number
  lightning?: number
  poison?: number
  holy?: number
  dark?: number
}

// 몬스터 스킬 데이터
export const MONSTER_SKILLS: Record<string, MonsterSkill> = {
  // 기본 공격
  'basic_attack': {
    id: 'basic_attack',
    name: '기본 공격',
    damage: 1.0,
    cooldown: 0,
    description: '일반적인 물리 공격'
  },
  
  // 특수 공격
  'power_strike': {
    id: 'power_strike',
    name: '강타',
    damage: 1.5,
    cooldown: 2,
    description: '강력한 일격',
    effects: [{
      type: 'stun',
      value: 1,
      chance: 20,
      duration: 1
    }]
  },
  
  'poison_bite': {
    id: 'poison_bite',
    name: '독 물기',
    damage: 0.8,
    cooldown: 3,
    description: '독을 주입하는 공격',
    effects: [{
      type: 'dot',
      value: 0.2,
      duration: 3,
      element: 'dark'
    }]
  },
  
  'rage': {
    id: 'rage',
    name: '격노',
    damage: 0,
    cooldown: 5,
    description: '공격력 증가',
    effects: [{
      type: 'buff',
      value: 1.5,
      duration: 3
    } as SkillEffect]
  },
  
  'heal': {
    id: 'heal',
    name: '치유',
    damage: 0,
    cooldown: 4,
    description: 'HP 회복',
    effects: [{
      type: 'heal',
      value: 0.3 // 최대 HP의 30%
    }]
  },
  
  'shield_bash': {
    id: 'shield_bash',
    name: '방패 타격',
    damage: 0.7,
    cooldown: 3,
    description: '방어력 감소 효과',
    effects: [{
      type: 'debuff',
      value: 0.8,
      duration: 2
    } as SkillEffect]
  }
}

interface MonsterSkill {
  id: string
  name: string
  damage: number // 기본 공격력 배수
  cooldown: number
  description: string
  effects?: SkillEffect[]
}

// 레벨별 스탯 계산 함수
export function calculateMonsterStats(level: number, type: string): {
  hp: number
  attack: number
  defense: number
  speed: number
} {
  // 타입별 기본 스탯 가져오기
  const baseStats = getBaseStatsForType(type)
  const levelMultiplier = 1 + (level - 1) * 0.1
  
  return {
    hp: Math.floor(baseStats.hp * levelMultiplier),
    attack: Math.floor(baseStats.attack * levelMultiplier),
    defense: Math.floor(baseStats.defense * levelMultiplier),
    speed: Math.floor(baseStats.speed * levelMultiplier)
  }
}

// 타입별 기본 스탯
function getBaseStatsForType(type: string): MonsterBaseStats {
  const baseStatsMap: Record<string, MonsterBaseStats> = {
    'normal': { hp: 100, attack: 20, defense: 10, speed: 40 },
    'beast': { hp: 80, attack: 25, defense: 8, speed: 50 },
    'undead': { hp: 150, attack: 15, defense: 20, speed: 30 },
    'humanoid': { hp: 100, attack: 20, defense: 15, speed: 40 },
    'dragon': { hp: 200, attack: 35, defense: 25, speed: 35 },
    'demon': { hp: 120, attack: 30, defense: 15, speed: 45 },
    'boss': { hp: 300, attack: 40, defense: 30, speed: 30 }
  }
  
  return baseStatsMap[type] || { hp: 100, attack: 20, defense: 10, speed: 40 }
}

interface MonsterBaseStats {
  hp: number
  attack: number
  defense: number
  speed: number
}

// 몬스터 템플릿
export const MONSTER_TEMPLATES: Record<string, Omit<MonsterData, 'id' | 'level' | 'hp' | 'attack' | 'defense' | 'speed'>> = {
  // 초급 몬스터 (레벨 1-10)
  'slime': {
    name: '슬라임',
    icon: '🟢',
    description: '젤리 같은 몸체를 가진 약한 몬스터',
    type: 'normal',
    skills: ['basic_attack'],
    aiPattern: 'aggressive',
    drops: [
      { itemId: 'slime_gel', dropRate: 0.5, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'minor_potion', dropRate: 0.1 }
    ],
    resistances: {
      fire: -50,
      ice: 20
    }
  },
  
  'goblin': {
    name: '고블린',
    icon: '👺',
    description: '작고 교활한 인간형 몬스터',
    type: 'normal',
    skills: ['basic_attack', 'power_strike'],
    aiPattern: 'balanced',
    drops: [
      { itemId: 'goblin_ear', dropRate: 0.3 },
      { itemId: 'copper_coin', dropRate: 0.8, minQuantity: 5, maxQuantity: 15 }
    ]
  },
  
  'wolf': {
    name: '늑대',
    icon: '🐺',
    description: '빠른 속도로 공격하는 야수',
    type: 'beast',
    skills: ['basic_attack', 'poison_bite'],
    aiPattern: 'aggressive',
    drops: [
      { itemId: 'wolf_pelt', dropRate: 0.4 },
      { itemId: 'wolf_fang', dropRate: 0.2 }
    ]
  },
  
  // 중급 몬스터 (레벨 11-30)
  'orc_warrior': {
    name: '오크 전사',
    icon: '👹',
    description: '강력한 전투력을 가진 오크족',
    type: 'humanoid',
    skills: ['basic_attack', 'power_strike', 'rage'],
    aiPattern: 'aggressive',
    drops: [
      { itemId: 'orc_tusk', dropRate: 0.3 },
      { itemId: 'warrior_badge', dropRate: 0.1 },
      { itemId: 'silver_coin', dropRate: 0.5, minQuantity: 10, maxQuantity: 30 }
    ],
    resistances: {
      fire: 10,
      ice: -10
    }
  },
  
  'skeleton_knight': {
    name: '스켈레톤 기사',
    icon: '💀',
    description: '언데드 기사단의 일원',
    type: 'undead',
    skills: ['basic_attack', 'shield_bash', 'power_strike'],
    aiPattern: 'defensive',
    drops: [
      { itemId: 'bone_fragment', dropRate: 0.6, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'rusty_sword', dropRate: 0.15 }
    ],
    resistances: {
      poison: 100,
      holy: -50,
      dark: 50
    }
  },
  
  'mage_apprentice': {
    name: '마법사 수습생',
    icon: '🧙',
    description: '마법을 배우기 시작한 적대적 마법사',
    type: 'humanoid',
    skills: ['basic_attack', 'heal'],
    aiPattern: 'strategic',
    drops: [
      { itemId: 'magic_dust', dropRate: 0.4 },
      { itemId: 'apprentice_robe', dropRate: 0.05 },
      { itemId: 'mana_potion', dropRate: 0.2 }
    ]
  },
  
  // 고급 몬스터 (레벨 31-50)
  'dragon_whelp': {
    name: '어린 드래곤',
    icon: '🐲',
    description: '아직 성장 중인 드래곤',
    type: 'dragon',
    skills: ['basic_attack', 'power_strike', 'rage'],
    aiPattern: 'aggressive',
    drops: [
      { itemId: 'dragon_scale', dropRate: 0.3 },
      { itemId: 'dragon_blood', dropRate: 0.1 },
      { itemId: 'gold_coin', dropRate: 0.7, minQuantity: 50, maxQuantity: 100 }
    ],
    resistances: {
      fire: 80,
      ice: -20,
      lightning: 30
    }
  },
  
  'demon_soldier': {
    name: '악마 병사',
    icon: '👿',
    description: '마계에서 온 정예 병사',
    type: 'demon',
    skills: ['basic_attack', 'power_strike', 'rage', 'poison_bite'],
    aiPattern: 'aggressive',
    drops: [
      { itemId: 'demon_horn', dropRate: 0.25 },
      { itemId: 'cursed_essence', dropRate: 0.15 }
    ],
    resistances: {
      fire: 50,
      dark: 70,
      holy: -70
    }
  },
  
  // 보스 몬스터
  'goblin_king': {
    name: '고블린 왕',
    icon: '👑',
    description: '고블린들의 지배자',
    type: 'boss',
    skills: ['basic_attack', 'power_strike', 'rage', 'heal'],
    aiPattern: 'strategic',
    drops: [
      { itemId: 'goblin_crown', dropRate: 0.5 },
      { itemId: 'royal_scepter', dropRate: 0.3 },
      { itemId: 'gold_coin', dropRate: 1, minQuantity: 100, maxQuantity: 300 }
    ]
  },
  
  'lich': {
    name: '리치',
    icon: '🧟',
    description: '강력한 언데드 마법사',
    type: 'boss',
    skills: ['basic_attack', 'heal', 'shield_bash', 'power_strike'],
    aiPattern: 'strategic',
    drops: [
      { itemId: 'lich_phylactery', dropRate: 0.3 },
      { itemId: 'necromancer_staff', dropRate: 0.2 },
      { itemId: 'death_essence', dropRate: 0.5, minQuantity: 1, maxQuantity: 3 }
    ],
    resistances: {
      poison: 100,
      ice: 50,
      holy: -100,
      dark: 100
    }
  }
}

// 몬스터 생성 함수
export function createMonster(
  templateId: string, 
  level: number,
  modifier?: Partial<MonsterData>,
  difficultyMultiplier: number = 1.0
): MonsterData {
  const template = MONSTER_TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Monster template not found: ${templateId}`)
  }
  
  // 스탯 계산
  const baseStats = calculateMonsterStats(level, template.type)
  
  // 난이도에 따른 스탯 조정
  const stats = {
    hp: Math.floor(baseStats.hp * difficultyMultiplier),
    attack: Math.floor(baseStats.attack * difficultyMultiplier),
    defense: Math.floor(baseStats.defense * difficultyMultiplier),
    speed: Math.floor(baseStats.speed * (0.9 + difficultyMultiplier * 0.1)) // 속도는 조금만 증가
  }
  
  return {
    id: `${templateId}_${level}_${Date.now()}`,
    ...template,
    level,
    ...stats,
    ...modifier
  }
}

// 템플릿별 기본 스탯
function getBaseStatsForTemplate(templateId: string): MonsterBaseStats {
  const baseStatsMap: Record<string, MonsterBaseStats> = {
    // 초급
    'slime': { hp: 50, attack: 10, defense: 5, speed: 30 },
    'goblin': { hp: 80, attack: 15, defense: 8, speed: 40 },
    'wolf': { hp: 70, attack: 18, defense: 6, speed: 50 },
    
    // 중급
    'orc_warrior': { hp: 200, attack: 35, defense: 25, speed: 35 },
    'skeleton_knight': { hp: 180, attack: 30, defense: 30, speed: 25 },
    'mage_apprentice': { hp: 120, attack: 40, defense: 15, speed: 40 },
    
    // 고급
    'dragon_whelp': { hp: 500, attack: 80, defense: 60, speed: 45 },
    'demon_soldier': { hp: 400, attack: 90, defense: 50, speed: 55 },
    
    // 보스
    'goblin_king': { hp: 1000, attack: 60, defense: 40, speed: 35 },
    'lich': { hp: 1500, attack: 100, defense: 70, speed: 30 }
  }
  
  return baseStatsMap[templateId] || { hp: 100, attack: 20, defense: 10, speed: 40 }
}

// 던전별 몬스터 구성
export const DUNGEON_MONSTERS: Record<string, DungeonMonsterConfig> = {
  'beginner_forest': {
    name: '초보자의 숲',
    monsters: [
      { templateId: 'slime', weight: 50, levelRange: [1, 5] },
      { templateId: 'goblin', weight: 30, levelRange: [2, 6] },
      { templateId: 'wolf', weight: 20, levelRange: [3, 7] }
    ],
    boss: { templateId: 'goblin_king', level: 10 }
  },
  
  'dark_cave': {
    name: '어둠의 동굴',
    monsters: [
      { templateId: 'skeleton_knight', weight: 40, levelRange: [10, 15] },
      { templateId: 'orc_warrior', weight: 35, levelRange: [12, 17] },
      { templateId: 'mage_apprentice', weight: 25, levelRange: [11, 16] }
    ],
    boss: { templateId: 'lich', level: 20 }
  },
  
  'demon_fortress': {
    name: '악마의 요새',
    monsters: [
      { templateId: 'demon_soldier', weight: 60, levelRange: [30, 40] },
      { templateId: 'dragon_whelp', weight: 40, levelRange: [35, 45] }
    ],
    boss: null // 추후 추가
  }
}

interface DungeonMonsterConfig {
  name: string
  monsters: Array<{
    templateId: string
    weight: number // 출현 가중치
    levelRange: [number, number]
  }>
  boss: {
    templateId: string
    level: number
  } | null
}

// 던전 스테이지별 몬스터 생성
export function generateStageMonsters(
  dungeonId: string,
  stageNumber: number,
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare' = 'normal'
): MonsterData[] {
  const dungeonConfig = DUNGEON_MONSTERS[dungeonId]
  
  // 난이도별 스탯 배율
  const difficultyMultipliers = {
    'easy': 0.8,
    'normal': 1.0,
    'hard': 1.5,
    'nightmare': 2.0
  }
  const statMultiplier = difficultyMultipliers[difficulty] || 1.0
  
  if (!dungeonConfig) {
    // 기본 몬스터 생성
    return [createMonster('slime', stageNumber, undefined, statMultiplier)]
  }
  
  const monsterCount = getMonsterCount(stageNumber, difficulty)
  const monsters: MonsterData[] = []
  
  // 보스 스테이지 체크
  const isBossStage = stageNumber % 5 === 0
  if (isBossStage && dungeonConfig.boss) {
    const bossLevel = dungeonConfig.boss.level + Math.floor(stageNumber / 5) * 5
    // 보스는 추가 배율 적용
    const bossMultiplier = statMultiplier * 1.5
    monsters.push(createMonster(dungeonConfig.boss.templateId, bossLevel, undefined, bossMultiplier))
    return monsters
  }
  
  // 일반 몬스터 생성
  for (let i = 0; i < monsterCount; i++) {
    const monsterType = selectMonsterByWeight(dungeonConfig.monsters)
    const level = getRandomLevel(monsterType.levelRange, stageNumber)
    
    monsters.push(createMonster(monsterType.templateId, level, undefined, statMultiplier))
  }
  
  return monsters
}

// 스테이지별 몬스터 수
function getMonsterCount(stageNumber: number, difficulty: string): number {
  const baseCount = Math.min(3 + Math.floor(stageNumber / 3), 6)
  const difficultyMultiplier = {
    'easy': 0.8,
    'normal': 1,
    'hard': 1.2,
    'nightmare': 1.5
  }[difficulty] || 1
  
  return Math.max(1, Math.floor(baseCount * difficultyMultiplier))
}

// 가중치 기반 몬스터 선택
function selectMonsterByWeight(monsters: Array<{ templateId: string; weight: number; levelRange: [number, number] }>) {
  const totalWeight = monsters.reduce((sum, m) => sum + m.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const monster of monsters) {
    random -= monster.weight
    if (random <= 0) {
      return monster
    }
  }
  
  return monsters[0]
}

// 레벨 범위에서 랜덤 레벨 선택
function getRandomLevel(range: [number, number], stageModifier: number): number {
  const [min, max] = range
  const stageBonus = Math.floor(stageModifier / 5) * 2
  return Math.floor(Math.random() * (max - min + 1)) + min + stageBonus
}

// 몬스터 데이터 가져오기
export const getMonsterData = (monsterId: string, level: number): MonsterData => {
  const template = MONSTER_TEMPLATES[monsterId]
  if (!template) {
    throw new Error(`Unknown monster: ${monsterId}`)
  }

  const stats = calculateMonsterStats(level, template.type)
  
  return {
    id: monsterId,
    ...template,
    level,
    ...stats
  }
}