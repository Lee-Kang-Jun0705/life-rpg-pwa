import { dbHelpers } from '@/lib/database/client'
import { waitForDatabase } from '@/lib/database/client-only'
import type { UserProfile, Stat, Activity } from '@/lib/database/client'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface DataIntegrityReport {
  totalRecords: number
  invalidRecords: number
  orphanedRecords: number
  duplicateRecords: number
  details: {
    [tableName: string]: ValidationResult
  }
}

export class DataIntegrityValidator {
  /**
   * 전체 데이터베이스 무결성 검사
   */
  static async validateDatabase(): Promise<DataIntegrityReport> {
    const report: DataIntegrityReport = {
      totalRecords: 0,
      invalidRecords: 0,
      orphanedRecords: 0,
      duplicateRecords: 0,
      details: {}
    }

    try {
      const db = await waitForDatabase()
      
      // 각 테이블 검증
      report.details.profiles = await this.validateProfiles()
      report.details.stats = await this.validateStats()
      
      // 전체 통계 집계
      for (const tableName in report.details) {
        const validation = report.details[tableName]
        if (!validation.isValid) {
          report.invalidRecords += validation.errors.length
        }
      }

      // 총 레코드 수 계산
      report.totalRecords = await this.getTotalRecordCount()
    } catch (error) {
      console.error('Database validation error:', error)
      report.details.error = {
        isValid: false,
        errors: ['Failed to validate database: ' + error],
        warnings: []
      }
    }

    return report
  }

  /**
   * 프로필 데이터 검증
   */
  static async validateProfiles(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      const profile = await dbHelpers.getProfile('default-user')
      if (!profile) {
        result.warnings.push('No profile found for default user')
      } else {
        // 기본 검증
        if (!profile.userId) result.errors.push('Profile missing userId')
        if (!profile.email) result.errors.push('Profile missing email')
        if (!profile.name) result.errors.push('Profile missing name')
      }
    } catch (error) {
      result.errors.push('Failed to validate profiles: ' + error)
    }

    result.isValid = result.errors.length === 0
    return result
  }

  /**
   * 스탯 데이터 검증
   */
  static async validateStats(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      const stats = await dbHelpers.getStats('default-user')
      
      // 스탯 타입 체크
      const expectedTypes = ['health', 'learning', 'relationship', 'achievement']
      const foundTypes = stats.map(s => s.type)
      
      for (const expectedType of expectedTypes) {
        if (!foundTypes.includes(expectedType as typeof foundTypes[number])) {
          result.warnings.push(`Missing stat type: ${expectedType}`)
        }
      }

      // 중복 검사
      const duplicates = foundTypes.filter((type, index) => foundTypes.indexOf(type) !== index)
      if (duplicates.length > 0) {
        result.errors.push(`Duplicate stat types found: ${duplicates.join(', ')}`)
      }

      // 데이터 검증
      for (const stat of stats) {
        if (stat.level < 1) result.errors.push(`Invalid level for ${stat.type}: ${stat.level}`)
        if (stat.experience < 0) result.errors.push(`Invalid experience for ${stat.type}: ${stat.experience}`)
      }
    } catch (error) {
      result.errors.push('Failed to validate stats: ' + error)
    }

    result.isValid = result.errors.length === 0
    return result
  }

  /**
   * 총 레코드 수 계산
   */
  static async getTotalRecordCount(): Promise<number> {
    try {
      const db = await waitForDatabase()
      
      const counts = await Promise.all([
        db.profiles.count(),
        db.stats.count(),
        db.activities.count(),
        db.missions.count(),
        db.characters.count(),
        db.investments.count()
      ])

      return counts.reduce((sum, count) => sum + count, 0)
    } catch (error) {
      console.error('Failed to count records:', error)
      return 0
    }
  }

  /**
   * 데이터 복구
   */
  static async repairDatabase(): Promise<void> {
    console.log('🔧 데이터베이스 복구 시작...')

    try {
      // 중복 스탯 제거
      const result = await dbHelpers.removeDuplicateStats('default-user')
      console.log(`✅ 중복 스탯 제거 완료: ${result.removed}개 제거, ${result.remaining}개 유지`)

      // 누락된 스탯 생성
      const stats = await dbHelpers.getStats('default-user')
      if (stats.length === 0) {
        await dbHelpers.initializeUserData('default-user', 'user@example.com', 'User')
        console.log('✅ 기본 스탯 생성 완료')
      }

      console.log('✅ 데이터베이스 복구 완료')
    } catch (error) {
      console.error('❌ 데이터베이스 복구 실패:', error)
      throw error
    }
  }
}