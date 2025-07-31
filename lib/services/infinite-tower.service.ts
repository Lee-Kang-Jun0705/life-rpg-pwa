/**
 * 무한의 탑 서비스
 * 끝없이 올라가며 점점 강해지는 적들과 싸우는 엔드게임 컨텐츠
 */

import type { 
  InfiniteTowerProgress, 
  TowerBuff, 
  TowerMonsterModifier,
  TowerFloorReward,
  InfiniteTowerRanking,
  DungeonItem
} from '@/lib/types/dungeon'
import type { MonsterData } from '@/lib/types/battle-extended'
import type { Character } from '@/lib/types/game-core'
import { dungeonCombatService } from './dungeon-combat.service'
import { itemGenerationService } from './item-generation.service'
import { dbHelpers } from '@/lib/database/client'
import { EXTENDED_MONSTER_DATABASE } from '@/lib/battle/monster-database-extended'
import { DUNGEON_ITEMS } from '@/lib/dungeon/dungeon-data'

// 무한의 탑 설정
const TOWER_CONFIG = {
  CHECKPOINT_INTERVAL: 10, // 10층마다 체크포인트
  BUFF_SHOP_INTERVAL: 5, // 5층마다 버프 상점
  REST_FLOOR_INTERVAL: 25, // 25층마다 휴식
  BOSS_FLOOR_INTERVAL: 10, // 10층마다 보스
  SPECIAL_BOSS_INTERVAL: 50, // 50층마다 특별 보스
  
  // 난이도 증가율
  DIFFICULTY_SCALING: {
    HP_PER_FLOOR: 0.1, // 층당 10% HP 증가
    ATTACK_PER_FLOOR: 0.1, // 층당 10% 공격력 증가
    DEFENSE_PER_FLOOR: 0.05, // 층당 5% 방어력 증가
    SPEED_PER_FLOOR: 0.02, // 층당 2% 속도 증가
    EXP_PER_FLOOR: 0.15, // 층당 15% 경험치 증가
    GOLD_PER_FLOOR: 0.2, // 층당 20% 골드 증가
  },
  
  // 특수 능력 해금 층수
  SPECIAL_ABILITIES: {
    20: ['buff_self'], // 20층부터 버프 능력
    40: ['heal_self'], // 40층부터 회복 능력
    60: ['summon_minions'], // 60층부터 소환 능력
    80: ['area_attack'], // 80층부터 광역 공격
    100: ['instant_death'], // 100층부터 즉사 공격
  }
}

// 버프 상점 아이템
const TOWER_BUFFS: TowerBuff[] = [
  {
    id: 'tower-buff-attack-1',
    name: '공격력 증강',
    description: '10층 동안 공격력 20% 증가',
    icon: '⚔️',
    type: 'attack',
    value: 20,
    duration: 10,
    remainingFloors: 10
  },
  {
    id: 'tower-buff-defense-1',
    name: '방어력 증강',
    description: '10층 동안 방어력 30% 증가',
    icon: '🛡️',
    type: 'defense',
    value: 30,
    duration: 10,
    remainingFloors: 10
  },
  {
    id: 'tower-buff-health-1',
    name: '체력 증강',
    description: '10층 동안 최대 체력 50% 증가',
    icon: '❤️',
    type: 'health',
    value: 50,
    duration: 10,
    remainingFloors: 10
  },
  {
    id: 'tower-buff-speed-1',
    name: '속도 증강',
    description: '10층 동안 속도 25% 증가',
    icon: '⚡',
    type: 'speed',
    value: 25,
    duration: 10,
    remainingFloors: 10
  },
  {
    id: 'tower-buff-special-1',
    name: '재생의 축복',
    description: '매 층 시작시 HP 20% 회복',
    icon: '✨',
    type: 'special',
    value: 20,
    duration: 5,
    remainingFloors: 5
  }
]

export class InfiniteTowerService {
  private static instance: InfiniteTowerService
  private towerProgress: Map<string, InfiniteTowerProgress> = new Map()
  private rankings: InfiniteTowerRanking[] = []

