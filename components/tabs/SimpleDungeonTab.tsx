'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sword, Trophy, X, ChevronRight, RotateCcw } from 'lucide-react'
import { SimpleBattleScreen } from '@/components/dungeon/SimpleBattleScreen'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { dbHelpers } from '@/lib/database/client'
import type { UserProfile } from '@/lib/database/types'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
import { dungeonProgressService } from '@/lib/services/dungeon-progress-service'
import { useQuests } from '@/hooks/useQuests'
import { inventoryService } from '@/lib/services/inventory-service'
import { getItemById } from '@/lib/data/items'
import { calculateDungeonRewards } from '@/lib/config/dungeon-rewards'
import { useUserStore } from '@/lib/stores/userStore'
import { getRandomMonsters, EnhancedMonster } from '@/lib/data/monsters-enhanced'
import { BOSS_MONSTERS, DUNGEON_BOSSES } from '@/lib/data/boss-monsters'
import { BossBattleService } from '@/lib/services/boss-battle.service'
import { BossBattleUI } from '@/components/dungeon/boss/BossBattleUI'
import type { DungeonProgress } from '@/lib/types/dungeon-progress'
import { BossRewardScreen } from '@/components/dungeon/boss/BossRewardScreen'
import type { BossData, BossBattleResult } from '@/lib/types/boss-system'
import { DifficultySelector } from '@/components/dungeon/DifficultySelector'
import { DifficultyLevel } from '@/lib/types/difficulty-system'
import { DifficultyService } from '@/lib/services/difficulty.service'
import { PlayerBehaviorService } from '@/lib/services/player-behavior.service'

// 몬스터 데이터
const MONSTERS = {
  // 초급 몬스터
  slime: { name: '슬라임', emoji: '🟢', traits: { hpBoost: 1.2, attackBoost: 0.8, speedBoost: 0.9 }, specialAbility: null },
  babySlime: { name: '아기 슬라임', emoji: '🟡', traits: { hpBoost: 0.8, attackBoost: 0.6, speedBoost: 1.1 }, specialAbility: null },
  mushroom: { name: '독버섯', emoji: '🍄', traits: { hpBoost: 1.0, attackBoost: 0.9, speedBoost: 0.8 }, specialAbility: 'poison' },

  // 고블린 계열
  goblin: { name: '고블린', emoji: '👺', traits: { hpBoost: 1.0, attackBoost: 1.2, speedBoost: 1.3 }, specialAbility: 'doubleStrike' },
  goblinArcher: { name: '고블린 궁수', emoji: '🏹', traits: { hpBoost: 0.8, attackBoost: 1.4, speedBoost: 1.2 }, specialAbility: null },
  hobgoblin: { name: '홉고블린', emoji: '👹', traits: { hpBoost: 1.3, attackBoost: 1.3, speedBoost: 1.0 }, specialAbility: 'doubleStrike' },

  // 언데드 계열
  skeleton: { name: '스켈레톤', emoji: '💀', traits: { hpBoost: 0.9, attackBoost: 1.1, speedBoost: 1.0, defenseBoost: 1.2 }, specialAbility: null },
  zombie: { name: '좀비', emoji: '🧟', traits: { hpBoost: 1.5, attackBoost: 1.0, speedBoost: 0.7, defenseBoost: 1.3 }, specialAbility: 'lifeDrain' },
  ghost: { name: '유령', emoji: '👻', traits: { hpBoost: 0.7, attackBoost: 1.2, speedBoost: 1.5, defenseBoost: 0.5 }, specialAbility: 'curse' },

  // 얼음 계열
  iceSpirit: { name: '얼음 정령', emoji: '❄️', traits: { hpBoost: 1.1, attackBoost: 1.3, speedBoost: 1.0, defenseBoost: 1.2 }, specialAbility: 'freeze' },
  frostWolf: { name: '서리 늑대', emoji: '🐺', traits: { hpBoost: 1.2, attackBoost: 1.4, speedBoost: 1.4 }, specialAbility: null },
  yeti: { name: '설인', emoji: '⛄', traits: { hpBoost: 1.8, attackBoost: 1.5, speedBoost: 0.8, defenseBoost: 1.4 }, specialAbility: 'freeze' },

  // 용 계열
  drake: { name: '드레이크', emoji: '🦎', traits: { hpBoost: 1.3, attackBoost: 1.3, speedBoost: 1.1 }, specialAbility: null },
  wyrmling: { name: '어린 드래곤', emoji: '🐲', traits: { hpBoost: 1.4, attackBoost: 1.5, speedBoost: 1.1, defenseBoost: 1.2 }, specialAbility: 'fireBreath' },
  dragon: { name: '성룡', emoji: '🐉', traits: { hpBoost: 2.0, attackBoost: 2.0, speedBoost: 1.0, defenseBoost: 1.8 }, specialAbility: 'fireBreath' },

  // 늪지대 몬스터
  poisonFrog: { name: '독개구리', emoji: '🐸', traits: { hpBoost: 1.2, attackBoost: 1.1, speedBoost: 1.4 }, specialAbility: 'poison' },
  crocodile: { name: '늪악어', emoji: '🐊', traits: { hpBoost: 1.6, attackBoost: 1.4, speedBoost: 0.9, defenseBoost: 1.3 }, specialAbility: null },
  snake: { name: '독사', emoji: '🐍', traits: { hpBoost: 0.9, attackBoost: 1.3, speedBoost: 1.5 }, specialAbility: 'poison' },

  // 사막 몬스터
  scorpion: { name: '전갈', emoji: '🦂', traits: { hpBoost: 1.1, attackBoost: 1.2, speedBoost: 1.2 }, specialAbility: 'poison' },
  mummy: { name: '미라', emoji: '🧟‍♂️', traits: { hpBoost: 1.3, attackBoost: 1.2, speedBoost: 0.8, defenseBoost: 1.5 }, specialAbility: 'curse' },
  sandGolem: { name: '모래 골렘', emoji: '🗿', traits: { hpBoost: 1.7, attackBoost: 1.1, speedBoost: 0.7, defenseBoost: 1.6 }, specialAbility: null },

  // 화산 몬스터
  lavaSlime: { name: '용암 슬라임', emoji: '🔴', traits: { hpBoost: 1.4, attackBoost: 1.3, speedBoost: 0.8 }, specialAbility: 'lavaArmor' },
  fireElemental: { name: '화염 정령', emoji: '🔥', traits: { hpBoost: 1.2, attackBoost: 1.5, speedBoost: 1.1 }, specialAbility: 'fireBreath' },
  magmaGolem: { name: '마그마 골렘', emoji: '🌋', traits: { hpBoost: 1.6, attackBoost: 1.4, speedBoost: 0.6, defenseBoost: 1.8 }, specialAbility: 'lavaArmor' },

  // 심해 몬스터
  shark: { name: '상어', emoji: '🦈', traits: { hpBoost: 1.3, attackBoost: 1.5, speedBoost: 1.3 }, specialAbility: null },
  octopus: { name: '문어', emoji: '🐙', traits: { hpBoost: 1.4, attackBoost: 1.2, speedBoost: 1.0 }, specialAbility: 'tentacleGrab' },
  kraken: { name: '크라켄', emoji: '🦑', traits: { hpBoost: 1.8, attackBoost: 1.3, speedBoost: 0.9 }, specialAbility: 'tentacleGrab' },

  // 천공 몬스터
  harpy: { name: '하피', emoji: '🦅', traits: { hpBoost: 1.0, attackBoost: 1.3, speedBoost: 1.6 }, specialAbility: null },
  angel: { name: '천사', emoji: '👼', traits: { hpBoost: 1.3, attackBoost: 1.6, speedBoost: 1.5, defenseBoost: 1.1 }, specialAbility: 'heal' },
  seraph: { name: '세라핌', emoji: '✨', traits: { hpBoost: 1.5, attackBoost: 1.8, speedBoost: 1.3, defenseBoost: 1.3 }, specialAbility: 'heal' },

  // 지옥 몬스터
  imp: { name: '임프', emoji: '👿', traits: { hpBoost: 0.8, attackBoost: 1.1, speedBoost: 1.4 }, specialAbility: null },
  demon: { name: '악마', emoji: '😈', traits: { hpBoost: 1.5, attackBoost: 1.8, speedBoost: 1.2 }, specialAbility: 'hellfire' },
  hellhound: { name: '지옥견', emoji: '🐕', traits: { hpBoost: 1.3, attackBoost: 1.6, speedBoost: 1.5 }, specialAbility: 'fireBreath' },

  // 고급 몬스터
  lich: { name: '리치', emoji: '💀', traits: { hpBoost: 1.6, attackBoost: 1.7, speedBoost: 1.0, defenseBoost: 1.4 }, specialAbility: 'curse' },
  timeKeeper: { name: '시간의 수호자', emoji: '⏰', traits: { hpBoost: 1.4, attackBoost: 1.5, speedBoost: 2.0 }, specialAbility: 'timeWarp' },
  shadowLord: { name: '그림자 군주', emoji: '🌑', traits: { hpBoost: 1.6, attackBoost: 1.7, speedBoost: 1.3, defenseBoost: 0.5 }, specialAbility: 'shadowClone' },
  fallenGod: { name: '타락한 신', emoji: '⚡', traits: { hpBoost: 2.0, attackBoost: 2.0, speedBoost: 1.1, defenseBoost: 1.5 }, specialAbility: 'divineWrath' },
  voidMaster: { name: '심연의 지배자', emoji: '🌌', traits: { hpBoost: 2.5, attackBoost: 2.2, speedBoost: 1.2, defenseBoost: 2.0 }, specialAbility: 'voidCall' }
}

