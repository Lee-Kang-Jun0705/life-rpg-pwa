import { CryptoUtil } from './crypto'
import { profileRepository, statRepository } from './repositories'
import { waitForDatabase } from '@/lib/database/client-only'
import { IdGenerators } from '@/lib/utils/id-generator'

export interface BackupMetadata {
  version: string
  createdAt: Date
  deviceId: string
  checksum?: string
}

export interface BackupData {
  metadata: BackupMetadata
  profiles: unknown[]
  stats: unknown[]
  activities: unknown[]
  characters: unknown[]
  missions: unknown[]
  investments: unknown[]
}

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0'

  /**
   * 전체 데이터베이스 백업 생성
   */
  static async createBackup(password?: string): Promise<string> {
    try {
      const db = await waitForDatabase()

      const backup: BackupData = {
        metadata: {
          version: this.BACKUP_VERSION,
          createdAt: new Date(),
          deviceId: await this.getDeviceId()
        },
        profiles: await db.profiles.toArray(),
        stats: await db.stats.toArray(),
        activities: await db.activities.toArray(),
        characters: await db.characters.toArray(),
        missions: await db.missions.toArray(),
        investments: await db.investments.toArray()
      }

      // 체크섬 추가
      backup.metadata.checksum = await this.calculateChecksum(backup)

      // 암호화 옵션
      if (password) {
        return await CryptoUtil.encryptObject(backup, password)
      }

      return JSON.stringify(backup, null, 2)
    } catch (error) {
      console.error('백업 생성 실패:', error)
      throw error
    }
  }

  /**
   * 백업 데이터 복원
   */
  static async restoreBackup(backupData: string, password?: string): Promise<void> {
    try {
      const db = await waitForDatabase()

      let backup: BackupData

      // 암호화된 경우 복호화
      if (password) {
        const decrypted = await CryptoUtil.decryptObject<BackupData>(backupData, password)
        if (!decrypted) {
          throw new Error('잘못된 비밀번호이거나 손상된 백업 파일입니다.')
        }
        backup = decrypted
      } else {
        backup = JSON.parse(backupData)
      }

      // 버전 확인
      if (backup.metadata.version !== this.BACKUP_VERSION) {
        console.warn(`백업 버전 불일치: ${backup.metadata.version} vs ${this.BACKUP_VERSION}`)
      }

      // 체크섬 검증
      const calculatedChecksum = await this.calculateChecksum(backup)
      if (backup.metadata.checksum && backup.metadata.checksum !== calculatedChecksum) {
        throw new Error('백업 파일이 손상되었습니다.')
      }

      // 데이터 복원 (간단한 순차 처리)
      // 기존 데이터 삭제
      await db.profiles.clear()
      await db.stats.clear()
      await db.activities.clear()
      await db.characters.clear()
      await db.missions.clear()
      await db.investments.clear()

      // 백업 데이터 복원
      if (backup.profiles?.length) {
        await db.profiles.bulkAdd(backup.profiles)
      }
      if (backup.stats?.length) {
        await db.stats.bulkAdd(backup.stats)
      }
      if (backup.activities?.length) {
        await db.activities.bulkAdd(backup.activities)
      }
      if (backup.characters?.length) {
        await db.characters.bulkAdd(backup.characters)
      }
      if (backup.missions?.length) {
        await db.missions.bulkAdd(backup.missions)
      }
      if (backup.investments?.length) {
        await db.investments.bulkAdd(backup.investments)
      }

      console.log('백업 복원 완료')
    } catch (error) {
      console.error('백업 복원 실패:', error)
      throw error
    }
  }

  /**
   * 프로필 데이터만 백업
   */
  static async backupProfile(userId: string, password?: string): Promise<string> {
    const profile = await profileRepository.getProfile(userId)
    const stats = await statRepository.getStats(userId)

    const profileBackup = {
      profile,
      stats,
      timestamp: new Date().toISOString()
    }

    if (password) {
      return await CryptoUtil.encryptObject(profileBackup, password)
    }

    return JSON.stringify(profileBackup, null, 2)
  }

  /**
   * 프로필 데이터 복원
   */
  static async restoreProfile(backupData: string, password?: string): Promise<void> {
    let profileBackup: unknown

    if (password) {
      const decrypted = await CryptoUtil.decryptObject(backupData, password)
      if (!decrypted) {
        throw new Error('잘못된 비밀번호이거나 손상된 백업 파일입니다.')
      }
      profileBackup = decrypted
    } else {
      profileBackup = JSON.parse(backupData)
    }

    if (profileBackup.profile) {
      await profileRepository.updateProfile(
        profileBackup.profile.userId,
        profileBackup.profile
      )
    }

    if (profileBackup.stats) {
      for (const stat of profileBackup.stats) {
        await statRepository.saveStat(stat)
      }
    }
  }

  /**
   * 백업 파일 다운로드
   */
  static downloadBackup(backupData: string, filename?: string): void {
    const blob = new Blob([backupData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `liferpg-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 장치 ID 생성/조회
   */
  private static async getDeviceId(): Promise<string> {
    const stored = localStorage.getItem('device-id')
    if (stored) {
      return stored
    }

    const newId = IdGenerators.device()
    localStorage.setItem('device-id', newId)
    return newId
  }

  /**
   * 체크섬 계산
   */
  private static async calculateChecksum(backup: BackupData): Promise<string> {
    const dataForChecksum = {
      ...backup,
      metadata: {
        ...backup.metadata,
        checksum: undefined
      }
    }

    const str = JSON.stringify(dataForChecksum)
    const msgUint8 = new TextEncoder().encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