  static getInstance(): InfiniteTowerService {
    if (!this.instance) {
      this.instance = new InfiniteTowerService()
    }
    return this.instance
  }

  /**
   * 무한의 탑 진입
   */
  async enterTower(userId: string, fromCheckpoint: boolean = false): Promise<{
    success: boolean
    floor: number
    error?: string
  }> {
    try {
      // 진행 상황 가져오기 또는 생성
      let progress = this.towerProgress.get(userId)
      
      if (!progress) {
        progress = await this.loadOrCreateProgress(userId)
      }

      // 시작 층 결정
      let startFloor = 1
      if (fromCheckpoint && progress.lastCheckpoint > 0) {
        startFloor = progress.lastCheckpoint
      }

      // 진행 상황 업데이트
      progress.currentFloor = startFloor
      progress.currentRunStartTime = Date.now()
      progress.stats.totalRuns++

      // 체크포인트에서 시작하면 버프 초기화
      if (fromCheckpoint) {
        progress.activeBuffs = []
      }

      this.towerProgress.set(userId, progress)
      await this.saveProgress(userId, progress)

      return { success: true, floor: startFloor }
    } catch (error) {
      console.error('Failed to enter tower:', error)
      return { success: false, floor: 0, error: '탑 진입에 실패했습니다.' }
    }
  }

  /**
   * 층별 몬스터 생성
   */
  generateFloorMonsters(floor: number): MonsterData[] {
    const monsters: MonsterData[] = []
    const modifier = this.calculateModifier(floor)
    
    // 보스 층
    if (floor % TOWER_CONFIG.BOSS_FLOOR_INTERVAL === 0) {
      const bossMonster = this.generateBossMonster(floor, modifier)
      monsters.push(bossMonster)
      
      // 특별 보스 층은 보스만
      if (floor % TOWER_CONFIG.SPECIAL_BOSS_INTERVAL === 0) {
        return monsters
      }
      
      // 일반 보스 층은 부하들도 추가
      const minionCount = Math.min(2 + Math.floor(floor / 20), 5)
      for (let i = 0; i < minionCount; i++) {
        monsters.push(this.generateMonster(floor, modifier, 'minion'))
      }
    } else {
      // 일반 층
      const monsterCount = Math.min(3 + Math.floor(floor / 10), 8)
      for (let i = 0; i < monsterCount; i++) {
        monsters.push(this.generateMonster(floor, modifier))
      }
    }

    return monsters
  }

  /**
   * 일반 몬스터 생성
   */
  private generateMonster(
    floor: number, 
    modifier: TowerMonsterModifier,
    type: 'normal' | 'minion' = 'normal'
  ): MonsterData {
    // 층수에 따른 몬스터 풀 결정
    const monsterPool = this.getMonsterPool(floor)
    const baseMonster = monsterPool[Math.floor(Math.random() * monsterPool.length)]
    
    // 복사본 생성
    const monsterCopy = JSON.parse(JSON.stringify(baseMonster))
    
    // 스탯 적용
    const multiplier = type === 'minion' ? 0.7 : 1
    const newHp = Math.floor(monsterCopy.stats.hp * modifier.hpMultiplier * multiplier)
    
    // 새로운 몬스터 객체 생성
    const monster: MonsterData = {
      ...monsterCopy,
      id: `${monsterCopy.id}_floor${floor}_${Date.now()}`,
      name: `${floor}층 ${monsterCopy.name}`,
      stats: {
        ...monsterCopy.stats,
        hp: newHp,
        maxHp: newHp,
        attack: Math.floor(monsterCopy.stats.attack * modifier.attackMultiplier * multiplier),
        defense: Math.floor(monsterCopy.stats.defense * modifier.defenseMultiplier * multiplier),
        speed: Math.floor(monsterCopy.stats.speed * modifier.speedMultiplier)
      }
    }
    
    // 특수 능력 추가
    // TODO: 읽기 전용 객체 수정 문제 해결 필요
    // this.addSpecialAbilities(monster, floor)
    
    return monster
  }

