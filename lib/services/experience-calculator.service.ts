import { Stat } from '@/lib/types/dashboard'

interface ActivityLog {
  statType: string
  timestamp: Date
  activityName: string
}

interface ExperienceFactors {
  baseExp: number
  qualityMultiplier: number
  bonusMultiplier: number
  penaltyMultiplier: number
  finalExp: number
}

export class ExperienceCalculatorService {
  private static readonly BASE_MIN_EXP = 50
  private static readonly BASE_MAX_EXP = 80
  
  // 최근 활동 기록 (메모리에 임시 저장)
  private static recentActivities: ActivityLog[] = []
  
  // 품질 등급별 기본 경험치
  private static readonly QUALITY_BASE_EXP = {
    D: 50,  // 단순 클릭
    C: 55,  // 활동명만 입력
    B: 65,  // 구체적 설명
    A: 75,  // 시간/장소 포함
    S: 80   // 미디어 인증
  }
  
  // 품질 배수
  private static readonly QUALITY_MULTIPLIERS = {
    D: 1.0,
    C: 1.1,
    B: 1.3,
    A: 1.5,
    S: 1.7
  }
  
  /**
   * 활동의 품질 등급 판정
   */
  private static getQualityGrade(activityName: string, hasMedia = false): keyof typeof this.QUALITY_BASE_EXP {
    if (hasMedia) return 'S'
    
    const length = activityName.length
    if (length < 10) return 'D'
    if (length < 30) return 'C'
    if (length < 50) return 'B'
    
    // 시간, 장소 키워드 체크
    const hasTimeKeywords = /시간|분|시|오전|오후|아침|점심|저녁|밤/.test(activityName)
    const hasPlaceKeywords = /에서|장소|집|회사|학교|공원|카페|헬스장/.test(activityName)
    
    if (hasTimeKeywords && hasPlaceKeywords) return 'A'
    if (hasTimeKeywords || hasPlaceKeywords) return 'B'
    
    return 'C'
  }
  
  /**
   * 시간대 보너스 계산
   */
  private static getTimeBonus(): number {
    const hour = new Date().getHours()
    
    // 아침 활동 (06:00-09:00)
    if (hour >= 6 && hour < 9) return 0.2
    
    // 저녁 활동 (18:00-21:00)
    if (hour >= 18 && hour < 21) return 0.15
    
    // 심야 활동 (00:00-05:00) - 페널티
    if (hour >= 0 && hour < 5) return -0.2
    
    return 0
  }
  
  /**
   * 다양성 보너스 계산
   */
  private static getDiversityBonus(): number {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentStats = new Set(
      this.recentActivities
        .filter(a => a.timestamp > last24Hours)
        .map(a => a.statType)
    )
    
    const uniqueStatCount = recentStats.size
    
    // 4가지 스탯 모두 활동
    if (uniqueStatCount === 4) return 0.3
    
    // 3가지 이상
    if (uniqueStatCount >= 3) return 0.15
    
    return 0
  }
  
  /**
   * 반복 페널티 계산
   */
  private static getRepetitionPenalty(statType: string): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentSameStats = this.recentActivities
      .filter(a => a.timestamp > oneHourAgo && a.statType === statType)
      .length
    
    // 1시간 내 같은 스탯 활동 횟수
    if (recentSameStats >= 10) return -0.7
    if (recentSameStats >= 5) return -0.5
    if (recentSameStats >= 3) return -0.2
    
    return 0
  }
  
  /**
   * 활동 간격 페널티 계산
   */
  private static getIntervalPenalty(statType: string): number {
    const lastSameActivity = this.recentActivities
      .filter(a => a.statType === statType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    if (!lastSameActivity) return 0
    
    const minutesSinceLastActivity = (Date.now() - lastSameActivity.timestamp.getTime()) / (1000 * 60)
    
    // 1분 이내
    if (minutesSinceLastActivity < 1) return -0.9
    
    // 5분 이내
    if (minutesSinceLastActivity < 5) return -0.3
    
    return 0
  }
  
  /**
   * 경험치 계산 메인 함수
   */
  static calculateExperience(
    statType: string,
    activityName: string,
    hasMedia = false
  ): ExperienceFactors {
    // 활동 기록
    this.recentActivities.push({
      statType,
      activityName,
      timestamp: new Date()
    })
    
    // 최근 100개만 유지
    if (this.recentActivities.length > 100) {
      this.recentActivities = this.recentActivities.slice(-100)
    }
    
    // 품질 등급 판정
    const quality = this.getQualityGrade(activityName, hasMedia)
    const baseExp = this.QUALITY_BASE_EXP[quality]
    const qualityMultiplier = this.QUALITY_MULTIPLIERS[quality]
    
    // 보너스 계산
    const timeBonus = this.getTimeBonus()
    const diversityBonus = this.getDiversityBonus()
    const bonusMultiplier = 1 + timeBonus + diversityBonus
    
    // 페널티 계산
    const repetitionPenalty = this.getRepetitionPenalty(statType)
    const intervalPenalty = this.getIntervalPenalty(statType)
    const penaltyMultiplier = 1 + Math.min(repetitionPenalty, intervalPenalty)
    
    // 최종 경험치 계산
    const finalExp = Math.round(
      baseExp * qualityMultiplier * bonusMultiplier * Math.max(0.1, penaltyMultiplier)
    )
    
    // 50~80 범위로 제한
    const clampedExp = Math.max(this.BASE_MIN_EXP, Math.min(this.BASE_MAX_EXP, finalExp))
    
    return {
      baseExp,
      qualityMultiplier,
      bonusMultiplier,
      penaltyMultiplier: Math.max(0.1, penaltyMultiplier),
      finalExp: clampedExp
    }
  }
  
  /**
   * 디버그용: 현재 상태 확인
   */
  static getDebugInfo() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentStats = this.recentActivities.filter(a => a.timestamp > last24Hours)
    
    return {
      totalRecentActivities: recentStats.length,
      uniqueStats: new Set(recentStats.map(a => a.statType)).size,
      currentHour: new Date().getHours(),
      recentActivities: this.recentActivities.slice(-10)
    }
  }
}