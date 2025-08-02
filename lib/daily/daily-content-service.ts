// 일일 콘텐츠 서비스
// 매일 갱신되는 미션, 던전, 출석 보상 관리

import { energyDb } from '@/lib/db-energy'
import type {
  DailyMission,
  DailyDungeon,
  DailyLogin,
  WeeklyChallenge,
  DailyContentState,
  DayOfWeek
} from '@/lib/types/daily-content'
import {
  DAILY_MISSION_TEMPLATES,
  DAILY_DUNGEON_SCHEDULE,
  LOGIN_REWARDS
} from '@/lib/types/daily-content'
import { EnergyService } from '@/lib/energy/energy-service'
import { GameError } from '@/lib/types/game-common'

// 데이터베이스 테이블 타입
interface DailyContentData {
  id?: number
  _userId: string
  type: 'mission' | 'dungeon' | 'login' | 'weekly' | 'state'
  contentId: string
  data: string // JSON stringified data
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

// 일일 리셋 시간 (오전 4시)
const DAILY_RESET_HOUR = 4

export class DailyContentService {
  private static instance: DailyContentService
  private energyService: EnergyService

  constructor() {
    this.energyService = EnergyService.getInstance()
  }

  static getInstance(): DailyContentService {
    if (!DailyContentService.instance) {
      DailyContentService.instance = new DailyContentService()
    }
    return DailyContentService.instance
  }

  // 다음 리셋 시간 계산
  private getNextResetTime(): Date {
    const now = new Date()
    const resetTime = new Date(now)
    resetTime.setHours(DAILY_RESET_HOUR, 0, 0, 0)

    if (now >= resetTime) {
      resetTime.setDate(resetTime.getDate() + 1)
    }

    return resetTime
  }

