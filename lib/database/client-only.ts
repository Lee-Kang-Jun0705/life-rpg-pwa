// 클라이언트 전용 데이터베이스 인스턴스
// SSR 문제를 근본적으로 해결하기 위한 분리

import type { LifeRPGDatabase } from './types'

let dbInstance: LifeRPGDatabase | null = null

/**
 * 클라이언트에서만 데이터베이스 인스턴스를 가져옴
 * SSR에서는 항상 null 반환
 */
export function getClientDatabase(): LifeRPGDatabase | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!dbInstance) {
    // 동적 import로 Dexie 로드
    const { LifeRPGDatabase } = require('./index')
    dbInstance = new LifeRPGDatabase()
  }

  return dbInstance
}

/**
 * 데이터베이스가 준비될 때까지 대기
 */
export async function waitForDatabase(): Promise<LifeRPGDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('Database is not available on server side')
  }

  // 데이터베이스가 초기화될 때까지 대기
  return new Promise((resolve) => {
    const checkDb = () => {
      const db = getClientDatabase()
      if (db) {
        resolve(db)
      } else {
        setTimeout(checkDb, 100)
      }
    }
    checkDb()
  })
}
