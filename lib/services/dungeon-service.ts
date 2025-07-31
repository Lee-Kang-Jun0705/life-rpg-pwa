'use client'

import type { 
  Dungeon, 
  DungeonFilter, 
  DungeonProgress, 
  DungeonClearRecord,
  DungeonStats,
  DungeonStage
} from '@/lib/types/dungeon'
import { DUNGEONS } from '@/lib/dungeon/dungeon-data'

export class DungeonService {
  private static instance: DungeonService
  private dungeons: Map<string, Dungeon> = new Map()
  private userProgress: Map<string, DungeonProgress> = new Map()
  private clearRecords: Map<string, DungeonClearRecord[]> = new Map()

  static getInstance(): DungeonService {
    if (!DungeonService.instance) {
      DungeonService.instance = new DungeonService()
    }
    return DungeonService.instance
  }

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // 던전 데이터 초기화
    DUNGEONS.forEach(dungeon => {
      this.dungeons.set(dungeon.id, { ...dungeon })
    })

    // 사용자 프로그레스 초기화
    this.updateDungeonAvailability('current-user')
  }

  // 던전 목록 조회
  async getDungeons(filter?: DungeonFilter): Promise<Dungeon[]> {
    let dungeons = Array.from(this.dungeons.values())

    if (filter) {
      if (filter.type) {
        dungeons = dungeons.filter(d => d.type === filter.type)
      }
      if (filter.difficulty) {
        dungeons = dungeons.filter(d => d.difficulty === filter.difficulty)
      }
      if (filter.status) {
        dungeons = dungeons.filter(d => d.status === filter.status)
      }
      if (filter.available) {
        dungeons = dungeons.filter(d => this.isDungeonAvailable(d))
      }
    }

    return dungeons.sort((a, b) => {
      // 타입별 정렬 (story > daily > raid > special > challenge > infinite)
      const typeOrder = { story: 0, daily: 1, raid: 2, special: 3, challenge: 4, infinite: 5 }
      if (a.type !== b.type) {
        return typeOrder[a.type] - typeOrder[b.type]
      }
      // 같은 타입 내에서는 난이도별 정렬
      const diffOrder = { easy: 0, normal: 1, hard: 2, expert: 3, legendary: 4, dynamic: 5 }
      return diffOrder[a.difficulty] - diffOrder[b.difficulty]
    })
  }

  // 특정 던전 조회
  async getDungeon(dungeonId: string): Promise<Dungeon | null> {
    return this.dungeons.get(dungeonId) || null
  }

  // 던전 입장 가능 여부 확인
  async isDungeonAvailable(dungeon: Dungeon, userId: string = 'current-user'): Promise<boolean> {
    const now = new Date()
    const today = now.getDay() // 0: 일요일, 1: 월요일, ...

    // 상태 확인
    if (dungeon.status === 'locked') return false

    // 요일 제한 확인
    if (dungeon.availableDays && !dungeon.availableDays.includes(today)) {
      return false
    }

    // 시간 제한 확인
    if (dungeon.availableHours) {
      const currentHour = now.getHours()
      const [startHour, endHour] = dungeon.availableHours
      if (currentHour < startHour || currentHour >= endHour) {
        return false
      }
    }

    // 일일/주간 제한 확인
    if (dungeon.dailyLimit) {
      const todayClears = await this.getTodayClears(dungeon.id, 'current-user')
      if (todayClears >= dungeon.dailyLimit) return false
    }

    if (dungeon.weeklyLimit) {
      const weeklyClears = await this.getWeeklyClears(dungeon.id, 'current-user')
      if (weeklyClears >= dungeon.weeklyLimit) return false
    }

    return true
  }

  // 던전 입장
  async enterDungeon(userId: string, dungeonId: string): Promise<{ success: boolean, message?: string, progress?: DungeonProgress }> {
    const dungeon = this.dungeons.get(dungeonId)
    if (!dungeon) {
      return { success: false, message: '던전을 찾을 수 없습니다.' }
    }

    // 입장 가능 여부 확인
    if (!this.isDungeonAvailable(dungeon)) {
      return { success: false, message: '현재 입장할 수 없는 던전입니다.' }
    }

    // 사용자 레벨 확인
    const userLevel = await this.getUserLevel(userId)
    if (userLevel < dungeon.requirements.level) {
      return { success: false, message: `레벨 ${dungeon.requirements.level} 이상 필요합니다.` }
    }

    // 선행 던전 확인
    if (dungeon.requirements.previousDungeon) {
      const prevDungeon = this.dungeons.get(dungeon.requirements.previousDungeon)
      if (!prevDungeon || prevDungeon.status !== 'completed') {
        return { success: false, message: '선행 던전을 먼저 클리어해야 합니다.' }
      }
    }

    // 에너지 확인
    const userEnergy = await this.getUserEnergy(userId)
    if (userEnergy < dungeon.requirements.energy) {
      return { success: false, message: '에너지가 부족합니다.' }
    }

    // 티켓 확인
    if (dungeon.requirements.tickets) {
      const userTickets = await this.getUserTickets(userId)
      if (userTickets < dungeon.requirements.tickets) {
        return { success: false, message: '티켓이 부족합니다.' }
      }
    }

    // 진행 상황 생성
    const progress: DungeonProgress = {
      dungeonId,
      stageId: `${dungeonId}-stage-1`,
      status: 'in_progress',
      startTime: new Date(),
      currentStage: 1,
      totalStages: dungeon.stages,
      defeatedMonsters: 0,
      totalMonsters: dungeon.stages * 3, // 추정치
      clearedStages: 0,
      isCleared: false,
      earnedExp: 0,
      earnedGold: 0,
      earnedItems: [],
      damageDealt: 0,
      damageTaken: 0,
      criticalHits: 0,
      skillsUsed: 0,
      completionTime: 0,
      survivedWithFullHP: true,
      usedNoConsumables: true
    }

    this.userProgress.set(`${userId}-${dungeonId}`, progress)

    // 리소스 차감
    await this.deductUserEnergy(userId, dungeon.requirements.energy)
    if (dungeon.requirements.tickets) {
      await this.deductUserTickets(userId, dungeon.requirements.tickets)
    }

    return { success: true, progress }
  }

  // 던전 진행 업데이트
  async updateProgress(userId: string, dungeonId: string, updates: Partial<DungeonProgress>): Promise<DungeonProgress | null> {
    const progressKey = `${userId}-${dungeonId}`
    const progress = this.userProgress.get(progressKey)
    
    if (!progress) return null

    const updatedProgress = { ...progress, ...updates }
    this.userProgress.set(progressKey, updatedProgress)

    return updatedProgress
  }

  // 던전 완료
  async completeDungeon(userId: string, dungeonId: string): Promise<{ success: boolean, rewards?: unknown, record?: DungeonClearRecord }> {
    const progressKey = `${userId}-${dungeonId}`
    const progress = this.userProgress.get(progressKey)
    const dungeon = this.dungeons.get(dungeonId)

    if (!progress || !dungeon) {
      return { success: false }
    }

    const now = new Date()
    const completionTime = now.getTime() - progress.startTime.getTime()
    
    // 별점 계산
    const stars = this.calculateStars(progress, dungeon, completionTime)
    
    // 보상 계산
    const rewards = this.calculateRewards(dungeon, stars, progress)
    
    // 클리어 기록 생성
    const record: DungeonClearRecord = {
      dungeonId,
      clearedAt: now,
      completionTime: Math.floor(completionTime / 1000), // 초 단위
      stars,
      difficulty: dungeon.difficulty,
      party: {
        level: await this.getUserLevel(userId),
        combatPower: await this.getUserCombatPower(userId),
        equipment: await this.getUserEquipment(userId)
      },
      statistics: {
        damageDealt: progress.damageDealt,
        damageTaken: progress.damageTaken,
        criticalHits: progress.criticalHits,
        perfectStages: progress.totalStages
      },
      rewards
    }

    // 클리어 기록 저장
    const userRecords = this.clearRecords.get(userId) || []
    userRecords.push(record)
    this.clearRecords.set(userId, userRecords)

    // 던전 상태 업데이트
    const updatedDungeon = this.dungeons.get(dungeonId)!
    updatedDungeon.status = 'completed'
    updatedDungeon.clearedCount += 1
    updatedDungeon.lastClearedAt = now
    
    if (!updatedDungeon.bestTime || completionTime < updatedDungeon.bestTime) {
      updatedDungeon.bestTime = completionTime
    }

    // 진행 상황 제거
    this.userProgress.delete(progressKey)

    // 다음 던전 잠금 해제
    this.updateDungeonAvailability(userId)

    // 보상 지급
    await this.giveRewards(userId, rewards)

    return { success: true, rewards, record }
  }

  // 던전 가용성 업데이트
  private updateDungeonAvailability(userId: string): void {
    const dungeons = Array.from(this.dungeons.values())
    
    dungeons.forEach(dungeon => {
      if (dungeon.status === 'locked' && dungeon.requirements.previousDungeon) {
        const prevDungeon = this.dungeons.get(dungeon.requirements.previousDungeon)
        if (prevDungeon && prevDungeon.status === 'completed') {
          dungeon.status = 'available'
        }
      }
    })
  }

  // 별점 계산
  private calculateStars(progress: DungeonProgress, dungeon: Dungeon, completionTime: number): number {
    let stars = 1 // 기본 1성

    // 시간 조건 (추정 시간의 150% 이내)
    const timeLimit = dungeon.estimatedTime * 60 * 1000 * 1.5
    if (completionTime <= timeLimit) stars++

    // 완벽 조건 (HP 유지 + 소비품 미사용)
    if (progress.survivedWithFullHP && progress.usedNoConsumables) stars++

    return Math.min(stars, 3)
  }

  // 보상 계산
  private calculateRewards(dungeon: Dungeon, stars: number, progress: DungeonProgress) {
    const baseRewards = { ...dungeon.rewards }
    const starMultiplier = 0.5 + (stars * 0.25) // 1성: 0.75x, 2성: 1x, 3성: 1.25x
    
    // 난이도별 보상 배율 적용
    const difficultyMultiplier = this.getDifficultyMultiplier(dungeon.difficulty)
    const totalMultiplier = starMultiplier * difficultyMultiplier

    return {
      exp: Math.floor(baseRewards.exp * totalMultiplier) + progress.earnedExp,
      gold: Math.floor(baseRewards.gold * totalMultiplier) + progress.earnedGold,
      items: [...baseRewards.items, ...progress.earnedItems]
    }
  }
  
  // 난이도별 보상 배율 가져오기
  private getDifficultyMultiplier(difficulty: string): number {
    import {  DIFFICULTY_INFO  } from '@/lib/dungeon/dungeon-data'
    return DIFFICULTY_INFO[difficulty]?.multiplier || 1.0
  }

  // 사용자 정보 조회 메서드들
  private async getUserLevel(userId: string): Promise<number> {
    try {
      const character = await this.getCharacterFromDB(userId)
      return character?.level || 1
    } catch (error) {
      console.error('Failed to get user level:', error)
      return 1
    }
  }

  private async getUserEnergy(userId: string): Promise<number> {
    try {
      const character = await this.getCharacterFromDB(userId)
      return character?.energy || 0
    } catch (error) {
      console.error('Failed to get user energy:', error)
      return 0
    }
  }

  private async getUserTickets(userId: string): Promise<number> {
    try {
      const character = await this.getCharacterFromDB(userId)
      return character?.battleTickets || 0
    } catch (error) {
      console.error('Failed to get user tickets:', error)
      return 0
    }
  }

  private async getUserCombatPower(userId: string): Promise<number> {
    try {
      const character = await this.getCharacterFromDB(userId)
      if (!character) return 0
      
      // 전투력 계산: 공격력 + 방어력 + HP/10
      const attack = character.attack || 10
      const defense = character.defense || 5
      const hp = character.maxHp || 100
      
      return Math.floor(attack * 10 + defense * 5 + hp)
    } catch (error) {
      console.error('Failed to get user combat power:', error)
      return 0
    }
  }

  private async getUserEquipment(userId: string): Promise<string[]> {
    try {
      const character = await this.getCharacterFromDB(userId)
      return character?.equippedItems || []
    } catch (error) {
      console.error('Failed to get user equipment:', error)
      return []
    }
  }

  // DB에서 캐릭터 정보 가져오기
  private async getCharacterFromDB(userId: string): Promise<unknown> {
    const { getClientDatabase } = await import('../database/client')
    const db = getClientDatabase()
    if (!db) return null
    
    return await db.characters
      .where('userId')
      .equals(userId)
      .first()
  }

  // 리소스 차감
  private async deductUserEnergy(userId: string, amount: number): Promise<void> {
    const { getClientDatabase } = await import('../database/client')
    const db = getClientDatabase()
    if (!db) throw new Error('Database not available')
    
    const character = await this.getCharacterFromDB(userId)
    if (!character) throw new Error('Character not found')
    
    const newEnergy = Math.max(0, (character.energy || 0) - amount)
    await db.characters.update(character.id!, { 
      energy: newEnergy,
      updatedAt: new Date()
    })
  }

  private async deductUserTickets(userId: string, amount: number): Promise<void> {
    const { getClientDatabase } = await import('../database/client')
    const db = getClientDatabase()
    if (!db) throw new Error('Database not available')
    
    const character = await this.getCharacterFromDB(userId)
    if (!character) throw new Error('Character not found')
    
    const newTickets = Math.max(0, (character.battleTickets || 0) - amount)
    await db.characters.update(character.id!, { 
      battleTickets: newTickets,
      updatedAt: new Date()
    })
  }

  // 보상 지급
  private async giveRewards(userId: string, rewards: unknown): Promise<void> {
    const { getClientDatabase } = await import('../database/client')
    const db = getClientDatabase()
    if (!db) throw new Error('Database not available')
    
    const character = await this.getCharacterFromDB(userId)
    if (!character) throw new Error('Character not found')
    
    // 경험치 및 골드 지급
    const updates: Record<string, unknown> = {
      experience: (character.experience || 0) + (rewards.exp || 0),
      gold: (character.gold || 0) + (rewards.gold || 0),
      updatedAt: new Date()
    }
    
    // 레벨업 체크
    const newLevel = Math.floor(updates.experience / 100) + 1
    if (newLevel > (character.level || 1)) {
      updates.level = newLevel
    }
    
    await db.characters.update(character.id!, updates)
    
    // 아이템 지급
    if (rewards.items && rewards.items.length > 0) {
      for (const itemId of rewards.items) {
        await db.items.add({
          userId,
          itemId,
          quantity: 1,
          obtainedAt: new Date()
        })
      }
    }
  }

  // 오늘 클리어 횟수
  private async getTodayClears(dungeonId: string, userId: string): Promise<number> {
    const records = this.clearRecords.get(userId) || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return records.filter(record => 
      record.dungeonId === dungeonId && 
      record.clearedAt >= today
    ).length
  }

  // 이번 주 클리어 횟수
  private async getWeeklyClears(dungeonId: string, userId: string): Promise<number> {
    const records = this.clearRecords.get(userId) || []
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    return records.filter(record => 
      record.dungeonId === dungeonId && 
      record.clearedAt >= weekStart
    ).length
  }

  // 사용자 통계 조회
  async getUserStats(userId: string): Promise<DungeonStats> {
    const records = this.clearRecords.get(userId) || []
    
    const stats: DungeonStats = {
      totalDungeonsCleared: records.length,
      totalStagesCleared: records.reduce((sum, r) => sum + r.statistics.perfectStages, 0),
      totalTimeSpent: Math.floor(records.reduce((sum, r) => sum + r.completionTime, 0) / 60),
      averageStars: records.length > 0 ? records.reduce((sum, r) => sum + r.stars, 0) / records.length : 0,
      byType: {
        story: { cleared: 0, totalTime: 0, averageStars: 0 },
        daily: { cleared: 0, totalTime: 0, averageStars: 0 },
        raid: { cleared: 0, totalTime: 0, averageStars: 0 },
        special: { cleared: 0, totalTime: 0, averageStars: 0 },
        challenge: { cleared: 0, totalTime: 0, averageStars: 0 },
        infinite: { cleared: 0, totalTime: 0, averageStars: 0 }
      },
      byDifficulty: {
        easy: { cleared: 0, totalTime: 0, averageStars: 0 },
        normal: { cleared: 0, totalTime: 0, averageStars: 0 },
        hard: { cleared: 0, totalTime: 0, averageStars: 0 },
        expert: { cleared: 0, totalTime: 0, averageStars: 0 },
        legendary: { cleared: 0, totalTime: 0, averageStars: 0 },
        dynamic: { cleared: 0, totalTime: 0, averageStars: 0 }
      },
      achievements: {
        perfectRuns: records.filter(r => r.stars === 3).length,
        speedRuns: records.filter(r => r.completionTime < 600).length, // 10분 이하
        noDeathRuns: records.filter(r => r.statistics.damageTaken === 0).length
      }
    }

    // 타입별/난이도별 통계 계산
    records.forEach(record => {
      const dungeon = this.dungeons.get(record.dungeonId)
      if (dungeon) {
        // 타입별
        stats.byType[dungeon.type].cleared++
        stats.byType[dungeon.type].totalTime += Math.floor(record.completionTime / 60)
        
        // 난이도별
        stats.byDifficulty[record.difficulty].cleared++
        stats.byDifficulty[record.difficulty].totalTime += Math.floor(record.completionTime / 60)
      }
    })

    // 평균 별점 계산
    Object.values(stats.byType).forEach(typeStat => {
      if (typeStat.cleared > 0) {
        const typeRecords = records.filter(r => {
          const dungeon = this.dungeons.get(r.dungeonId)
          return dungeon && stats.byType[dungeon.type] === typeStat
        })
        typeStat.averageStars = typeRecords.reduce((sum, r) => sum + r.stars, 0) / typeRecords.length
      }
    })

    return stats
  }
}

// 전역 인스턴스
export const dungeonService = DungeonService.getInstance()