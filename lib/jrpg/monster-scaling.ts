// 몬스터 스케일링 시스템
import type { MonsterDefinition, BaseStats } from './types'
import { MONSTER_DATABASE } from './monsters-database'

// 던전 난이도별 스케일링 배율
export const DIFFICULTY_SCALING = {
  easy: { statMultiplier: 1.0, goldMultiplier: 1.0, dropRateBonus: 0 },
  normal: { statMultiplier: 1.5, goldMultiplier: 1.5, dropRateBonus: 0.1 },
  hard: { statMultiplier: 2.0, goldMultiplier: 2.0, dropRateBonus: 0.2 },
  nightmare: { statMultiplier: 3.0, goldMultiplier: 3.0, dropRateBonus: 0.3 }
}

// 층수별 추가 배율
export const FLOOR_SCALING = {
  statMultiplierPerFloor: 0.1, // 층당 10% 증가
  goldMultiplierPerFloor: 0.15, // 층당 15% 증가
  dropRateBonusPerFloor: 0.02 // 층당 2% 증가
}

// 몬스터 스탯 스케일링
export function scaleMonsterStats(
  baseStats: BaseStats,
  dungeonLevel: number,
  difficulty: keyof typeof DIFFICULTY_SCALING,
  floor: number = 1
): BaseStats {
  const difficultyMult = DIFFICULTY_SCALING[difficulty].statMultiplier
  const floorMult = 1 + (floor - 1) * FLOOR_SCALING.statMultiplierPerFloor
  const levelMult = 1 + (dungeonLevel - 1) * 0.05 // 던전 레벨당 5% 증가
  
  const totalMultiplier = difficultyMult * floorMult * levelMult
  
  return {
    hp: Math.floor(baseStats.hp * totalMultiplier),
    mp: Math.floor(baseStats.mp * totalMultiplier),
    attack: Math.floor(baseStats.attack * totalMultiplier),
    defense: Math.floor(baseStats.defense * totalMultiplier),
    speed: Math.floor(baseStats.speed * totalMultiplier),
    magicPower: Math.floor(baseStats.magicPower * totalMultiplier),
    magicResist: Math.floor(baseStats.magicResist * totalMultiplier)
  }
}

// 몬스터 보상 스케일링
export function scaleMonsterRewards(
  monster: MonsterDefinition,
  dungeonLevel: number,
  difficulty: keyof typeof DIFFICULTY_SCALING,
  floor: number = 1
) {
  const difficultyMult = DIFFICULTY_SCALING[difficulty]
  const floorGoldMult = 1 + (floor - 1) * FLOOR_SCALING.goldMultiplierPerFloor
  const floorDropBonus = (floor - 1) * FLOOR_SCALING.dropRateBonusPerFloor
  
  return {
    gold: {
      min: Math.floor(monster.dropTable.gold.min * difficultyMult.goldMultiplier * floorGoldMult),
      max: Math.floor(monster.dropTable.gold.max * difficultyMult.goldMultiplier * floorGoldMult)
    },
    items: monster.dropTable.items.map(item => ({
      ...item,
      dropRate: Math.min(1, item.dropRate + difficultyMult.dropRateBonus + floorDropBonus)
    }))
  }
}

// 던전별 몬스터 선택
export function getMonsterForDungeon(
  dungeonId: string,
  floor: number,
  difficulty: keyof typeof DIFFICULTY_SCALING
): MonsterDefinition | null {
  // 던전별 몬스터 풀
  const dungeonMonsterPools: Record<string, string[]> = {
    'beginner_dungeon': ['monster_001', 'monster_002'],
    'dark_cave': ['monster_002', 'monster_003'],
    'mage_tower': ['monster_003', 'monster_004'],
    'crystal_cave': ['monster_004', 'monster_005'],
    'volcano': ['monster_005', 'boss_001'],
    'ice_palace': ['monster_005', 'boss_002']
  }
  
  const monsterPool = dungeonMonsterPools[dungeonId] || ['monster_001']
  
  // 층수에 따라 강한 몬스터 선택 확률 증가
  const weights = monsterPool.map((_, index) => {
    const baseWeight = index + 1
    return baseWeight + (floor - 1) * 0.5
  })
  
  // 가중치 기반 랜덤 선택
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < monsterPool.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return MONSTER_DATABASE[monsterPool[i]] || null
    }
  }
  
  return MONSTER_DATABASE[monsterPool[monsterPool.length - 1]] || null
}

// 스케일된 몬스터 생성
export function createScaledMonster(
  dungeonId: string,
  dungeonLevel: number,
  floor: number,
  difficulty: keyof typeof DIFFICULTY_SCALING
): MonsterDefinition | null {
  const baseMonster = getMonsterForDungeon(dungeonId, floor, difficulty)
  if (!baseMonster) return null
  
  // 스탯 스케일링
  const scaledStats = scaleMonsterStats(
    baseMonster.stats,
    dungeonLevel,
    difficulty,
    floor
  )
  
  // 보상 스케일링
  const scaledRewards = scaleMonsterRewards(
    baseMonster,
    dungeonLevel,
    difficulty,
    floor
  )
  
  // 레벨 조정 (던전 레벨 + 층수 보너스)
  const scaledLevel = baseMonster.level + dungeonLevel - 1 + Math.floor((floor - 1) / 5)
  
  return {
    ...baseMonster,
    level: scaledLevel,
    stats: scaledStats,
    dropTable: scaledRewards,
    // 층수에 따라 이름 수정
    name: floor > 10 ? `강화된 ${baseMonster.name}` : baseMonster.name
  }
}