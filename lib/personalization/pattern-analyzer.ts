import { db } from '../database'
import { 
  LightModeData, 
  ProModeData, 
  LightPatterns, 
  ProPatterns,
  PersonalizationMode 
} from './types'
import { Activity } from '../types'

export class ModeAwarePatternAnalyzer {
  private static instance: ModeAwarePatternAnalyzer

  private constructor() {}

  static getInstance(): ModeAwarePatternAnalyzer {
    if (!ModeAwarePatternAnalyzer.instance) {
      ModeAwarePatternAnalyzer.instance = new ModeAwarePatternAnalyzer()
    }
    return ModeAwarePatternAnalyzer.instance
  }

  /**
   * 모드에 따른 패턴 분석
   */
  async analyzePatterns(
    userId: string,
    mode: PersonalizationMode
  ): Promise<LightPatterns | ProPatterns> {
    const activities = await this.getRecentActivities(userId, mode)
    
    if (mode === 'light') {
      return this.analyzeLightMode(activities as LightModeData[])
    } else {
      return this.analyzeProMode(activities as ProModeData[])
    }
  }

  /**
   * 라이트 모드 분석 - 기본적인 패턴만
   */
  private analyzeLightMode(data: LightModeData[]): LightPatterns {
    if (data.length === 0) {
      return this.getEmptyLightPatterns()
    }

    // 기본 통계
    const basicStats = {
      avgActivitiesPerDay: this.calculateDailyAverage(data),
      topActivities: this.getTopActivities(data, 3),
      bestTimeSlot: this.findBestTimeSlot(data),
      completionRate: this.calculateCompletionRate(data)
    }

    // 간단한 패턴
    const simplePatterns = {
      morningPerson: this.isMorningPerson(data),
      weekendWarrior: this.isWeekendWarrior(data),
      consistencyScore: this.calculateConsistency(data)
    }

    // 기본 추천
    const basicRecommendations = {
      nextBestTime: this.suggestNextActivityTime(data),
      suggestedActivity: this.suggestActivity(data),
      motivationTip: this.generateSimpleTip(data)
    }

    return {
      basicStats,
      simplePatterns,
      basicRecommendations
    }
  }

  /**
   * 프로 모드 분석 - 심층 분석 포함
   */
  private analyzeProMode(data: ProModeData[]): ProPatterns {
    // 먼저 라이트 모드 분석 수행
    const lightPatterns = this.analyzeLightMode(data)
    
    if (data.length === 0) {
      return this.getEmptyProPatterns(lightPatterns)
    }

    // 고급 통계
    const advancedStats = {
      hourlyHeatmap: this.generateHourlyHeatmap(data),
      weeklyProgressTrend: this.calculateWeeklyTrends(data),
      seasonalPatterns: this.findSeasonalPatterns(data),
      correlations: this.findActivityCorrelations(data)
    }

    // 심층 패턴
    const deepPatterns = {
      activitySequences: this.findSuccessfulSequences(data),
      contextualSuccess: this.analyzeContextualFactors(data),
      burnoutPrediction: this.predictBurnout(data),
      plateauDetection: this.detectPlateau(data),
      motivationCycles: this.analyzeMoodCycles(data),
      stressPatterns: this.analyzeStressIndicators(data)
    }

    // 고급 인사이트
    const proInsights = {
      yearlyGrowthCurve: this.calculateYearlyGrowth(data),
      skillProgressionMap: this.mapSkillProgression(data),
      personalRecords: this.findPersonalRecords(data),
      futureProjections: this.projectFutureProgress(data)
    }

    // 정밀 추천
    const precisionRecommendations = {
      microAdjustments: this.suggestMicroChanges(data),
      personalizedPrograms: this.generatePrograms(data),
      recoveryProtocol: this.suggestRecovery(data),
      challengeCalibration: this.calibrateDifficulty(data)
    }

    return {
      ...lightPatterns,
      advancedStats,
      deepPatterns,
      proInsights,
      precisionRecommendations
    }
  }

  /**
   * 기본 분석 메서드들
   */
  private calculateDailyAverage(data: LightModeData[]): number {
    if (data.length === 0) return 0
    
    const days = new Set(
      data.map(d => new Date(d.timestamp).toDateString())
    ).size
    
    return Math.round((data.length / days) * 10) / 10
  }

