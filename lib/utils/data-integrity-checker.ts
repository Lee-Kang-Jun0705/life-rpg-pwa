/**
 * 데이터 무결성 검사 도구
 * 데이터베이스의 일관성과 정합성을 검증
 */

import { db } from '@/lib/database'
import { calculateLevelFromExperience } from '@/lib/utils/stat-calculator'
import type { Activity } from '@/lib/database/types'

export interface IntegrityIssue {
  type: 'LEVEL_MISMATCH' | 'EXPERIENCE_MISMATCH' | 'MISSING_DATA' | 'DUPLICATE_DATA' | 'ORPHAN_DATA'
  severity: 'critical' | 'warning' | 'info'
  table: string
  field?: string
  expected?: unknown
  actual?: unknown
  description: string
  suggestion?: string
}

export class DataIntegrityChecker {
  private issues: IntegrityIssue[] = []

  /**
   * 전체 데이터 일관성 검사
   */
  async checkAll(userId: string): Promise<IntegrityIssue[]> {
    this.issues = []
    
    await this.checkProfileIntegrity(userId)
    await this.checkStatsIntegrity(userId)
    await this.checkExperienceConsistency(userId)
    await this.checkActivityIntegrity(userId)
    await this.checkOrphanData(userId)
    
    return this.issues
  }

  /**
   * 프로필 무결성 검사
   */
  private async checkProfileIntegrity(userId: string): Promise<void> {
    const profile = await db.profiles.where('userId').equals(userId).first()
    
    if (!profile) {
      this.addIssue({
        type: 'MISSING_DATA',
        severity: 'critical',
        table: 'profiles',
        description: `사용자 ${userId}의 프로필이 없습니다`,
        suggestion: '프로필을 생성해야 합니다'
      })
      return
    }

    // 신규 필드 확인
    if (profile.totalExperience === undefined || profile.currentExperience === undefined) {
      this.addIssue({
        type: 'MISSING_DATA',
        severity: 'warning',
        table: 'profiles',
        field: 'totalExperience/currentExperience',
        description: '프로필에 새로운 경험치 필드가 없습니다',
        suggestion: '데이터베이스 마이그레이션을 실행하세요'
      })
    }

    // 레벨과 경험치 일치 확인
    if (profile.totalExperience !== undefined) {
      const { level: expectedLevel } = calculateLevelFromExperience(profile.totalExperience)
      if (profile.level !== expectedLevel) {
        this.addIssue({
          type: 'LEVEL_MISMATCH',
          severity: 'critical',
          table: 'profiles',
          field: 'level',
          expected: expectedLevel,
          actual: profile.level,
          description: '프로필 레벨이 총 경험치와 일치하지 않습니다'
        })
      }
    }
  }