  /**
   * 보스 몬스터 생성
   */
  private generateBossMonster(floor: number, modifier: TowerMonsterModifier): MonsterData {
    // 기본 보스 선택
    const bossPool = this.getBossPool(floor)
    const baseBoss = bossPool[Math.floor(Math.random() * bossPool.length)]
    
    const bossCopy = JSON.parse(JSON.stringify(baseBoss))
    
    // 보스 스탯 보정
    const bossMultiplier = floor % TOWER_CONFIG.SPECIAL_BOSS_INTERVAL === 0 ? 3 : 2
    const newHp = Math.floor(bossCopy.stats.hp * modifier.hpMultiplier * bossMultiplier)
    
    const boss: MonsterData = {
      ...bossCopy,
      id: `${bossCopy.id}_floor${floor}_boss`,
      name: `${floor}층 보스 - ${bossCopy.name}`,
      tier: floor % TOWER_CONFIG.SPECIAL_BOSS_INTERVAL === 0 ? 'legendary' : 'boss',
      stats: {
        ...bossCopy.stats,
        hp: newHp,
        maxHp: newHp,
        attack: Math.floor(bossCopy.stats.attack * modifier.attackMultiplier * 1.5),
        defense: Math.floor(bossCopy.stats.defense * modifier.defenseMultiplier * 1.5),
        speed: Math.floor(bossCopy.stats.speed * modifier.speedMultiplier)
      }
    }
    
    // 보스 특수 능력
    // TODO: 읽기 전용 객체 수정 문제 해결 필요
    // this.addSpecialAbilities(boss, floor)
    // this.addBossAbilities(boss, floor)
    
    return boss
  }

  /**
   * 몬스터 풀 가져오기
   */
  private getMonsterPool(floor: number): MonsterData[] {
    const allMonsters = Object.values(EXTENDED_MONSTER_DATABASE)
    
    if (floor <= 10) {
      return allMonsters.filter(m => m.stats.level <= 10)
    } else if (floor <= 30) {
      return allMonsters.filter(m => m.stats.level <= 25)
    } else if (floor <= 50) {
      return allMonsters.filter(m => m.stats.level <= 40)
    } else if (floor <= 75) {
      return allMonsters.filter(m => m.stats.level <= 55)
    } else {
      return allMonsters // 모든 몬스터
    }
  }

  /**
   * 보스 풀 가져오기
   */
  private getBossPool(floor: number): MonsterData[] {
    const allMonsters = Object.values(EXTENDED_MONSTER_DATABASE)
    const bosses = allMonsters.filter(m => m.tier === 'boss' || m.tier === 'elite')
    
    if (floor <= 20) {
      return bosses.filter(m => m.stats.level <= 20)
    } else if (floor <= 50) {
      return bosses.filter(m => m.stats.level <= 40)
    } else {
      return bosses
    }
  }

  /**
   * 특수 능력 추가
   */
  private addSpecialAbilities(monster: MonsterData, floor: number) {
    // TODO: 읽기 전용 배열 수정 문제 해결 필요
    // Object.entries(TOWER_CONFIG.SPECIAL_ABILITIES).forEach(([minFloor, abilities]) => {
    //   if (floor >= parseInt(minFloor)) {
    //     // 해당 층수 이상이면 능력 추가
    //     abilities.forEach(ability => {
    //       if (!monster.skills.some(s => s.id === ability)) {
    //         // 능력에 맞는 스킬 추가 (실제 구현시 상세 스킬 데이터 필요)
    //         monster.skills.push({
    //         id: ability,
    //         name: this.getAbilityName(ability),
    //         description: this.getAbilityDescription(ability),
    //         type: 'special',
    //         power: 100 + floor,
    //         mpCost: 20,
    //         cooldown: 5,
    //         currentCooldown: 0,
    //         targetType: 'all',
    //         range: 3,
    //         animation: 'special',
    //         accuracy: 90,
    //         damageType: 'magical',
    //         element: 'neutral'
    //       })
    //     }
    //   })
    // }
    // })
  }

