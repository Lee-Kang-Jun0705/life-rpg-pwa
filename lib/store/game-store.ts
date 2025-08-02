/**
 * 중앙 게임 스토어
 * 모든 게임 데이터의 단일 진실 공급원
 */

import { db } from '@/lib/database'
import { calculateLevelFromExperience, statFormulas } from '@/lib/utils/stat-calculator'
import { realTimeSync } from '@/lib/sync/real-time-sync'
import type { UserProfile, Stat } from '@/lib/database/types'
import type { StatType } from '@/lib/types/dashboard'

export interface GameState {
  profile: {
    userId: string
    name: string
    level: number
    totalExperience: number
    currentExperience: number
    avatar?: string
  } | null
  stats: Record<StatType, {
    level: number
    experience: number
    activities: number
  }>
  combat: {
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    energy: number
    maxEnergy: number
  }
  isLoading: boolean
  error: string | null
}

type Listener = () => void
type StateSlice = keyof GameState

export class GameStore {
  private state: GameState = {
    profile: null,
    stats: {
      health: { level: 1, experience: 0, activities: 0 },
      learning: { level: 1, experience: 0, activities: 0 },
      relationship: { level: 1, experience: 0, activities: 0 },
      achievement: { level: 1, experience: 0, activities: 0 }
    },
    combat: {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      energy: 120,
      maxEnergy: 120
    },
    isLoading: false,
    error: null
  }

  private subscribers: Map<string, Set<Listener>> = new Map()
  private initialized = false

