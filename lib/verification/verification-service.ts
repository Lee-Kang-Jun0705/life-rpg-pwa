import { db } from '../database'
import type { Activity } from '../types'

export interface ActivityVerification {
  activityId: string
  userId: string
  timestamp: number
  type: 'interval_check' | 'photo_upload' | 'location_check'
  verified: boolean
  metadata?: {
    previousActivityTime?: number
    intervalSeconds?: number
    photoUrl?: string
    location?: { lat: number; lng: number }
    reason?: string
  }
}

export interface VerificationResult {
  isValid: boolean
  reason?: string
  warnings?: string[]
  requiredInterval?: number
}

// 오프라인 활동이 우선이므로 시간 제한을 두지 않음
// 사용자가 입력할 때만 검증
const SUSPICIOUS_RAPID_ACTIVITY_COUNT = 10 // 5분 내 10번 이상 활동 시 의심
const SUSPICIOUS_TIME_WINDOW = 300 // 5분 (300초)

export class VerificationService {
  private static instance: VerificationService

  private constructor() {}

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService()
    }
    return VerificationService.instance
  }

  /**
   * 비정상적인 활동 패턴 체크 - 오프라인 우선 원칙에 따라 제한적으로만 체크
   */
  async checkSuspiciousPattern(
    userId: string,
    activityType: string,
    currentTime: number = Date.now()
  ): Promise<VerificationResult> {
    try {
      // 최근 동일한 활동 찾기
      const recentActivities = await db.activities
        .where('userId')
        .equals(userId)
        .reverse()
        .limit(20)
        .toArray()
      
      const sameTypeActivities = recentActivities.filter(
        activity => activity.statType === activityType
      )

      if (sameTypeActivities.length === 0) {
        return { isValid: true }
      }

      // 단시간 내 과도한 활동 체크 (경고만 제공, 차단하지 않음)
      const recentWindowActivities = sameTypeActivities.filter(
        activity => (currentTime - activity.timestamp.getTime()) / 1000 < SUSPICIOUS_TIME_WINDOW
      )

      if (recentWindowActivities.length >= SUSPICIOUS_RAPID_ACTIVITY_COUNT) {
        return {
          isValid: true, // 차단하지 않고 경고만
          warnings: [`짧은 시간에 많은 활동을 기록하고 있네요. 실제 활동에 집중하고 계신가요?`]
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Activity pattern check error:', error)
      return { isValid: false, reason: 'Verification check failed' }
    }
  }

  /**
   * 중복 활동 방지 - 완전히 동일한 활동 제출 방지
   */
  async checkDuplicateActivity(
    userId: string,
    activityType: string,
    activityData: Record<string, unknown>,
    timeWindow: number = 300 // 5분
  ): Promise<VerificationResult> {
    try {
      const currentTime = Date.now()
      const recentActivities = await db.activities
        .where('userId')
        .equals(userId)
        .reverse()
        .limit(20)
        .toArray()
      
      // 최근 timeWindow 내의 동일 타입 활동들 확인
      const duplicates = recentActivities.filter(activity => {
        if (activity.statType !== activityType) return false
        if ((currentTime - activity.timestamp.getTime()) / 1000 > timeWindow) return false
        
        // 활동 데이터 비교 (경험치, 설명 등)
        if (activity.experience === activityData.experience &&
            activity.activityName === activityData.description) {
          return true
        }
        
        return false
      })

      if (duplicates.length > 0) {
        return {
          isValid: false,
          reason: '최근에 동일한 활동을 이미 기록했습니다'
        }
      }

      return { isValid: true }
    } catch (error) {
      console.error('Duplicate activity check error:', error)
      return { isValid: false, reason: 'Verification check failed' }
    }
  }

  /**
   * 사진 업로드 검증 (준비 중)
   */
  async verifyPhotoUpload(
    userId: string,
    activityId: string,
    photoData: string | File
  ): Promise<VerificationResult> {
    // TODO: 구현 예정
    // 1. 파일 크기 체크
    // 2. 파일 타입 체크 (이미지인지)
    // 3. EXIF 데이터 확인 (촬영 시간 등)
    // 4. 로컬 스토리지에 저장
    
    return {
      isValid: true,
      warnings: ['사진 검증 기능은 곧 추가될 예정입니다']
    }
  }

  /**
   * 활동 검증 기록 저장
   */
  async saveVerification(verification: ActivityVerification): Promise<void> {
    try {
      // IndexedDB에 검증 기록 저장
      await db.verifications.add(verification)
    } catch (error) {
      console.error('Failed to save verification:', error)
    }
  }

  /**
   * 종합 검증 - 사용자가 활동을 입력할 때만 검증
   */
  async verifyActivity(
    userId: string,
    activityType: string,
    activityData: Record<string, unknown>
  ): Promise<VerificationResult> {
    const warnings: string[] = []

    // 1. 중복 활동 체크 (완전히 동일한 활동만 차단)
    const duplicateCheck = await this.checkDuplicateActivity(
      userId,
      activityType,
      activityData
    )
    if (!duplicateCheck.isValid) {
      return duplicateCheck
    }

    // 2. 의심스러운 패턴 체크 (경고만 제공)
    const patternCheck = await this.checkSuspiciousPattern(userId, activityType)
    if (patternCheck.warnings) {
      warnings.push(...patternCheck.warnings)
    }

    // 3. 검증 기록 저장
    await this.saveVerification({
      activityId: `${userId}_${Date.now()}`,
      userId,
      timestamp: Date.now(),
      type: 'interval_check',
      verified: true,
      metadata: {
        // 오프라인 우선이므로 간격 제한 없음
      }
    })

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
}