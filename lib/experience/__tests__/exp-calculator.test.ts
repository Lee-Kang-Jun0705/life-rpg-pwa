import { ExpCalculator } from '../exp-calculator'
import { ACTIVITY_QUALITY } from '@/lib/types/experience'
import type { Activity, ExpContext } from '@/lib/types/experience'

describe('ExpCalculator', () => {
  const mockDate = new Date('2024-01-01T08:00:00Z') // 아침 시간대
  const mockNightDate = new Date('2024-01-01T02:00:00Z') // 심야 시간대
  const mockNormalDate = new Date('2024-01-01T14:00:00Z') // 일반 시간대

  const createMockActivity = (
    quality: typeof ACTIVITY_QUALITY[keyof typeof ACTIVITY_QUALITY],
    activityName = '테스트 활동',
    statType: 'health' | 'learning' | 'relationship' | 'achievement' = 'health'
  ): Activity => ({
    id: 'test-activity-1',
    userId: 'test-user',
    activityName,
    description: '테스트 설명',
    statType,
    quality,
    timestamp: mockDate,
    experience: 0
  })

  const createMockContext = (overrides?: Partial<ExpContext>): ExpContext => ({
    time: mockDate,
    user: {
      userId: 'test-user',
      level: 10,
      totalExp: 5000,
      streakDays: 0,
      lastActivityTime: new Date(mockDate.getTime() - 60 * 60 * 1000) // 1시간 전
    },
    previousActivities: [],
    ...overrides
  })

  describe('calculateRequiredExp', () => {
    it('레벨 1-10: 선형 증가', () => {
      expect(ExpCalculator.calculateRequiredExp(1)).toBe(100)
      expect(ExpCalculator.calculateRequiredExp(5)).toBe(500)
      expect(ExpCalculator.calculateRequiredExp(10)).toBe(1000)
    })

    it('레벨 11-30: 완만한 지수 증가', () => {
      const exp11 = ExpCalculator.calculateRequiredExp(11)
      const exp20 = ExpCalculator.calculateRequiredExp(20)
      const exp30 = ExpCalculator.calculateRequiredExp(30)

      expect(exp11).toBeGreaterThan(1100)
      expect(exp20).toBeGreaterThan(exp11)
      expect(exp30).toBeGreaterThan(exp20)
    })

    it('레벨 31-50: 가파른 증가', () => {
      const exp31 = ExpCalculator.calculateRequiredExp(31)
      const exp40 = ExpCalculator.calculateRequiredExp(40)
      const exp50 = ExpCalculator.calculateRequiredExp(50)

      expect(exp31).toBeGreaterThan(15000)
      expect(exp50).toBeGreaterThan(exp40)
      expect(exp50).toBeGreaterThan(exp31 * 2)
    })

    it('레벨 51+: 명예 레벨 (매우 높은 요구치)', () => {
      const exp51 = ExpCalculator.calculateRequiredExp(51)
      const exp100 = ExpCalculator.calculateRequiredExp(100)

      expect(exp51).toBeGreaterThan(50000)
      expect(exp100).toBeGreaterThan(exp51 * 10)
    })

    it('잘못된 레벨 처리', () => {
      expect(ExpCalculator.calculateRequiredExp(0)).toBe(0)
      expect(ExpCalculator.calculateRequiredExp(-1)).toBe(0)
    })
  })

  describe('calculateLevel', () => {
    it('총 경험치로 정확한 레벨 계산', () => {
      const level1 = ExpCalculator.calculateLevel(50)
      expect(level1.level).toBe(1)
      expect(level1.currentExp).toBe(50)
      expect(level1.progress).toBe(50)

      const level5 = ExpCalculator.calculateLevel(1500) // 1+2+3+4레벨 = 1000, 5레벨 진행중
      expect(level5.level).toBe(5)
      expect(level5.currentExp).toBe(500)
      expect(level5.progress).toBe(100)

      const level10 = ExpCalculator.calculateLevel(5500) // 1~10레벨 = 5500
      expect(level10.level).toBe(11)
      expect(level10.currentExp).toBe(0)
    })

    it('명예 레벨 계산', () => {
      const highLevel = ExpCalculator.calculateLevel(10000000) // 매우 높은 경험치
      expect(highLevel.level).toBeGreaterThan(100)
      expect(highLevel.prestigeLevel).toBeDefined()
      expect(highLevel.prestigeLevel).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateActivityExp - 품질별 경험치', () => {
    it('D등급: 기본 10 경험치', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.D)
      const context = createMockContext()
      const result = ExpCalculator.calculateActivityExp(activity, context)

      expect(result.baseExp).toBe(10)
      expect(result.qualityMultiplier).toBe(1.0)
      expect(result.finalExp).toBeGreaterThanOrEqual(10) // 보너스 적용 가능
    })

    it('S등급: 기본 100 경험치, 3배 배수', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.S)
      const context = createMockContext()
      const result = ExpCalculator.calculateActivityExp(activity, context)

      expect(result.baseExp).toBe(100)
      expect(result.qualityMultiplier).toBe(3.0)
      expect(result.finalExp).toBeGreaterThanOrEqual(300)
    })
  })

  describe('calculateActivityExp - 보너스 시스템', () => {
    it('아침 시간대 보너스 (+20%)', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B)
      const context = createMockContext({ time: new Date('2024-01-01T07:00:00Z') })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const timeBonus = result.bonuses.find(b => b.type === 'time')
      expect(timeBonus).toBeDefined()
      expect(timeBonus?.value).toBe(0.2)
      expect(timeBonus?.name).toBe('아침 활동 보너스')
    })

    it('심야 시간대 페널티 (-20%)', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B)
      const context = createMockContext({ time: mockNightDate })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const timePenalty = result.bonuses.find(b => b.type === 'time')
      expect(timePenalty).toBeDefined()
      expect(timePenalty?.value).toBe(-0.2)
      expect(timePenalty?.name).toBe('심야 활동 패널티')
    })

    it('연속 활동 보너스', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B)

      // 7일 연속
      const context7Days = createMockContext({
        user: { ...createMockContext().user, streakDays: 7 }
      })
      const result7Days = ExpCalculator.calculateActivityExp(activity, context7Days)
      const streakBonus7 = result7Days.bonuses.find(b => b.type === 'streak')
      expect(streakBonus7?.value).toBe(0.2)

      // 100일 연속
      const context100Days = createMockContext({
        user: { ...createMockContext().user, streakDays: 100 }
      })
      const result100Days = ExpCalculator.calculateActivityExp(activity, context100Days)
      const streakBonus100 = result100Days.bonuses.find(b => b.type === 'streak')
      expect(streakBonus100?.value).toBe(1.0)
    })

    it('다양성 보너스', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '새로운 활동')

      // 오늘 5가지 다른 활동
      const previousActivities: Activity[] = [
        createMockActivity(ACTIVITY_QUALITY.B, '활동1'),
        createMockActivity(ACTIVITY_QUALITY.B, '활동2'),
        createMockActivity(ACTIVITY_QUALITY.B, '활동3'),
        createMockActivity(ACTIVITY_QUALITY.B, '활동4'),
        createMockActivity(ACTIVITY_QUALITY.B, '활동5')
      ]

      const context = createMockContext({ previousActivities })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const varietyBonus = result.bonuses.find(b => b.type === 'variety')
      expect(varietyBonus?.value).toBe(0.3)
    })

    it('4스탯 균형 보너스', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '성취 활동', 'achievement')

      // 각 스탯별 활동
      const previousActivities: Activity[] = [
        createMockActivity(ACTIVITY_QUALITY.B, '건강 활동', 'health'),
        createMockActivity(ACTIVITY_QUALITY.B, '학습 활동', 'learning'),
        createMockActivity(ACTIVITY_QUALITY.B, '관계 활동', 'relationship')
      ]

      const context = createMockContext({ previousActivities })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const varietyBonus = result.bonuses.find(b => b.type === 'variety')
      expect(varietyBonus?.value).toBeGreaterThanOrEqual(0.2) // 4스탯 보너스 포함
    })

    it('첫 활동 보너스 (+50%)', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '처음 하는 활동')
      const context = createMockContext()
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const firstTimeBonus = result.bonuses.find(b => b.type === 'first_time')
      expect(firstTimeBonus?.value).toBe(0.5)
    })
  })

  describe('calculateActivityExp - 페널티 시스템', () => {
    it('반복 페널티 - 1시간 내 3회 반복', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '반복 활동')

      const recentTime = new Date(mockDate.getTime() - 30 * 60 * 1000) // 30분 전
      const previousActivities: Activity[] = [
        { ...activity, timestamp: recentTime },
        { ...activity, timestamp: new Date(recentTime.getTime() + 10 * 60 * 1000) },
        { ...activity, timestamp: new Date(recentTime.getTime() + 20 * 60 * 1000) }
      ]

      const context = createMockContext({ previousActivities })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const repetitionPenalty = result.penalties.find(p => p.type === 'repetition')
      expect(repetitionPenalty?.value).toBe(0.2)
    })

    it('과도한 반복 페널티 - 1시간 내 10회 이상', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '과도한 반복')

      const previousActivities: Activity[] = Array(10).fill(null).map((_, i) => ({
        ...activity,
        timestamp: new Date(mockDate.getTime() - (50 - i * 5) * 60 * 1000)
      }))

      const context = createMockContext({ previousActivities })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const repetitionPenalty = result.penalties.find(p => p.type === 'repetition')
      expect(repetitionPenalty?.value).toBe(0.7)
      expect(result.warnings).toContain('동일한 활동을 너무 자주 반복하고 있습니다')
    })

    it('활동 간격 페널티 - 1분 이내', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.B, '빠른 재활동', 'health')

      const previousActivities: Activity[] = [{
        ...activity,
        activityName: '이전 건강 활동',
        timestamp: new Date(mockDate.getTime() - 30 * 1000) // 30초 전
      }]

      const context = createMockContext({ previousActivities })
      const result = ExpCalculator.calculateActivityExp(activity, context)

      const intervalPenalty = result.penalties.find(p => p.type === 'interval')
      expect(intervalPenalty?.value).toBe(0.9)
      expect(result.warnings).toContain('활동 간격이 너무 짧습니다')
    })
  })

  describe('calculateActivityExp - 종합 계산', () => {
    it('모든 보너스가 적용된 최대 경험치', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.S, '완벽한 활동')

      const context = createMockContext({
        time: new Date('2024-01-01T07:00:00Z'), // 아침
        user: {
          ...createMockContext().user,
          streakDays: 100 // 100일 연속
        },
        previousActivities: [
          // 다양한 활동들 (첫 활동 보너스를 위해 다른 이름)
          createMockActivity(ACTIVITY_QUALITY.B, '활동1', 'health'),
          createMockActivity(ACTIVITY_QUALITY.B, '활동2', 'learning'),
          createMockActivity(ACTIVITY_QUALITY.B, '활동3', 'relationship'),
          createMockActivity(ACTIVITY_QUALITY.B, '활동4', 'achievement'),
          createMockActivity(ACTIVITY_QUALITY.B, '활동5', 'health')
        ]
      })

      const result = ExpCalculator.calculateActivityExp(activity, context)

      // S등급(100) × 3.0(품질) × (1 + 0.2(아침) + 1.0(100일) + 0.5(다양성) + 0.5(첫활동))
      // = 100 × 3.0 × 3.2 = 960
      expect(result.finalExp).toBeGreaterThanOrEqual(900)
      expect(result.bonuses.length).toBeGreaterThanOrEqual(4)
    })

    it('페널티가 적용된 최소 경험치', () => {
      const activity = createMockActivity(ACTIVITY_QUALITY.D, '반복 활동')

      // 매우 짧은 간격으로 많이 반복
      const previousActivities: Activity[] = Array(15).fill(null).map((_, i) => ({
        ...activity,
        timestamp: new Date(mockDate.getTime() - (30 - i * 2) * 60 * 1000)
      }))

      const context = createMockContext({
        time: mockNightDate, // 심야
        previousActivities
      })

      const result = ExpCalculator.calculateActivityExp(activity, context)

      // 최소 1 경험치는 보장
      expect(result.finalExp).toBeGreaterThanOrEqual(1)
      expect(result.penalties.length).toBeGreaterThanOrEqual(1)
      expect(result.warnings?.length).toBeGreaterThan(0)
    })
  })

  describe('getExpPreview', () => {
    it('향후 레벨 미리보기 제공', () => {
      const preview = ExpCalculator.getExpPreview(10, 5)

      expect(preview).toHaveLength(5)
      expect(preview[0].level).toBe(11)
      expect(preview[4].level).toBe(15)

      // 마일스톤 확인
      const level30Preview = ExpCalculator.getExpPreview(29, 2)
      expect(level30Preview[0].milestone).toBe('레벨 30 달성')
    })
  })
})