  /**
   * 보스 특수 능력 추가
   */
  private addBossAbilities(boss: MonsterData, floor: number) {
    // TODO: 읽기 전용 배열 수정 문제 해결 필요
    // // 층수에 따른 추가 능력
    // if (floor >= 50) {
    //   boss.skills.push({
    //     id: 'boss_rage',
    //     name: '보스의 분노',
    //     description: 'HP가 50% 이하일 때 모든 스탯 2배 증가',
    //     type: 'passive',
    //     power: 0,
    //     mpCost: 0,
    //     cooldown: 0,
    //     currentCooldown: 0,
    //     targetType: 'self',
    //     range: 0,
    //     animation: 'rage',
    //     accuracy: 100,
    //     damageType: 'physical',
    //     element: 'neutral'
    //   })
    // }
    
    // if (floor >= 100) {
    //   boss.skills.push({
    //     id: 'boss_instant_death',
    //     name: '죽음의 선고',
    //     description: '10% 확률로 즉사',
    //     type: 'damage',
    //     power: 9999,
    //     mpCost: 50,
    //     cooldown: 10,
    //     currentCooldown: 0,
    //     targetType: 'single',
    //     range: 5,
    //     animation: 'death',
    //     accuracy: 10,
    //     damageType: 'magical',
    //     element: 'dark'
    //   })
    // }
  }

  /**
   * 난이도 계산
   */
  private calculateModifier(floor: number): TowerMonsterModifier {
    const scaling = TOWER_CONFIG.DIFFICULTY_SCALING
    
    return {
      floor,
      hpMultiplier: 1 + (floor * scaling.HP_PER_FLOOR),
      attackMultiplier: 1 + (floor * scaling.ATTACK_PER_FLOOR),
      defenseMultiplier: 1 + (floor * scaling.DEFENSE_PER_FLOOR),
      speedMultiplier: 1 + (floor * scaling.SPEED_PER_FLOOR),
      expMultiplier: 1 + (floor * scaling.EXP_PER_FLOOR),
      goldMultiplier: 1 + (floor * scaling.GOLD_PER_FLOOR),
      specialAbilities: this.getFloorAbilities(floor)
    }
  }

  /**
   * 층 클리어 처리
   */
  async clearFloor(
    userId: string, 
    floor: number,
    clearData: {
      clearTime: number
      monstersDefeated: number
      damageDealt: number
      damageTaken: number
    }
  ): Promise<TowerFloorReward> {
    const progress = this.towerProgress.get(userId)
    if (!progress) {
      throw new Error('Tower progress not found')
    }

    // 층 기록 저장
    progress.floorRecords.set(floor, {
      clearedAt: Date.now(),
      ...clearData
    })

    // 통계 업데이트
    progress.totalMonstersDefeated += clearData.monstersDefeated
    progress.totalTimeSpent += clearData.clearTime
    progress.stats.totalFloorsCleared++
    
    // 최고 기록 갱신
    if (floor > progress.highestFloor) {
      progress.highestFloor = floor
      await this.updateRanking(userId, floor)
    }

    // 체크포인트 갱신
    if (floor % TOWER_CONFIG.CHECKPOINT_INTERVAL === 0) {
      progress.lastCheckpoint = floor
    }

    // 다음 층으로
    progress.currentFloor = floor + 1

    // 버프 지속시간 감소
    progress.activeBuffs = progress.activeBuffs
      .map(buff => ({
        ...buff,
        remainingFloors: buff.remainingFloors - 1
      }))
      .filter(buff => buff.remainingFloors > 0)

    // 보상 계산
    const reward = this.calculateReward(floor, progress)

    // 진행 상황 저장
    await this.saveProgress(userId, progress)

    return reward
  }