  private getTopActivities(data: LightModeData[], limit: number): string[] {
    const counts: Record<string, number> = {}
    
    data.forEach(d => {
      counts[d.type] = (counts[d.type] || 0) + 1
    })
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([type]) => type)
  }

  private findBestTimeSlot(data: LightModeData[]): string {
    const hourCounts: Record<number, number> = {}
    
    data.forEach(d => {
      const hour = d.context.hour
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '9'
    
    const hour = parseInt(bestHour)
    if (hour >= 5 && hour < 12) return '아침'
    if (hour >= 12 && hour < 17) return '오후'
    if (hour >= 17 && hour < 22) return '저녁'
    return '밤'
  }

  private calculateCompletionRate(data: LightModeData[]): number {
    if (data.length === 0) return 0
    
    const completed = data.filter(d => d.completed).length
    return Math.round((completed / data.length) * 100)
  }

  private isMorningPerson(data: LightModeData[]): boolean {
    const morningActivities = data.filter(d => d.context.hour >= 5 && d.context.hour < 12)
    return morningActivities.length > data.length * 0.4
  }

  private isWeekendWarrior(data: LightModeData[]): boolean {
    const weekendActivities = data.filter(d => 
      d.context.dayOfWeek === 0 || d.context.dayOfWeek === 6
    )
    return weekendActivities.length > data.length * 0.4
  }

  private calculateConsistency(data: LightModeData[]): number {
    if (data.length < 7) return 5 // 중간값 반환
    
    // 최근 7일간 활동 일수 계산
    const last7Days = new Set()
    const now = Date.now()
    
    data.forEach(d => {
      const daysSince = Math.floor((now - d.timestamp.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince < 7) {
        last7Days.add(new Date(d.timestamp).toDateString())
      }
    })
    
    return Math.round((last7Days.size / 7) * 10)
  }

  /**
   * 고급 분석 메서드들 (프로 모드)
   */
  private generateHourlyHeatmap(data: ProModeData[]): Record<number, number> {
    const heatmap: Record<number, number> = {}
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData = data.filter(d => d.context.hour === hour)
      const avgQuality = hourData.length > 0
        ? hourData.reduce((sum, d) => sum + this.qualityToNumber(d.quality), 0) / hourData.length
        : 0
      heatmap[hour] = avgQuality
    }
    
    return heatmap
  }

  private calculateWeeklyTrends(data: ProModeData[]): number[] {
    // 최근 4주간의 활동 추세
    const trends: number[] = []
    const now = Date.now()
    
    for (let week = 0; week < 4; week++) {
      const weekStart = now - (week + 1) * 7 * 24 * 60 * 60 * 1000
      const weekEnd = now - week * 7 * 24 * 60 * 60 * 1000
      
      const weekData = data.filter(d => {
        const time = d.timestamp.getTime()
        return time >= weekStart && time < weekEnd
      })
      
      trends.push(weekData.length)
    }
    
    return trends.reverse()
  }

  private predictBurnout(data: ProModeData[]): number {
    // 번아웃 위험도 예측 (0-100)
    let riskScore = 0
    
    // 최근 활동 빈도 증가
    const recentTrend = this.calculateWeeklyTrends(data)
    if (recentTrend[3] > recentTrend[0] * 2) riskScore += 30
    
    // 휴식 없는 연속 활동
    const consecutiveDays = this.countConsecutiveDays(data)
    if (consecutiveDays > 14) riskScore += 40
    
    // 품질 하락 추세
    const qualityTrend = this.analyzeQualityTrend(data)
    if (qualityTrend < -0.5) riskScore += 30
    
    return Math.min(riskScore, 100)
  }

  /**
   * 헬퍼 메서드들
   */
  private async getRecentActivities(
    userId: string, 
    mode: PersonalizationMode
  ): Promise<(LightModeData | ProModeData)[]> {
    const days = mode === 'light' ? 30 : 365
    const since = new Date()
    since.setDate(since.getDate() - days)
    
    const activities = await db.activities
      .where('userId')
      .equals(userId)
      .and(activity => activity.timestamp >= since)
      .toArray()
    
    // Activity를 모드에 맞는 데이터로 변환
    return activities.map(activity => 
      mode === 'light' 
        ? this.convertToLightData(activity)
        : this.convertToProData(activity)
    )
  }

  private convertToLightData(activity: Activity): LightModeData {
    return {
      timestamp: activity.timestamp,
      type: activity.statType,
      quality: activity.quality,
      completed: true,
      context: {
        hour: activity.timestamp.getHours(),
        dayOfWeek: activity.timestamp.getDay()
      }
    }
  }

  private convertToProData(activity: Activity): ProModeData {
    const lightData = this.convertToLightData(activity)
    
    return {
      ...lightData,
      fullDescription: activity.description || activity.activityName,
      duration: activity.duration,
      location: activity.location,
      tags: activity.tags,
      detailedContext: {
        // 프로 모드 추가 컨텍스트
      }
    }
  }

  private qualityToNumber(quality: string): number {
    const map = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
    return map[quality] || 0
  }

  private suggestNextActivityTime(data: LightModeData[]): string {
    const bestHour = parseInt(this.findBestTimeSlot(data))
    const now = new Date()
    const currentHour = now.getHours()
    
    if (currentHour < bestHour) {
      return `오늘 ${bestHour}시`
    } else {
      return `내일 ${bestHour}시`
    }
  }

  private suggestActivity(data: LightModeData[]): string {
    const topActivities = this.getTopActivities(data, 3)
    return topActivities[Math.floor(Math.random() * topActivities.length)] || '운동'
  }

  private generateSimpleTip(data: LightModeData[]): string {
    const consistency = this.calculateConsistency(data)
    
    if (consistency >= 8) {
      return '훌륭해요! 꾸준함을 유지하고 계시네요.'
    } else if (consistency >= 5) {
      return '좋아요! 조금만 더 자주 활동해보세요.'
    } else {
      return '다시 시작하기 좋은 날이에요!'
    }
  }

  // 빈 패턴 반환 메서드들
  private getEmptyLightPatterns(): LightPatterns {
    return {
      basicStats: {
        avgActivitiesPerDay: 0,
        topActivities: [],
        bestTimeSlot: '아침',
        completionRate: 0
      },
      simplePatterns: {
        morningPerson: false,
        weekendWarrior: false,
        consistencyScore: 0
      },
      basicRecommendations: {
        nextBestTime: '지금',
        suggestedActivity: '가벼운 운동',
        motivationTip: '첫 걸음을 시작해보세요!'
      }
    }
  }

  private getEmptyProPatterns(lightPatterns: LightPatterns): ProPatterns {
    return {
      ...lightPatterns,
      advancedStats: {
        hourlyHeatmap: {},
        weeklyProgressTrend: [],
        seasonalPatterns: [],
        correlations: {}
      },
      deepPatterns: {
        activitySequences: [],
        contextualSuccess: {},
        burnoutPrediction: 0,
        plateauDetection: false,
        motivationCycles: [],
        stressPatterns: []
      },
      proInsights: {
        yearlyGrowthCurve: [],
        skillProgressionMap: {},
        personalRecords: {},
        futureProjections: {}
      },
      precisionRecommendations: {
        microAdjustments: [],
        personalizedPrograms: [],
        recoveryProtocol: '',
        challengeCalibration: 5
      }
    }
  }

  // 추가 프로 모드 메서드들 (간단히 구현)
  private findSeasonalPatterns(data: ProModeData[]): string[] {
    return ['봄에 활발', '여름 저조']
  }

  private findActivityCorrelations(data: ProModeData[]): Record<string, number> {
    return { '운동→학습': 0.7, '학습→휴식': 0.8 }
  }

  private findSuccessfulSequences(data: ProModeData[]): string[][] {
    return [['아침운동', '건강한아침', '집중학습']]
  }

  private analyzeContextualFactors(data: ProModeData[]): Record<string, number> {
    return { '날씨_맑음': 0.8, '혼자': 0.6 }
  }

  private detectPlateau(data: ProModeData[]): boolean {
    return false
  }

  private analyzeMoodCycles(data: ProModeData[]): string[] {
    return ['주초 긍정적', '주말 향상']
  }

  private analyzeStressIndicators(data: ProModeData[]): string[] {
    return ['수요일 피크', '금요일 완화']
  }

  private calculateYearlyGrowth(data: ProModeData[]): number[] {
    return [10, 25, 40, 55, 70, 85]
  }

  private mapSkillProgression(data: ProModeData[]): Record<string, number> {
    return { '운동': 75, '학습': 60, '관계': 45, '성취': 80 }
  }

  private findPersonalRecords(data: ProModeData[]): Record<string, number | string | Date> {
    return { '최장연속일': 21, '최고품질': 'S급 15회' }
  }

  private projectFutureProgress(data: ProModeData[]): Record<string, number> {
    return { '30일후': 120, '90일후': 380 }
  }

  private suggestMicroChanges(data: ProModeData[]): string[] {
    return ['운동 시작 5분 앞당기기', '휴식 시간 10분 추가']
  }

  private generatePrograms(data: ProModeData[]): Array<{
    name: string
    description: string
    duration: number
    activities: string[]
  }> {
    return [{
      name: '아침 루틴 최적화',
      description: '생산성 향상을 위한 아침 루틴',
      duration: 14,
      activities: ['명상', '운동', '계획 수립']
    }]
  }

  private suggestRecovery(data: ProModeData[]): string {
    return '48시간 가벼운 활동 권장'
  }

  private calibrateDifficulty(data: ProModeData[]): number {
    return 7 // 1-10 난이도
  }

  private countConsecutiveDays(data: ProModeData[]): number {
    // 연속 활동 일수 계산
    const dates = Array.from(new Set(
      data.map(d => new Date(d.timestamp).toDateString())
    )).sort()
    
    let maxConsecutive = 0
    let currentConsecutive = 1
    
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays === 1) {
        currentConsecutive++
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
        currentConsecutive = 1
      }
    }
    
    return Math.max(maxConsecutive, currentConsecutive)
  }

  private analyzeQualityTrend(data: ProModeData[]): number {
    // 품질 추세 분석 (-1 ~ 1)
    if (data.length < 10) return 0
    
    const recent = data.slice(-10)
    const older = data.slice(-20, -10)
    
    const recentAvg = recent.reduce((sum, d) => sum + this.qualityToNumber(d.quality), 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + this.qualityToNumber(d.quality), 0) / older.length
    
    return (recentAvg - olderAvg) / 5 // 정규화
  }
}