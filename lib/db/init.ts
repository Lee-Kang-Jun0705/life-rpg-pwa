import { db } from '../database'

let isInitialized = false
let initializationPromise: Promise<boolean> | null = null

export async function initializeDatabase(): Promise<boolean> {
  if (isInitialized) {
    return true
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async() => {
    try {
      // DB 버전 확인
      const version = await db.version
      console.log(`Dexie DB version: ${version}`)

      // 간단한 테스트 쿼리
      await db.profiles.count()

      isInitialized = true
      console.log('✅ Database initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Database initialization failed:', error)

      // IndexedDB가 지원되지 않거나 접근이 차단된 경우
      if (error instanceof Error && error.name === 'InvalidStateError') {
        console.warn('IndexedDB is not available. Running in memory mode.')
        isInitialized = true // 메모리 모드로 실행
        return true
      }

      return false
    }
  })()

  return initializationPromise
}

export function isDatabaseInitialized(): boolean {
  return isInitialized
}