  /**
   * 보상 계산
   */
  private calculateReward(floor: number, progress: InfiniteTowerProgress): TowerFloorReward {
    const modifier = this.calculateModifier(floor)
    
    const reward: TowerFloorReward = {
      floor,
      gold: Math.floor(100 * modifier.goldMultiplier),
      exp: Math.floor(50 * modifier.expMultiplier),
      towerCurrency: Math.floor(10 + floor / 5),
      items: []
    }

    // 5층마다 아이템
    if (floor % 5 === 0) {
      reward.items = [this.generateFloorItem(floor)]
    }

    // 10층마다 희귀 아이템
    if (floor % 10 === 0) {
      reward.items?.push(this.generateFloorItem(floor, 'rare'))
    }

    // 25층마다 영웅 아이템
    if (floor % 25 === 0) {
      reward.items?.push(this.generateFloorItem(floor, 'epic'))
    }

    // 50층마다 전설 아이템
    if (floor % 50 === 0) {
      reward.items?.push(this.generateFloorItem(floor, 'legendary'))
    }

    // 최초 클리어 보너스
    if (!progress.floorRecords.has(floor)) {
      reward.firstClearBonus = {
        gold: reward.gold * 2,
        exp: reward.exp * 2,
        items: [this.generateFloorItem(floor, 'rare')]
      }
    }

    // 마일스톤 보상
    if (floor === 10 || floor === 25 || floor === 50 || floor === 100) {
      reward.milestoneReward = {
        type: 'item',
        value: this.generateMilestoneReward(floor)
      }
    }

    return reward
  }

  /**
   * 층별 아이템 생성
   */
  private generateFloorItem(floor: number, rarity?: string): DungeonItem {
    // 임시 구현 - 실제로는 itemGenerationService 사용
    const rarityMap = {
      common: DUNGEON_ITEMS['health-potion'],
      rare: DUNGEON_ITEMS['magic-ring'],
      epic: DUNGEON_ITEMS['steel-armor'],
      legendary: DUNGEON_ITEMS['legendary-blade']
    }

    const itemRarity = rarity || (
      floor >= 50 ? 'legendary' :
      floor >= 25 ? 'epic' :
      floor >= 10 ? 'rare' : 'common'
    )

    return rarityMap[itemRarity as keyof typeof rarityMap] || DUNGEON_ITEMS['health-potion']
  }

  /**
   * 마일스톤 보상 생성
   */
  private generateMilestoneReward(floor: number): unknown {
    // 층별 특별 보상
    const milestoneRewards: Record<number, any> = {
      10: { id: 'tower-badge-bronze', name: '청동 탑 배지', type: 'badge' },
      25: { id: 'tower-badge-silver', name: '은 탑 배지', type: 'badge' },
      50: { id: 'tower-badge-gold', name: '금 탑 배지', type: 'badge' },
      100: { id: 'tower-badge-platinum', name: '플래티넘 탑 배지', type: 'badge' }
    }

    return milestoneRewards[floor] || null
  }

  /**
   * 버프 상점 아이템 가져오기
   */
  getBuffShopItems(floor: number): TowerBuff[] {
    // 층수에 따라 더 강력한 버프 제공
    const availableBuffs = TOWER_BUFFS.map(buff => ({
      ...buff,
      value: buff.value * (1 + Math.floor(floor / 50) * 0.5),
      duration: buff.duration + Math.floor(floor / 25) * 5
    }))

    return availableBuffs
  }

  /**
   * 버프 구매
   */
  async purchaseBuff(userId: string, buffId: string): Promise<boolean> {
    const progress = this.towerProgress.get(userId)
    if (!progress) return false

    const buff = TOWER_BUFFS.find(b => b.id === buffId)
    if (!buff) return false

    // 타워 화폐 확인 및 차감 (임시로 100 고정)
    // TODO: 실제 화폐 시스템 연동
    
    // 버프 추가
    progress.activeBuffs.push({
      ...buff,
      remainingFloors: buff.duration
    })

    await this.saveProgress(userId, progress)
    return true
  }