  // 현재 요일 가져오기
  private getCurrentDayOfWeek(): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()] as DayOfWeek
  }

  // 일일 콘텐츠 초기화 또는 갱신
  async initializeDailyContent(_userId: string): Promise<DailyContentState> {
    try {
      // 현재 상태 가져오기
      const currentState = await this.getDailyContentState(userId)

      // 리셋 필요 여부 확인
      const now = new Date()
      const lastReset = currentState?.lastResetDate || new Date(0)
      const nextReset = this.getNextResetTime()

      if (lastReset < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        // 24시간 이상 지났으면 리셋
        return await this.resetDailyContent(userId)
      }

      return currentState || await this.resetDailyContent(userId)
    } catch (error) {
      console.error('Failed to initialize daily content:', error)
      throw new GameError('DAILY_CONTENT_ERROR', '일일 콘텐츠 초기화 실패')
    }
  }

  // 일일 콘텐츠 리셋
  private async resetDailyContent(_userId: string): Promise<DailyContentState> {
    try {
      const now = new Date()
      const nextReset = this.getNextResetTime()

      // 1. 일일 미션 생성 (랜덤 3개)
      const missions = this.generateDailyMissions(nextReset)

      // 2. 요일별 던전 설정
      const currentDay = this.getCurrentDayOfWeek()
      const dailyDungeon = this.generateDailyDungeon(currentDay)

      // 3. 출석 체크 업데이트
      const loginState = await this.updateLoginStreak(userId)

      // 4. 주간 도전 확인/생성
      const weeklyChallenge = await this.getOrCreateWeeklyChallenge(userId)

      // 상태 저장
      const state: DailyContentState = {
        missions,
        dailyDungeons: [dailyDungeon],
        loginStreak: loginState.streak,
        lastLoginDate: now,
        loginRewards: loginState.rewards,
        weeklyChallenge,
        lastResetDate: now
      }

      // DB에 저장
      await this.saveDailyContentState(userId, state)

      return state
    } catch (error) {
      console.error('Failed to reset daily content:', error)
      throw new GameError('DAILY_CONTENT_ERROR', '일일 콘텐츠 리셋 실패')
    }
  }

  // 일일 미션 생성
  private generateDailyMissions(_expiresAt: Date): DailyMission[] {
    const missions: DailyMission[] = []
    const templates = [...DAILY_MISSION_TEMPLATES]

    // 난이도별로 1개씩 선택
    const difficulties = ['easy', 'normal', 'hard'] as const

    for (const difficulty of difficulties) {
      const availableTemplates = templates.filter(t => t.difficulty === difficulty)
      if (availableTemplates.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTemplates.length)
        const template = availableTemplates[randomIndex]

        missions.push({
          ...template,
          id: `daily-mission-${Date.now()}-${missions.length}`,
          current: 0,
          isCompleted: false,
          expiresAt
        })
      }
    }

    return missions
  }

  // 요일별 던전 생성
  private generateDailyDungeon(dayOfWeek: DayOfWeek): DailyDungeon {
    const schedule = DAILY_DUNGEON_SCHEDULE[dayOfWeek]

    return {
      ...schedule,
      id: `daily-dungeon-${dayOfWeek}-${Date.now()}`,
      isAvailable: true,
      attempts: 0
    }
  }

  // 출석 연속일수 업데이트
  private async updateLoginStreak(_userId: string): Promise<{ streak: number; rewards: DailyLogin[] }> {
    try {
      // 이전 출석 기록 가져오기
      const lastLogin = await energyDb.dailyContent
        .where(['userId', 'type'])
        .equals([userId, 'login'])
        .reverse()
        .limit(1)
        .first()

      let streak = 1
      const now = new Date()

      if (lastLogin) {
        const lastLoginData = JSON.parse(lastLogin.data) as { date: string; streak: number }
        const lastDate = new Date(lastLoginData.date)
        const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          // 연속 출석
          streak = lastLoginData.streak + 1
        } else if (daysDiff === 0) {
          // 같은 날
          streak = lastLoginData.streak
        } else {
          // 연속 끊김
          streak = 1
        }
      }

      // 28일 주기
      const cycleDay = ((streak - 1) % 28) + 1

      // 출석 보상 생성
      const rewards = LOGIN_REWARDS.map(reward => ({
        ...reward,
        isClaimed: reward.day < cycleDay,
        claimedAt: reward.day < cycleDay ? now : undefined
      }))

      // 출석 기록 저장
      await energyDb.dailyContent.add({
        userId,
        type: 'login',
        contentId: `login-${now.toISOString()}`,
        data: JSON.stringify({ date: now.toISOString(), streak }),
        createdAt: now,
        updatedAt: now
      })

      return { streak, rewards }
    } catch (error) {
      console.error('Failed to update login streak:', error)
      return { streak: 1, rewards: LOGIN_REWARDS.map(r => ({ ...r, isClaimed: false })) }
    }
  }

  // 주간 도전 과제 생성 또는 가져오기
  private async getOrCreateWeeklyChallenge(_userId: string): Promise<WeeklyChallenge | undefined> {
    try {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // 일요일
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      // 이번 주 도전과제 확인
      const existing = await energyDb.dailyContent
        .where(['userId', 'type'])
        .equals([userId, 'weekly'])
        .filter(item => {
          const data = JSON.parse(item.data) as WeeklyChallenge
          return new Date(data.startDate) >= weekStart && new Date(data.endDate) <= weekEnd
        })
        .first()

      if (existing) {
        return JSON.parse(existing.data) as WeeklyChallenge
      }

      // 새 주간 도전과제 생성
      const weeklyChallenge: WeeklyChallenge = {
        id: `weekly-${weekStart.toISOString()}`,
        title: '주간 마스터',
        description: '이번 주 모든 도전을 완료하세요',
        startDate: weekStart,
        endDate: weekEnd,
        missions: [
          {
            id: 'weekly-1',
            description: '일일 미션 15개 완료',
            target: 15,
            current: 0,
            completed: false
          },
          {
            id: 'weekly-2',
            description: '던전 10회 클리어',
            target: 10,
            current: 0,
            completed: false
          },
          {
            id: 'weekly-3',
            description: '전투 30회 승리',
            target: 30,
            current: 0,
            completed: false
          },
          {
            id: 'weekly-4',
            description: '7일 연속 출석',
            target: 7,
            current: 0,
            completed: false
          }
        ],
        rewards: {
          exp: 1000,
          gold: 2000,
          items: ['legendary-chest', 'legendary-scroll'],
          title: '주간 마스터'
        },
        _progress: 0,
        isCompleted: false,
        isClaimed: false
      }

      // 저장
      await energyDb.dailyContent.add({
        userId,
        type: 'weekly',
        contentId: weeklyChallenge.id,
        data: JSON.stringify(weeklyChallenge),
        createdAt: now,
        updatedAt: now,
        _expiresAt: weekEnd
      })

      return weeklyChallenge
    } catch (error) {
      console.error('Failed to get/create weekly challenge:', error)
      return undefined
    }
  }

  // 일일 콘텐츠 상태 가져오기
  async getDailyContentState(_userId: string): Promise<DailyContentState | null> {
    try {
      const stateData = await energyDb.dailyContent
        .where(['userId', 'type'])
        .equals([userId, 'state'])
        .reverse()
        .limit(1)
        .first()

      if (!stateData) {
        return null
      }

      const state = JSON.parse(stateData.data) as DailyContentState

      // Date 객체 복원
      state.lastResetDate = new Date(state.lastResetDate)
      if (state.lastLoginDate) {
        state.lastLoginDate = new Date(state.lastLoginDate)
      }

      return state
    } catch (error) {
      console.error('Failed to get daily content state:', error)
      return null
    }
  }

  // 일일 콘텐츠 상태 저장
  private async saveDailyContentState(_userId: string, state: DailyContentState): Promise<void> {
    try {
      const now = new Date()

      // 기존 상태 삭제
      await energyDb.dailyContent
        .where(['userId', 'type'])
        .equals([userId, 'state'])
        .delete()

      // 새 상태 저장
      await energyDb.dailyContent.add({
        userId,
        type: 'state',
        contentId: `state-${now.toISOString()}`,
        data: JSON.stringify(state),
        createdAt: now,
        updatedAt: now
      })
    } catch (error) {
      console.error('Failed to save daily content state:', error)
      throw new GameError('DAILY_CONTENT_ERROR', '일일 콘텐츠 상태 저장 실패')
    }
  }

  // 일일 미션 진행도 업데이트
  async updateMissionProgress(
    _userId: string,
    _missionId: string,
    _progress: number
  ): Promise<{ completed: boolean; rewards?: DailyMission['rewards'] }> {
    try {
      const state = await this.getDailyContentState(userId)
      if (!state) {
        throw new GameError('DAILY_CONTENT_ERROR', '일일 콘텐츠 상태를 찾을 수 없습니다')
      }

      const mission = state.missions.find(m => m.id === missionId)
      if (!mission) {
        throw new GameError('DAILY_CONTENT_ERROR', '미션을 찾을 수 없습니다')
      }

      if (mission.isCompleted) {
        return { completed: true }
      }

      mission.current = Math.min(mission.current + progress, mission.target)

      if (mission.current >= mission.target) {
        mission.isCompleted = true
        mission.completedAt = new Date()

        // 주간 도전과제 업데이트
        if (state.weeklyChallenge) {
          const weeklyMission = state.weeklyChallenge.missions.find(m => m.id === 'weekly-1')
          if (weeklyMission && !weeklyMission.completed) {
            weeklyMission.current++
            if (weeklyMission.current >= weeklyMission.target) {
              weeklyMission.completed = true
            }
          }
        }

        await this.saveDailyContentState(userId, state)

        return { completed: true, rewards: mission.rewards }
      }

      await this.saveDailyContentState(userId, state)

      return { completed: false }
    } catch (error) {
      if (error instanceof GameError) {
        throw error
      }

      console.error('Failed to update mission _progress:', error)
      throw new GameError('DAILY_CONTENT_ERROR', '미션 진행도 업데이트 실패')
    }
  }

  // 출석 보상 수령
  async claimLoginReward(_userId: string, _day: number): Promise<DailyLogin['rewards'] | null> {
    try {
      const state = await this.getDailyContentState(userId)
      if (!state) {
        throw new GameError('DAILY_CONTENT_ERROR', '일일 콘텐츠 상태를 찾을 수 없습니다')
      }

      const reward = state.loginRewards.find(r => r.day === day)
      if (!reward || reward.isClaimed) {
        return null
      }

      // 이전 날짜 보상을 모두 수령했는지 확인
      const previousDays = state.loginRewards.filter(r => r.day < day)
      const allPreviousClaimed = previousDays.every(r => r.isClaimed)

      if (!allPreviousClaimed) {
        throw new GameError('DAILY_CONTENT_ERROR', '이전 날짜의 보상을 먼저 수령하세요')
      }

      reward.isClaimed = true
      reward.claimedAt = new Date()

      await this.saveDailyContentState(userId, state)

      return reward.rewards
    } catch (error) {
      if (error instanceof GameError) {
        throw error
      }

      console.error('Failed to claim login reward:', error)
      throw new GameError('DAILY_CONTENT_ERROR', '출석 보상 수령 실패')
    }
  }

  // 요일 던전 입장 시 보너스 적용
  async applyDailyDungeonBonus(
    _userId: string,
    _dungeonId: string,
    _baseRewards: { exp: number; gold: number; items?: string[] }
  ): Promise<{ exp: number; gold: number; items?: string[] }> {
    try {
      const state = await this.getDailyContentState(userId)
      if (!state) {
        return baseRewards
      }

      const dailyDungeon = state.dailyDungeons.find(d => d.dungeonId === dungeonId)
      if (!dailyDungeon || !dailyDungeon.isAvailable) {
        return baseRewards
      }

      // 보너스 적용
      const bonusRewards = {
        exp: Math.floor(baseRewards.exp * dailyDungeon.bonusRewards.expMultiplier),
        gold: Math.floor(baseRewards.gold * dailyDungeon.bonusRewards.goldMultiplier),
        items: [
          ...(baseRewards.items || []),
          ...(dailyDungeon.bonusRewards.guaranteedItems || [])
        ]
      }

      // 시도 횟수 증가
      dailyDungeon.attempts++
      if (dailyDungeon.attempts >= dailyDungeon.maxAttempts) {
        dailyDungeon.isAvailable = false
      }

      await this.saveDailyContentState(userId, state)

      return bonusRewards
    } catch (error) {
      console.error('Failed to apply daily dungeon bonus:', error)
      return baseRewards
    }
  }

  // 주간 도전과제 진행도 업데이트
  async updateWeeklyChallengeProgress(
    _userId: string,
    _missionId: string,
    _progress: number
  ): Promise<boolean> {
    try {
      const state = await this.getDailyContentState(userId)
      if (!state || !state.weeklyChallenge) {
        return false
      }

      const mission = state.weeklyChallenge.missions.find(m => m.id === missionId)
      if (!mission || mission.completed) {
        return false
      }

      mission.current = Math.min(mission.current + progress, mission.target)

      if (mission.current >= mission.target) {
        mission.completed = true
      }

      // 전체 진행도 계산
      const completedCount = state.weeklyChallenge.missions.filter(m => m.completed).length
      state.weeklyChallenge.progress = (completedCount / state.weeklyChallenge.missions.length) * 100

      if (state.weeklyChallenge.progress >= 100) {
        state.weeklyChallenge.isCompleted = true
      }

      await this.saveDailyContentState(userId, state)

      return mission.completed
    } catch (error) {
      console.error('Failed to update weekly challenge _progress:', error)
      return false
    }
  }

  // 주간 도전과제 보상 수령
  async claimWeeklyChallengeReward(_userId: string): Promise<WeeklyChallenge['rewards'] | null> {
    try {
      const state = await this.getDailyContentState(userId)
      if (!state || !state.weeklyChallenge) {
        return null
      }

      if (!state.weeklyChallenge.isCompleted || state.weeklyChallenge.isClaimed) {
        return null
      }

      state.weeklyChallenge.isClaimed = true

      await this.saveDailyContentState(userId, state)

      return state.weeklyChallenge.rewards
    } catch (error) {
      console.error('Failed to claim weekly challenge reward:', error)
      return null
    }
  }
}

export default DailyContentService