  /**
   * 스토어 초기화
   */
  async initialize(userId: string): Promise<void> {
    // 이미 초기화되어 있고 같은 userId면 스킵
    if (this.initialized && this.state.profile?.userId === userId) {
      console.log('Game store already initialized for user:', userId)
      return
    }

    this.state.isLoading = true
    this.notifySubscribers(['isLoading'])

    try {
      // 프로필 로드
      const profile = await db.profiles.where('userId').equals(userId).first()
      if (profile) {
        this.state.profile = {
          userId: profile.userId,
          name: profile.name,
          level: profile.level,
          totalExperience: profile.totalExperience || 0,
          currentExperience: profile.currentExperience || 0,
          avatar: profile.avatar
        }

        // 전투 스탯 계산
        this.updateCombatStats(profile.level)
        console.log('Profile loaded:', { level: profile.level, exp: profile.totalExperience })
      } else {
        // 프로필이 없으면 기본값으로 생성
        console.log('No profile found, creating default profile for:', userId)
        this.state.profile = {
          userId,
          name: 'Player',
          level: 1,
          totalExperience: 0,
          currentExperience: 0,
          avatar: undefined
        }

        // DB에 저장
        await db.profiles.add({
          userId,
          email: `${userId}@example.com`,
          name: 'Player',
          level: 1,
          experience: 0,
          totalExperience: 0,
          currentExperience: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // 스탯 로드
      const stats = await db.stats.where('userId').equals(userId).toArray()
      for (const stat of stats) {
        this.state.stats[stat.type as StatType] = {
          level: stat.level,
          experience: stat.experience,
          activities: stat.totalActivities
        }
      }

      this.initialized = true
      this.state.error = null
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : '데이터 로드 실패'
    } finally {
      this.state.isLoading = false
      this.notifySubscribers(['profile', 'stats', 'combat', 'isLoading', 'error'])
    }
  }

  /**
   * 경험치 업데이트 (모든 데이터 동기화 보장)
   */
  async updateExperience(statType: StatType, amount: number, activityName: string): Promise<void> {
    if (!this.state.profile) {
      throw new Error('프로필이 로드되지 않았습니다')
    }

    try {
      // 트랜잭션으로 원자성 보장
      await db.transaction('rw', db.stats, db.profiles, db.activities, async() => {
        // 1. 스탯 업데이트
        const currentStat = this.state.stats[statType]
        const newExperience = currentStat.experience + amount
        const { level: newStatLevel } = calculateLevelFromExperience(newExperience)

        this.state.stats[statType] = {
          level: newStatLevel,
          experience: newExperience,
          activities: currentStat.activities + 1
        }

        // DB에 스탯 저장
        const dbStat = await db.stats
          .where('userId').equals(this.state.profile!.userId)
          .and(stat => stat.type === statType)
          .first()

        if (dbStat) {
          await db.stats.update(dbStat.id!, {
            level: newStatLevel,
            experience: newExperience,
            totalActivities: currentStat.activities + 1,
            updatedAt: new Date()
          })
        }

        // 2. 프로필 레벨 재계산
        const totalExp = Object.values(this.state.stats)
          .reduce((sum, stat) => sum + stat.experience, 0)
        const { level: newLevel, currentExp } = calculateLevelFromExperience(totalExp)

        const oldLevel = this.state.profile!.level
        this.state.profile = {
          ...this.state.profile!,
          level: newLevel,
          totalExperience: totalExp,
          currentExperience: currentExp
        }

        // DB에 프로필 저장
        const dbProfile = await db.profiles
          .where('userId').equals(this.state.profile.userId)
          .first()

        if (dbProfile) {
          await db.profiles.update(dbProfile.id!, {
            level: newLevel,
            totalExperience: totalExp,
            currentExperience: currentExp,
            updatedAt: new Date()
          })
        }

        // 3. 레벨업 시 전투 스탯 재계산
        if (newLevel !== oldLevel) {
          this.updateCombatStats(newLevel)
        }

        // 4. 활동 기록 저장
        await db.activities.add({
          userId: this.state.profile.userId,
          statType,
          activityName,
          experience: amount,
          timestamp: new Date(),
          synced: false
        })
      })

      // 구독자들에게 변경 알림
      this.notifySubscribers(['stats', 'profile', 'combat'])

      // 다른 탭에 변경 사항 브로드캐스트
      realTimeSync.broadcast('DATA_UPDATED', ['stats', 'profiles', 'activities'])

    } catch (error) {
      console.error('경험치 업데이트 실패:', error)
      throw error
    }
  }

  /**
   * 전투 스탯 업데이트
   */
  private updateCombatStats(level: number): void {
    this.state.combat = {
      hp: this.state.combat.hp, // 현재 HP는 유지
      maxHp: statFormulas.hp(level),
      mp: this.state.combat.mp, // 현재 MP는 유지
      maxMp: statFormulas.mp(level),
      energy: this.state.combat.energy, // 현재 에너지는 유지
      maxEnergy: 120 // 기본값 유지
    }
  }

  /**
   * HP/MP 회복
   */
  async heal(type: 'hp' | 'mp', amount: number): Promise<void> {
    const max = type === 'hp' ? this.state.combat.maxHp : this.state.combat.maxMp
    const current = this.state.combat[type]

    this.state.combat[type] = Math.min(current + amount, max)
    this.notifySubscribers(['combat'])
  }

  /**
   * 상태 구독
   */
  subscribe(slice: StateSlice | StateSlice[], listener: Listener): () => void {
    const slices = Array.isArray(slice) ? slice : [slice]

    slices.forEach(s => {
      if (!this.subscribers.has(s)) {
        this.subscribers.set(s, new Set())
      }
      this.subscribers.get(s)!.add(listener)
    })

    // 구독 해제 함수 반환
    return () => {
      slices.forEach(s => {
        this.subscribers.get(s)?.delete(listener)
      })
    }
  }

  /**
   * 구독자들에게 변경 알림
   */
  private notifySubscribers(slices: StateSlice[]): void {
    slices.forEach(slice => {
      this.subscribers.get(slice)?.forEach(listener => {
        listener()
      })
    })
  }

  /**
   * 현재 상태 가져오기
   */
  getState<T extends StateSlice>(slice: T): GameState[T] {
    return this.state[slice]
  }

  /**
   * 전체 상태 가져오기
   */
  getAllState(): Readonly<GameState> {
    return { ...this.state }
  }

  /**
   * DB에서 최신 데이터로 새로고침
   */
  async refreshFromDatabase(): Promise<void> {
    if (!this.state.profile) {
      return
    }

    this.initialized = false
    await this.initialize(this.state.profile.userId)
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    this.state = {
      profile: null,
      stats: {
        health: { level: 1, experience: 0, activities: 0 },
        learning: { level: 1, experience: 0, activities: 0 },
        relationship: { level: 1, experience: 0, activities: 0 },
        achievement: { level: 1, experience: 0, activities: 0 }
      },
      combat: {
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        energy: 120,
        maxEnergy: 120
      },
      isLoading: false,
      error: null
    }
    this.initialized = false
    this.notifySubscribers(Array.from(this.subscribers.keys()) as StateSlice[])
  }
}

// 싱글톤 인스턴스
export const gameStore = new GameStore()