  /**
   * 휴식 층 처리
   */
  async restOnFloor(userId: string): Promise<void> {
    const progress = this.towerProgress.get(userId)
    if (!progress) return

    // HP/MP 완전 회복 처리는 전투 시스템에서
    // 여기서는 진행 상황만 저장
    await this.saveProgress(userId, progress)
  }

  /**
   * 랭킹 업데이트
   */
  private async updateRanking(userId: string, floor: number): Promise<void> {
    // TODO: 실제 유저 정보 가져오기
    const userName = `Player_${userId}`
    
    const existingRank = this.rankings.findIndex(r => r.userId === userId)
    const rankData: InfiniteTowerRanking = {
      userId,
      userName,
      highestFloor: floor,
      totalFloorsCleared: this.towerProgress.get(userId)?.stats.totalFloorsCleared || 0,
      lastUpdated: Date.now()
    }

    if (existingRank >= 0) {
      this.rankings[existingRank] = rankData
    } else {
      this.rankings.push(rankData)
    }

    // 최고 층수 기준 정렬
    this.rankings.sort((a, b) => b.highestFloor - a.highestFloor)
    
    // 순위 업데이트
    this.rankings.forEach((rank, index) => {
      rank.rank = index + 1
    })

    // TODO: DB에 저장
  }

  /**
   * 랭킹 가져오기
   */
  getRankings(type: 'daily' | 'weekly' | 'all' = 'all', limit: number = 100): InfiniteTowerRanking[] {
    // TODO: 실제로는 기간별 필터링 필요
    return this.rankings.slice(0, limit)
  }

  /**
   * 진행 상황 저장/로드
   */
  private async saveProgress(userId: string, progress: InfiniteTowerProgress): Promise<void> {
    // TODO: 실제 DB 저장
    localStorage.setItem(`tower_progress_${userId}`, JSON.stringify(progress))
  }

  private async loadOrCreateProgress(userId: string): Promise<InfiniteTowerProgress> {
    // TODO: 실제 DB 로드
    const saved = localStorage.getItem(`tower_progress_${userId}`)
    
    if (saved) {
      const progress = JSON.parse(saved)
      // Map 복원
      progress.floorRecords = new Map(Object.entries(progress.floorRecords || {}))
      return progress
    }

    // 새 진행 상황 생성
    const newProgress: InfiniteTowerProgress = {
      currentFloor: 1,
      highestFloor: 0,
      lastCheckpoint: 0,
      totalMonstersDefeated: 0,
      totalTimeSpent: 0,
      currentRunStartTime: Date.now(),
      floorRecords: new Map(),
      activeBuffs: [],
      stats: {
        totalRuns: 0,
        bestRunFloor: 0,
        totalFloorsCleared: 0,
        averageFloorTime: 0
      }
    }

    this.towerProgress.set(userId, newProgress)
    return newProgress
  }

  /**
   * 특수 능력 이름/설명 헬퍼
   */
  private getAbilityName(abilityId: string): string {
    const names: Record<string, string> = {
      'buff_self': '자체 강화',
      'heal_self': '자가 치유',
      'summon_minions': '부하 소환',
      'area_attack': '광역 공격',
      'instant_death': '즉사 공격'
    }
    return names[abilityId] || abilityId
  }

  private getAbilityDescription(abilityId: string): string {
    const descriptions: Record<string, string> = {
      'buff_self': '자신의 능력치를 강화합니다',
      'heal_self': 'HP를 회복합니다',
      'summon_minions': '부하를 소환합니다',
      'area_attack': '모든 적에게 피해를 입힙니다',
      'instant_death': '일정 확률로 즉사시킵니다'
    }
    return descriptions[abilityId] || ''
  }

  private getFloorAbilities(floor: number): string[] {
    const abilities: string[] = []
    Object.entries(TOWER_CONFIG.SPECIAL_ABILITIES).forEach(([minFloor, floorAbilities]) => {
      if (floor >= parseInt(minFloor)) {
        abilities.push(...floorAbilities)
      }
    })
    return abilities
  }
}

export const infiniteTowerService = InfiniteTowerService.getInstance()