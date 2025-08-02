// 오프라인 지원을 위한 데이터베이스 래퍼
// 클라이언트 전용 패턴 사용

import { dbHelpers } from '@/lib/database/client'
import type { UserProfile, Stat, Activity, Character, Mission, Investment } from '@/lib/database/client'

// Re-export for backward compatibility
export { dbHelpers }
export type { Character, Mission, Investment, UserProfile, Stat, Activity }

// 오프라인 전용 헬퍼 함수들
export const offlineDbHelpers = {
  // 모든 기능은 이미 클라이언트 dbHelpers에 포함되어 있음
  ...dbHelpers,

  // 오프라인 동기화 관련 추가 기능 (향후 구현)
  async syncOfflineData() {
    // TODO: 오프라인 데이터 동기화 로직
    console.log('Offline sync not implemented yet')
    return true
  },

  async checkOfflineStatus() {
    return !navigator.onLine
  }
}