// 던전 데이터 (각 던전은 여러 층으로 구성)
const DUNGEONS = [
  {
    id: 1,
    name: '초보자의 숲',
    level: 1,
    description: '초보 모험가를 위한 안전한 숲',
    difficulty: 'easy',
    floors: [
      { floor: 1, monster: MONSTERS.babySlime, count: 2 },
      { floor: 2, monster: MONSTERS.slime, count: 2 },
      { floor: 3, monster: MONSTERS.mushroom, count: 1, boss: true }
    ]
  },
  {
    id: 2,
    name: '고블린 동굴',
    level: 5,
    description: '고블린들이 서식하는 어두운 동굴',
    difficulty: 'normal',
    floors: [
      { floor: 1, monster: MONSTERS.goblin, count: 2 },
      { floor: 2, monster: MONSTERS.goblinArcher, count: 3 },
      { floor: 3, monster: MONSTERS.goblin, count: 2 },
      { floor: 4, monster: MONSTERS.hobgoblin, count: 1, boss: true }
    ]
  },
  {
    id: 3,
    name: '버려진 광산',
    level: 10,
    description: '오래 전 버려진 위험한 광산',
    difficulty: 'hard',
    floors: [
      { floor: 1, monster: MONSTERS.skeleton, count: 3 },
      { floor: 2, monster: MONSTERS.zombie, count: 2 },
      { floor: 3, monster: MONSTERS.ghost, count: 2 },
      { floor: 4, monster: MONSTERS.skeleton, count: 4 },
      { floor: 5, monster: MONSTERS.zombie, count: 1, boss: true, special: '광부 좀비 대장' }
    ]
  },
  {
    id: 4,
    name: '얼어붙은 호수',
    level: 15,
    description: '얼음으로 뒤덮인 신비로운 호수',
    difficulty: 'expert',
    floors: [
      { floor: 1, monster: MONSTERS.frostWolf, count: 2 },
      { floor: 2, monster: MONSTERS.iceSpirit, count: 3 },
      { floor: 3, monster: MONSTERS.frostWolf, count: 3 },
      { floor: 4, monster: MONSTERS.iceSpirit, count: 2 },
      { floor: 5, monster: MONSTERS.yeti, count: 1, boss: true }
    ]
  },
  {
    id: 5,
    name: '용의 둥지',
    level: 20,
    description: '전설의 용이 살고 있다는 곳',
    difficulty: 'legendary',
    floors: [
      { floor: 1, monster: MONSTERS.drake, count: 2 },
      { floor: 2, monster: MONSTERS.drake, count: 3 },
      { floor: 3, monster: MONSTERS.wyrmling, count: 1 },
      { floor: 4, monster: MONSTERS.drake, count: 2 },
      { floor: 5, monster: MONSTERS.wyrmling, count: 2 },
      { floor: 6, monster: MONSTERS.dragon, count: 1, boss: true }
    ]
  },
  {
    id: 6,
    name: '늪지대',
    level: 25,
    description: '독기가 가득한 위험한 늪',
    difficulty: 'legendary',
    floors: [
      { floor: 1, monster: MONSTERS.snake, count: 3 },
      { floor: 2, monster: MONSTERS.poisonFrog, count: 2 },
      { floor: 3, monster: MONSTERS.crocodile, count: 1 },
      { floor: 4, monster: MONSTERS.snake, count: 2 },
      { floor: 5, monster: MONSTERS.poisonFrog, count: 3 },
      { floor: 6, monster: MONSTERS.crocodile, count: 1, boss: true, special: '늪의 지배자' }
    ]
  },
  {
    id: 7,
    name: '사막 신전',
    level: 30,
    description: '고대의 저주가 깃든 신전',
    difficulty: 'legendary',
    floors: [
      { floor: 1, monster: MONSTERS.scorpion, count: 3 },
      { floor: 2, monster: MONSTERS.sandGolem, count: 2 },
      { floor: 3, monster: MONSTERS.mummy, count: 2 },
      { floor: 4, monster: MONSTERS.scorpion, count: 4 },
      { floor: 5, monster: MONSTERS.sandGolem, count: 2 },
      { floor: 6, monster: MONSTERS.mummy, count: 2 },
      { floor: 7, monster: MONSTERS.mummy, count: 1, boss: true, special: '파라오의 미라' }
    ]
  },
  {
    id: 8,
    name: '화산 분화구',
    level: 35,
    description: '용암이 끓어오르는 뜨거운 지역',
    difficulty: 'mythic',
    floors: [
      { floor: 1, monster: MONSTERS.lavaSlime, count: 3 },
      { floor: 2, monster: MONSTERS.fireElemental, count: 2 },
      { floor: 3, monster: MONSTERS.lavaSlime, count: 2 },
      { floor: 4, monster: MONSTERS.fireElemental, count: 3 },
      { floor: 5, monster: MONSTERS.magmaGolem, count: 1 },
      { floor: 6, monster: MONSTERS.fireElemental, count: 2 },
      { floor: 7, monster: MONSTERS.magmaGolem, count: 1, boss: true, special: '화산의 심장' }
    ]
  },
  {
    id: 9,
    name: '심해 동굴',
    level: 40,
    description: '깊은 바다 속 미지의 공간',
    difficulty: 'mythic',
    floors: [
      { floor: 1, monster: MONSTERS.shark, count: 2 },
      { floor: 2, monster: MONSTERS.octopus, count: 2 },
      { floor: 3, monster: MONSTERS.shark, count: 3 },
      { floor: 4, monster: MONSTERS.octopus, count: 2 },
      { floor: 5, monster: MONSTERS.shark, count: 2 },
      { floor: 6, monster: MONSTERS.octopus, count: 3 },
      { floor: 7, monster: MONSTERS.kraken, count: 1 },
      { floor: 8, monster: MONSTERS.kraken, count: 1, boss: true, special: '심해의 지배자' }
    ]
  },
  {
    id: 10,
    name: '천공의 탑',
    level: 45,
    description: '하늘 높이 솟은 신비한 탑',
    difficulty: 'mythic',
    floors: [
      { floor: 1, monster: MONSTERS.harpy, count: 3 },
      { floor: 2, monster: MONSTERS.harpy, count: 2 },
      { floor: 3, monster: MONSTERS.angel, count: 2 },
      { floor: 4, monster: MONSTERS.harpy, count: 3 },
      { floor: 5, monster: MONSTERS.angel, count: 2 },
      { floor: 6, monster: MONSTERS.angel, count: 3 },
      { floor: 7, monster: MONSTERS.seraph, count: 1 },
      { floor: 8, monster: MONSTERS.seraph, count: 1, boss: true, special: '대천사' }
    ]
  },
  {
    id: 11,
    name: '지옥문',
    level: 50,
    description: '악마들이 나타나는 차원의 문',
    difficulty: 'mythic',
    floors: [
      { floor: 1, monster: MONSTERS.imp, count: 4 },
      { floor: 2, monster: MONSTERS.hellhound, count: 2 },
      { floor: 3, monster: MONSTERS.imp, count: 3 },
      { floor: 4, monster: MONSTERS.demon, count: 1 },
      { floor: 5, monster: MONSTERS.hellhound, count: 3 },
      { floor: 6, monster: MONSTERS.demon, count: 2 },
      { floor: 7, monster: MONSTERS.hellhound, count: 2 },
      { floor: 8, monster: MONSTERS.demon, count: 2 },
      { floor: 9, monster: MONSTERS.demon, count: 1, boss: true, special: '지옥의 군주' }
    ]
  },
  {
    id: 12,
    name: '시간의 미궁',
    level: 60,
    description: '시공간이 뒤틀린 이상한 공간',
    difficulty: 'divine',
    floors: [
      { floor: 1, monster: MONSTERS.ghost, count: 3 },
      { floor: 2, monster: MONSTERS.lich, count: 1 },
      { floor: 3, monster: MONSTERS.timeKeeper, count: 1 },
      { floor: 4, monster: MONSTERS.ghost, count: 4 },
      { floor: 5, monster: MONSTERS.lich, count: 2 },
      { floor: 6, monster: MONSTERS.timeKeeper, count: 1 },
      { floor: 7, monster: MONSTERS.lich, count: 2 },
      { floor: 8, monster: MONSTERS.timeKeeper, count: 2 },
      { floor: 9, monster: MONSTERS.timeKeeper, count: 1, boss: true, special: '시간의 지배자' }
    ]
  },
  {
    id: 13,
    name: '그림자 성',
    level: 70,
    description: '어둠의 힘이 지배하는 성',
    difficulty: 'divine',
    floors: [
      { floor: 1, monster: MONSTERS.ghost, count: 4 },
      { floor: 2, monster: MONSTERS.shadowLord, count: 1 },
      { floor: 3, monster: MONSTERS.lich, count: 2 },
      { floor: 4, monster: MONSTERS.shadowLord, count: 1 },
      { floor: 5, monster: MONSTERS.ghost, count: 5 },
      { floor: 6, monster: MONSTERS.lich, count: 2 },
      { floor: 7, monster: MONSTERS.shadowLord, count: 2 },
      { floor: 8, monster: MONSTERS.lich, count: 3 },
      { floor: 9, monster: MONSTERS.shadowLord, count: 2 },
      { floor: 10, monster: MONSTERS.shadowLord, count: 1, boss: true, special: '어둠의 왕' }
    ]
  },
  {
    id: 14,
    name: '신들의 정원',
    level: 80,
    description: '신성한 존재들이 머무는 곳',
    difficulty: 'divine',
    floors: [
      { floor: 1, monster: MONSTERS.angel, count: 3 },
      { floor: 2, monster: MONSTERS.seraph, count: 2 },
      { floor: 3, monster: MONSTERS.fallenGod, count: 1 },
      { floor: 4, monster: MONSTERS.angel, count: 4 },
      { floor: 5, monster: MONSTERS.seraph, count: 3 },
      { floor: 6, monster: MONSTERS.fallenGod, count: 1 },
      { floor: 7, monster: MONSTERS.seraph, count: 3 },
      { floor: 8, monster: MONSTERS.fallenGod, count: 2 },
      { floor: 9, monster: MONSTERS.seraph, count: 4 },
      { floor: 10, monster: MONSTERS.fallenGod, count: 1, boss: true, special: '타락한 신왕' }
    ]
  },
  {
    id: 15,
    name: '무한의 심연',
    level: 100,
    description: '끝을 알 수 없는 깊은 심연',
    difficulty: 'divine',
    floors: [
      { floor: 1, monster: MONSTERS.shadowLord, count: 2 },
      { floor: 2, monster: MONSTERS.lich, count: 3 },
      { floor: 3, monster: MONSTERS.voidMaster, count: 1 },
      { floor: 4, monster: MONSTERS.demon, count: 3 },
      { floor: 5, monster: MONSTERS.shadowLord, count: 2 },
      { floor: 6, monster: MONSTERS.fallenGod, count: 1 },
      { floor: 7, monster: MONSTERS.voidMaster, count: 1 },
      { floor: 8, monster: MONSTERS.shadowLord, count: 3 },
      { floor: 9, monster: MONSTERS.voidMaster, count: 2 },
      { floor: 10, monster: MONSTERS.fallenGod, count: 2 },
      { floor: 11, monster: MONSTERS.voidMaster, count: 2 },
      { floor: 12, monster: MONSTERS.voidMaster, count: 1, boss: true, special: '무한의 존재' }
    ]
  }
]