  /**
   * 스탯 무결성 검사
   */
  private async checkStatsIntegrity(userId: string): Promise<void> {
    const stats = await db.stats.where('userId').equals(userId).toArray()
    const statTypes = ['health', 'learning', 'relationship', 'achievement']
    
    // 필수 스탯 확인
    for (const type of statTypes) {
      const stat = stats.find(s => s.type === type)
      if (!stat) {
        this.addIssue({
          type: 'MISSING_DATA',
          severity: 'critical',
          table: 'stats',
          field: type,
          description: `${type} 스탯이 없습니다`,
          suggestion: '기본 스탯을 생성해야 합니다'
        })
      }
    }
    
    // 중복 스탯 확인
    const statCounts = stats.reduce((acc, stat) => {
      acc[stat.type] = (acc[stat.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    for (const [type, count] of Object.entries(statCounts)) {
      if (count > 1) {
        this.addIssue({
          type: 'DUPLICATE_DATA',
          severity: 'critical',
          table: 'stats',
          field: type,
          actual: count,
          description: `${type} 스탯이 ${count}개 있습니다`,
          suggestion: '중복된 스탯을 제거해야 합니다'
        })
      }
    }
    
    // 각 스탯의 레벨과 경험치 일치 확인
    for (const stat of stats) {
      const { level: expectedLevel } = calculateLevelFromExperience(stat.experience)
      if (stat.level !== expectedLevel) {
        this.addIssue({
          type: 'LEVEL_MISMATCH',
          severity: 'warning',
          table: 'stats',
          field: `${stat.type}.level`,
          expected: expectedLevel,
          actual: stat.level,
          description: `${stat.type} 스탯의 레벨이 경험치와 일치하지 않습니다`
        })
      }
    }
  }

  /**
   * 경험치 일관성 검사
   */
  private async checkExperienceConsistency(userId: string): Promise<void> {
    const profile = await db.profiles.where('userId').equals(userId).first()
    const stats = await db.stats.where('userId').equals(userId).toArray()
    const activities = await db.activities.where('userId').equals(userId).toArray()
    
    if (!profile || stats.length === 0) return
    
    // 스탯 총 경험치와 프로필 총 경험치 비교
    const totalStatExp = stats.reduce((sum, stat) => sum + stat.experience, 0)
    
    if (profile.totalExperience !== undefined && 
        Math.abs(profile.totalExperience - totalStatExp) > 10) {
      this.addIssue({
        type: 'EXPERIENCE_MISMATCH',
        severity: 'critical',
        table: 'profiles',
        field: 'totalExperience',
        expected: totalStatExp,
        actual: profile.totalExperience,
        description: '프로필의 총 경험치가 스탯 합계와 일치하지 않습니다'
      })
    }
    
    // 활동 기록과 스탯 경험치 비교
    const expByType = activities.reduce((acc, activity) => {
      acc[activity.statType] = (acc[activity.statType] || 0) + activity.experience
      return acc
    }, {} as Record<string, number>)
    
    for (const stat of stats) {
      const activityExp = expByType[stat.type] || 0
      const diff = Math.abs(stat.experience - activityExp)
      
      if (diff > 100) { // 100 이상 차이나면 문제
        this.addIssue({
          type: 'EXPERIENCE_MISMATCH',
          severity: 'warning',
          table: 'stats',
          field: `${stat.type}.experience`,
          expected: activityExp,
          actual: stat.experience,
          description: `${stat.type} 스탯의 경험치가 활동 기록과 ${diff} 차이납니다`,
          suggestion: '활동 기록이 누락되었거나 동기화 문제일 수 있습니다'
        })
      }
    }
  }

  /**
   * 활동 무결성 검사
   */
  private async checkActivityIntegrity(userId: string): Promise<void> {
    const activities = await db.activities.where('userId').equals(userId).toArray()
    const stats = await db.stats.where('userId').equals(userId).toArray()
    
    // 활동 수와 스탯의 totalActivities 비교
    const activityCountByType = activities.reduce((acc, activity) => {
      acc[activity.statType] = (acc[activity.statType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    for (const stat of stats) {
      const activityCount = activityCountByType[stat.type] || 0
      
      if (stat.totalActivities !== activityCount) {
        this.addIssue({
          type: 'EXPERIENCE_MISMATCH',
          severity: 'info',
          table: 'stats',
          field: `${stat.type}.totalActivities`,
          expected: activityCount,
          actual: stat.totalActivities,
          description: `${stat.type} 스탯의 활동 수가 실제 활동 기록과 다릅니다`
        })
      }
    }
  }

  /**
   * 고아 데이터 검사
   */
  private async checkOrphanData(userId: string): Promise<void> {
    // 다른 사용자의 데이터가 있는지 확인
    const allProfiles = await db.profiles.toArray()
    const otherProfiles = allProfiles.filter(p => p.userId !== userId)
    
    if (otherProfiles.length > 0) {
      this.addIssue({
        type: 'ORPHAN_DATA',
        severity: 'info',
        table: 'profiles',
        actual: otherProfiles.length,
        description: `다른 사용자의 프로필이 ${otherProfiles.length}개 있습니다`,
        suggestion: '멀티 유저를 지원하지 않는다면 정리가 필요합니다'
      })
    }
  }

  /**
   * 이슈 추가
   */
  private addIssue(issue: IntegrityIssue): void {
    this.issues.push(issue)
  }

  /**
   * 자동 복구 시도
   */
  async autoFix(issues: IntegrityIssue[]): Promise<{ fixed: number; failed: number }> {
    let fixed = 0
    let failed = 0

    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'LEVEL_MISMATCH':
            if (issue.table === 'profiles' && issue.field === 'level') {
              const profile = await db.profiles.where('userId').equals(issue.actual).first()
              if (profile) {
                await db.profiles.update(profile.id!, {
                  level: issue.expected,
                  updatedAt: new Date()
                })
                fixed++
              }
            }
            break
            
          case 'DUPLICATE_DATA':
            if (issue.table === 'stats') {
              // 중복 스탯 중 가장 최신 것만 남기고 삭제
              const stats = await db.stats
                .where('userId').equals(issue.actual)
                .and(stat => stat.type === issue.field)
                .toArray()
              
              if (stats.length > 1) {
                const sorted = stats.sort((a, b) => 
                  b.updatedAt.getTime() - a.updatedAt.getTime()
                )
                
                for (let i = 1; i < sorted.length; i++) {
                  await db.stats.delete(sorted[i].id!)
                }
                fixed++
              }
            }
            break
            
          default:
            // 자동 수정 불가능한 경우
            failed++
        }
      } catch (error) {
        console.error('자동 복구 실패:', error)
        failed++
      }
    }

    return { fixed, failed }
  }
}

// 싱글톤 인스턴스
export const dataIntegrityChecker = new DataIntegrityChecker()