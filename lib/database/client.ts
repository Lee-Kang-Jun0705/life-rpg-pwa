// 클라이언트 컴포넌트에서 사용할 데이터베이스 API
// SSR 환경에서 안전하게 동작

export { clientDbHelpers as dbHelpers } from './client-helpers'
export { getClientDatabase, waitForDatabase } from './client-only'
export type * from './types'

import type { LifeRPGDatabase } from './index'

// 데이터베이스 인스턴스 export
let dbInstance: LifeRPGDatabase | null = null

if (typeof window !== 'undefined') {
  // 클라이언트에서만 실제 DB 인스턴스 생성
  const { default: realDb } = require('./index') as { default: LifeRPGDatabase }
  dbInstance = realDb
}

export const db = dbInstance