// 던전 난이도에 따른 몬스터 스탯 계산
const calculateMonsterStats = (dungeon: typeof DUNGEONS[0], monster: typeof MONSTERS[keyof typeof MONSTERS], isBoss = false, floorNumber = 1) => {
  const baseHp = 80 + (dungeon.level * 20)
  const baseAttack = 8 + (dungeon.level * 2)
  const baseDefense = 5 + Math.floor(dungeon.level * 1.5)

  // 난이도별 배율
  const difficultyMultipliers: Record<string, number> = {
    easy: 0.8,
    normal: 1.0,
    hard: 1.3,
    expert: 1.6,
    legendary: 2.0,
    mythic: 2.5,
    divine: 3.0
  }

  const multiplier = difficultyMultipliers[dungeon.difficulty] || 1.0

  // 층 보너스 (각 층마다 5% 증가)
  const floorMultiplier = 1 + (floorNumber - 1) * 0.05

  // 보스 보너스
  const bossMultiplier = isBoss ? 1.5 : 1.0

  // 몬스터 특성 적용
  const traits = monster.traits || {}
  const hpBoost = traits.hpBoost || 1.0
  const attackBoost = traits.attackBoost || 1.0
  const defenseBoost = traits.defenseBoost || 1.0
  const speedBoost = traits.speedBoost || 1.0

  const stats = {
    hp: Math.floor(baseHp * multiplier * hpBoost * floorMultiplier * bossMultiplier),
    attack: Math.floor(baseAttack * multiplier * attackBoost * floorMultiplier * bossMultiplier),
    defense: Math.floor(baseDefense * multiplier * defenseBoost * floorMultiplier * bossMultiplier),
    speed: speedBoost,
    specialAbility: monster.specialAbility
  }

  // 디버깅 로그
  console.log('🎯 몬스터 스탯 계산:', {
    dungeonName: dungeon.name,
    dungeonLevel: dungeon.level,
    difficulty: dungeon.difficulty,
    monsterName: monster.name,
    isBoss,
    floorNumber,
    traits: monster.traits,
    baseStats: { hp: baseHp, attack: baseAttack, defense: baseDefense },
    multipliers: { difficulty: multiplier, floor: floorMultiplier, boss: bossMultiplier },
    finalStats: stats
  })

  return stats
}

export function SimpleDungeonTab() {
  const userId = GAME_CONFIG.DEFAULT_USER_ID
  const { quests, questProgress, updateQuestProgress } = useQuests()
  const [selectedDungeon, setSelectedDungeon] = useState<typeof DUNGEONS[0] | null>(null)
  const [showBattle, setShowBattle] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [battleVictory, setBattleVictory] = useState(false)
  const [userLevel, setUserLevel] = useState(0)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0)
  const [showFloorClear, setShowFloorClear] = useState(false)
  const [showBossBattle, setShowBossBattle] = useState(false)
  const [bossService, setBossService] = useState<BossBattleService | null>(null)
  const [bossBattleLog, setBossBattleLog] = useState<string[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [bossBattleResult, setBossBattleResult] = useState<BossBattleResult | null>(null)
  const [dungeonComplete, setDungeonComplete] = useState(false)
  const [playerHpRatio, setPlayerHpRatio] = useState(1) // 플레이어 HP 비율 저장
  const [dungeonProgress, setDungeonProgress] = useState<Record<number, DungeonProgress>>({})
  const [hasSavedState, setHasSavedState] = useState(false)
  const [dungeonStartTime, setDungeonStartTime] = useState<number>(0)
  const [milestoneRewards, setMilestoneRewards] = useState<{ milestones: Array<{ threshold: number; title: string; goldReward: number }>, totalGold: number } | null>(null)
  const [itemRewards, setItemRewards] = useState<Array<{ itemId: string; name: string; quantity: number; icon: string }>>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('normal')

  useEffect(() => {
    loadUserLevel()
    loadDungeonProgress()
    checkSavedState()
  }, [])

  const loadUserLevel = async() => {

    try {
      const stats = await dbHelpers.getStats(userId)
      if (stats && stats.length > 0) {
        const characterLevel = calculateCharacterLevel(stats)
        setUserLevel(characterLevel)
      }
    } catch (error) {
      console.error('Failed to load user level:', error)
    }
  }

  const loadDungeonProgress = () => {
    const allProgress = dungeonProgressService.getAllDungeonProgress(userId)
    setDungeonProgress(allProgress)
  }

  const checkSavedState = () => {
    const savedState = dungeonProgressService.getCurrentState(userId)
    if (savedState && savedState.inProgress) {
      setHasSavedState(true)
      // 나중에 재개 기능 구현
    }
  }

  const handleSelectDungeon = (dungeon: typeof DUNGEONS[0]) => {
    setSelectedDungeon(dungeon)
  }

  const handleStartBattle = () => {
    if (selectedDungeon) {
      setCurrentFloor(1)
      setCurrentMonsterIndex(0)
      setPlayerHpRatio(1) // 던전 시작 시 HP 초기화
      setDungeonStartTime(Date.now()) // 시작 시간 기록
      
      // 진행 상황 저장
      dungeonProgressService.saveCurrentState(userId, {
        currentDungeonId: selectedDungeon.id,
        currentFloor: 1,
        currentMonsterIndex: 0,
        playerHpRatio: 1,
        startTime: Date.now(),
        inProgress: true
      })
      
      setShowBattle(true)
    }
  }

  // 보스 전투 액션 핸들러
  const handleBossAction = async (action: 'attack' | 'skill' | 'item' | 'flee') => {
    if (!bossService || !isPlayerTurn) return
    
    setIsPlayerTurn(false)
    
    // 플레이어 행동 처리
    if (action === 'attack') {
      const playerAttack = 50 // 기본 공격력 (실제로는 플레이어 스탯에서 가져와야 함)
      const result = bossService.processPlayerAttack(playerAttack)
      setBossBattleLog(prev => [...prev, `플레이어의 공격! ${result.message}`])
      
      if (result.phaseChanged) {
        setBossBattleLog(prev => [...prev, '💀 보스가 더욱 강해졌다!'])
      }
    }
    
    // 전투 종료 체크
    if (bossService.isBattleOver()) {
      const victory = bossService.getBossState().boss.hp <= 0
      const result = bossService.getBattleResult(victory)
      setBossBattleResult(result)
      return
    }
    
    // 보스 턴
    setTimeout(() => {
      const bossAction = bossService.processBossTurn()
      setBossBattleLog(prev => [...prev, bossAction.message])
      
      // 플레이어 HP 감소 처리
      // TODO: 실제 플레이어 HP 시스템과 연동
      
      // 쿨다운 감소
      bossService.reduceCooldowns()
      
      setIsPlayerTurn(true)
    }, 1000)
  }

  const handleBattleEnd = (victory: boolean) => {
    setBattleVictory(victory)

    if (!selectedDungeon) {
      return
    }

    if (victory) {
      const currentFloorData = selectedDungeon.floors[currentFloor - 1]
      const enemyCount = currentFloorData.count - currentMonsterIndex
      const defeatedCount = Math.min(enemyCount, 3) // 한 번에 최대 3마리와 싸움

      // 처치한 몬스터 수만큼 인덱스 증가
      const newMonsterIndex = currentMonsterIndex + defeatedCount

      // 현재 층의 모든 몬스터를 처치했는지 확인
      if (newMonsterIndex >= currentFloorData.count) {
        // 층 클리어
        if (currentFloor < selectedDungeon.floors.length) {
          // 다음 층이 보스 층인지 확인
          const nextFloorData = selectedDungeon.floors[currentFloor]
          const dungeonBossId = DUNGEON_BOSSES[selectedDungeon.name.toLowerCase().replace(/\s+/g, '_')]
          
          if (nextFloorData.boss && dungeonBossId && BOSS_MONSTERS[dungeonBossId]) {
            // 보스 전투 준비
            setShowBattle(false)
            setShowFloorClear(true)
            
            setTimeout(() => {
              setShowFloorClear(false)
              setCurrentFloor(currentFloor + 1)
              setCurrentMonsterIndex(0)
              
              // 보스 전투 초기화
              const boss = { ...BOSS_MONSTERS[dungeonBossId] }
              const playerCharacter = {
                stats: {
                  hp: 500, // TODO: 실제 플레이어 스탯
                  maxHp: 500,
                  attack: 50,
                  defense: 30
                },
                element: 'normal' as const
              }
              
              const service = new BossBattleService(boss, playerCharacter)
              setBossService(service)
              setBossBattleLog([`${boss.name} ${boss.title}가 나타났다!`])
              setShowBossBattle(true)
            }, 2000)
          } else {
            // 일반 층으로 진행
            setShowBattle(false)
            setShowFloorClear(true)
            
            setTimeout(() => {
              setShowFloorClear(false)
              setCurrentFloor(currentFloor + 1)
              setCurrentMonsterIndex(0)
              setTimeout(() => {
                setShowBattle(true)
              }, 100)
            }, 2000)
          }
          
          // 진행 상황 업데이트
          dungeonProgressService.saveCurrentState(userId, {
            currentDungeonId: selectedDungeon.id,
            currentFloor: currentFloor + 1,
            currentMonsterIndex: 0,
            playerHpRatio: playerHpRatio,
            startTime: dungeonStartTime,
            inProgress: true
          })
        } else {
          // 던전 완료
          const clearTime = Date.now() - dungeonStartTime
          const isFirstClear = dungeonProgressService.isFirstClear(userId, selectedDungeon.id)
          
          // 던전 클리어 행동 기록
          PlayerBehaviorService.recordDungeonActivity('current-user', {
            dungeonId: selectedDungeon.id.toString(),
            dungeonType: selectedDungeon.floors.length <= 3 ? 'easy' : 
                        selectedDungeon.floors.length <= 5 ? 'normal' : 
                        selectedDungeon.floors.length <= 7 ? 'hard' : 'expert',
            clearTime,
            difficulty: selectedDifficulty || 'normal',
            cleared: true
          })
          
          // 보상 계산 (코인) - 난이도 적용
          const baseCoin = selectedDungeon.level * 50
          const baseReward = isFirstClear ? baseCoin : Math.floor(baseCoin * 0.1)
          
          // 난이도 보너스 적용
          const difficultyModifiers = DifficultyService.getDifficultyModifiers()
          const coinEarned = Math.floor(baseReward * difficultyModifiers.goldMultiplier)
          
          // 아이템 보상 계산 - 난이도 적용
          const baseItemRewards = calculateDungeonRewards(selectedDungeon.id, isFirstClear)
          const itemRewards = baseItemRewards.map(reward => ({
            ...reward,
            // 아이템 드랍률에 난이도 배율 적용
            quantity: Math.ceil(reward.quantity * difficultyModifiers.itemDropRateMultiplier)
          }))
          const rewardDetails: Array<{ itemId: string; name: string; quantity: number; icon: string }> = []
          
          // 아이템 지급 및 정보 수집
          itemRewards.forEach(reward => {
            const item = getItemById(reward.itemId)
            if (item) {
              const success = inventoryService.addItem(userId, reward.itemId, reward.quantity)
              if (success) {
                rewardDetails.push({
                  itemId: reward.itemId,
                  name: item.name,
                  quantity: reward.quantity,
                  icon: item.icon
                })
              }
            }
          })
          
          setItemRewards(rewardDetails)
          
          // 코인 지급
          const { addCoins } = useUserStore.getState()
          addCoins(coinEarned)
          
          // 클리어 기록 저장 및 마일스톤 확인
          const { newMilestones } = dungeonProgressService.recordDungeonClear(userId, selectedDungeon.id, clearTime, coinEarned)
          
          // 마일스톤 달성 시 추가 보상 반영
          if (newMilestones.length > 0) {
            const milestoneCoins = newMilestones.reduce((sum, m) => sum + m.goldReward, 0)
            setMilestoneRewards({ milestones: newMilestones, totalGold: milestoneCoins })
            // 마일스톤 코인도 지급
            addCoins(milestoneCoins)
          }
          
          // 퀘스트 진행도 업데이트
          updateDungeonQuests(selectedDungeon.id)
          
          // 진행 상황 초기화
          dungeonProgressService.clearCurrentState(userId)
          
          setShowBattle(false)
          setDungeonComplete(true)
          setShowResult(true)
          setTimeout(() => {
            setShowResult(false)
            setSelectedDungeon(null)
            setCurrentFloor(1)
            setCurrentMonsterIndex(0)
            setDungeonComplete(false)
            setMilestoneRewards(null)
            setItemRewards([])
            loadDungeonProgress() // 진행 상황 새로고침
          }, milestoneRewards || itemRewards.length > 0 ? 8000 : 3000)
        }
      } else {
        // 같은 층의 남은 몬스터와 전투 - 전투 화면을 닫지 않고 계속 진행
        setCurrentMonsterIndex(newMonsterIndex)
      }
    } else {
      // 패배
      // 진행 상황 초기화
      dungeonProgressService.clearCurrentState(userId)
      
      setShowBattle(false)
      setShowResult(true)
      setTimeout(() => {
        setShowResult(false)
        setSelectedDungeon(null)
        setCurrentFloor(1)
        setCurrentMonsterIndex(0)
      }, 3000)
    }
  }

  const handleCloseModal = () => {
    setSelectedDungeon(null)
  }
  
  // 던전 관련 퀘스트 진행도 업데이트
  const updateDungeonQuests = (dungeonId: number) => {
    // 모든 활성 퀘스트 확인
    quests.forEach(quest => {
      if (quest.status === 'in_progress') {
        quest.objectives.forEach(objective => {
          if (objective.type === 'dungeon' && !objective.completed) {
            // 특정 던전 ID 매칭 또는 아무 던전
            if (objective.target === dungeonId.toString() || objective.target === 'any') {
              updateQuestProgress(quest.id, objective.id, objective.current + 1)
            }
          }
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* 던전 목록 */}
      <div className="grid gap-3">
        {DUNGEONS.map((dungeon) => (
          <motion.button
            key={dungeon.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectDungeon(dungeon)}
            aria-label={`${dungeon.name} 던전 선택 - 권장 레벨 ${dungeon.level}`}
            className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-4 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sword className="w-5 h-5 text-purple-400" />
                  {dungeon.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{dungeon.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-purple-400">권장 레벨: {dungeon.level}</p>
                  <p className={`text-xs font-bold ${
                    dungeon.difficulty === 'easy' ? 'text-green-400' :
                      dungeon.difficulty === 'normal' ? 'text-blue-400' :
                        dungeon.difficulty === 'hard' ? 'text-yellow-400' :
                          dungeon.difficulty === 'expert' ? 'text-orange-400' :
                            dungeon.difficulty === 'legendary' ? 'text-red-400' :
                              dungeon.difficulty === 'mythic' ? 'text-purple-400' :
                                'text-pink-400'
                  }`}>난이도: {dungeon.difficulty.toUpperCase()}</p>
                </div>
                {dungeonProgress[dungeon.id] && dungeonProgress[dungeon.id].totalClears > 0 && (
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-green-400">
                      클리어: {dungeonProgress[dungeon.id].totalClears}회
                    </p>
                    {dungeonProgress[dungeon.id].bestTime && (
                      <p className="text-xs text-blue-400">
                        최고기록: {Math.floor(dungeonProgress[dungeon.id].bestTime / 1000)}초
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <ChevronRight className="w-5 h-5 text-gray-500" />
                {dungeonProgress[dungeon.id] && dungeonProgress[dungeon.id].totalClears === 0 && (
                  <span className="text-xs text-yellow-400 mt-2">첫 도전!</span>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* 던전 선택 모달 */}
      {selectedDungeon && !showBattle && !showResult && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedDungeon.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">{selectedDungeon.description}</p>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">던전 정보</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">권장 레벨: <span className="text-purple-400">{selectedDungeon.level}</span></p>
                  <p className="text-gray-300">총 층수: <span className="text-blue-400">{selectedDungeon.floors.length}층</span></p>
                </div>
              </div>

              {/* 난이도 선택기 */}
              <DifficultySelector
                currentDifficulty={selectedDifficulty}
                onDifficultyChange={(difficulty) => {
                  setSelectedDifficulty(difficulty)
                  DifficultyService.setDifficulty(difficulty)
                }}
                playerLevel={userLevel}
                recommendedLevel={selectedDungeon.level}
              />

              <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">층별 몬스터</h3>
                <div className="space-y-2 text-sm">
                  {selectedDungeon.floors.map((floor) => (
                    <div key={floor.floor} className={`${floor.boss ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                      <p>{floor.floor}층: {floor.monster.emoji} {floor.monster.name} x{floor.count} {floor.boss && '(보스)'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartBattle}
                aria-label={`${selectedDungeon.name} 던전에 입장하기`}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                입장하기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 보스 전투 화면 */}
      {showBossBattle && selectedDungeon && bossService && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {!bossBattleResult ? (
              <BossBattleUI
                boss={bossService.getBossState().boss}
                currentPhase={bossService.getBossState().boss.currentPhase}
                battleLog={bossBattleLog}
                onPlayerAction={handleBossAction}
                isPlayerTurn={isPlayerTurn}
              />
            ) : (
              <BossRewardScreen
                result={bossBattleResult}
                bossName={bossService.getBossState().boss.name}
                onContinue={() => {
                  setShowBossBattle(false)
                  setBossBattleResult(null)
                  handleBattleEnd(bossBattleResult.victory)
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 일반 전투 화면 */}
      {showBattle && !showBossBattle && selectedDungeon && (() => {
        const currentFloorData = selectedDungeon.floors[currentFloor - 1]
        const monster = currentFloorData.monster
        const isBoss = currentFloorData.boss

        // 다중 몬스터 전투를 위한 적 배열 생성 - 새로운 몬스터 시스템 사용
        const enemyCount = currentFloorData.count - currentMonsterIndex
        const battleEnemyCount = Math.min(enemyCount, 3)
        
        // 던전 난이도에 따른 몬스터 선택
        const difficulty = selectedDungeon.difficulty === 'easy' ? 'beginner' :
                          selectedDungeon.difficulty === 'normal' ? 'intermediate' :
                          selectedDungeon.difficulty === 'hard' || selectedDungeon.difficulty === 'expert' ? 'advanced' : 'expert'
        
        const enhancedMonsters = getRandomMonsters(
          difficulty as 'beginner' | 'intermediate' | 'advanced' | 'expert',
          battleEnemyCount,
          selectedDungeon.level + (currentFloor - 1) * 2
        )
        
        // 난이도 적용
        const enemies = enhancedMonsters.map(monster => {
          const baseEnemy = {
            name: isBoss && currentFloorData.special ? currentFloorData.special : monster.name,
            emoji: monster.emoji,
            stats: {
              ...monster.stats,
              specialAbility: monster.specialAbility
            },
            aiPattern: monster.aiPattern
          }
          
          // DifficultyService를 통해 난이도 적용
          const enemyData = {
            id: 0,
            name: baseEnemy.name,
            emoji: baseEnemy.emoji,
            hp: baseEnemy.stats.hp,
            maxHp: baseEnemy.stats.hp,
            attack: baseEnemy.stats.attack,
            defense: baseEnemy.stats.defense,
            speed: baseEnemy.stats.speed || 1.0,
            specialAbility: baseEnemy.stats.specialAbility,
            element: baseEnemy.stats.element,
            aiPattern: baseEnemy.aiPattern,
            statusEffects: [],
            statusResistance: 0
          }
          
          const modifiedEnemy = DifficultyService.applyDifficultyToEnemy(enemyData, selectedDifficulty)
          
          return {
            name: modifiedEnemy.name,
            emoji: modifiedEnemy.emoji,
            stats: {
              hp: modifiedEnemy.hp,
              attack: modifiedEnemy.attack,
              defense: modifiedEnemy.defense,
              speed: modifiedEnemy.speed,
              specialAbility: modifiedEnemy.specialAbility,
              element: modifiedEnemy.element
            },
            aiPattern: modifiedEnemy.aiPattern
          }
        })

        return (
          <SimpleBattleScreen
            key={`${selectedDungeon.id}-${currentFloor}-${currentMonsterIndex}`}
            enemies={enemies}
            enemyLevel={selectedDungeon.level + (currentFloor - 1) * 2}
            playerLevel={userLevel}
            initialHpRatio={playerHpRatio}
            onBattleEnd={(victory, hpRatio) => {
              setPlayerHpRatio(hpRatio || 1)
              handleBattleEnd(victory)
            }}
            floorInfo={{
              currentFloor,
              totalFloors: selectedDungeon.floors.length,
              dungeonName: selectedDungeon.name
            }}
          />
        )
      })()}

      {/* 층 클리어 화면 - 전투 화면 위에 오버레이로 표시 */}
      {showFloorClear && selectedDungeon && currentFloor < selectedDungeon.floors.length && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-8 text-center shadow-2xl border border-purple-500"
          >
            <div className="text-6xl mb-4">⬆️</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentFloor}층 클리어!
            </h2>
            <p className="text-gray-400">
              다음 층으로 이동합니다...
            </p>
            {selectedDungeon.floors[currentFloor] && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">다음 층</p>
                <p className="text-lg text-purple-400 font-bold">
                  {currentFloor + 1}층: {selectedDungeon.floors[currentFloor].monster.emoji} {selectedDungeon.floors[currentFloor].monster.name}
                  {selectedDungeon.floors[currentFloor].count > 1 && ` x${selectedDungeon.floors[currentFloor].count}`}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 결과 화면 */}
      {showResult && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-8 text-center max-w-lg w-full"
          >
            <div className="text-6xl mb-4">
              {dungeonComplete ? '🏆' : battleVictory ? '🎉' : '💀'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {dungeonComplete ? '던전 완료!' : battleVictory ? '승리!' : '패배...'}
            </h2>
            <p className="text-gray-400 mb-4">
              {dungeonComplete ? `${selectedDungeon?.name} 클리어!` :
                battleVictory ? '보상을 획득했습니다!' :
                  `${currentFloor}층에서 쓰러졌습니다...`}
            </p>
            
            {/* 보상 표시 - 골드와 아이템 */}
            {dungeonComplete && selectedDungeon && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 space-y-3"
              >
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-400 mb-2">획득 보상:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400">💰 코인</span>
                      <span className="text-yellow-400 font-bold">
                        +{(selectedDungeon.level * 50 * (dungeonProgressService.isFirstClear(userId, selectedDungeon.id) ? 1 : 0.1)).toLocaleString()}
                      </span>
                    </div>
                    {itemRewards.map((item, index) => (
                      <motion.div
                        key={item.itemId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-300 flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          {item.name}
                        </span>
                        <span className="text-green-400 font-bold">x{item.quantity}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* 마일스톤 달성 표시 */}
            {milestoneRewards && milestoneRewards.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-6 p-4 bg-purple-900/50 rounded-lg border-2 border-purple-500"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 2, type: "spring", bounce: 0.5 }}
                  className="text-4xl mb-2"
                >
                  🎊
                </motion.div>
                <h3 className="text-xl font-bold text-purple-300 mb-3">
                  히든 마일스톤 달성!
                </h3>
                <div className="space-y-2">
                  {milestoneRewards.milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.threshold}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.5 + index * 0.3 }}
                      className="bg-gray-800/50 rounded p-2"
                    >
                      <p className="text-sm text-purple-400 font-semibold">
                        "{milestone.title}" 칭호 획득!
                      </p>
                      <p className="text-xs text-gray-400">
                        클리어 {milestone.threshold}회 달성
                      </p>
                      <p className="text-sm text-yellow-400 mt-1">
                        +{milestone.goldReward.toLocaleString()} 코인
                      </p>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.5 }}
                  className="text-lg text-yellow-300 font-bold mt-3"
                >
                  총 보너스: +{milestoneRewards.totalGold.toLocaleString()} 코인
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
