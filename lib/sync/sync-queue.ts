import { db } from '../db'

export interface SyncQueueItem {
  id?: number
  type: 'activity' | 'character' | 'dungeon' | 'shop'
  action: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: Date
  retryCount: number
  lastError?: string
}

export class SyncQueue {
  private static instance: SyncQueue
  
  static getInstance(): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue()
    }
    return SyncQueue.instance
  }

  // 동기화 대기열에 추가
  async addToQueue(_item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    try {
      await db.syncQueue.add({
        ...item,
        timestamp: new Date(),
        retryCount: 0
      })
      console.log('동기화 대기열에 추가됨:', item)
    } catch (error) {
      console.error('동기화 대기열 추가 실패:', error)
    }
  }

  // 대기 중인 항목 가져오기
  async getPendingItems(): Promise<SyncQueueItem[]> {
    try {
      return await db.syncQueue
        .where('retryCount')
        .below(3) // 3회 이상 실패한 항목은 제외
        .toArray()
    } catch (error) {
      console.error('대기 항목 조회 실패:', error)
      return []
    }
  }

  // 동기화 시도
  async syncItem(_item: SyncQueueItem): Promise<boolean> {
    try {
      // 실제 API 호출 (현재는 시뮬레이션)
      await this.simulateApiCall(item)
      
      // 성공 시 대기열에서 제거
      if (item.id) {
        await db.syncQueue.delete(item.id)
      }
      
      console.log('동기화 성공:', item)
      return true
    } catch (error) {
      // 실패 시 재시도 횟수 증가
      if (item.id) {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1,
          lastError: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
      
      console.error('동기화 실패:', error)
      return false
    }
  }

  // API 호출 시뮬레이션
  private async simulateApiCall(_item: SyncQueueItem): Promise<void> {
    // 네트워크 상태 확인
    if (!navigator.onLine) {
      throw new Error('오프라인 상태')
    }

    // 실제 구현에서는 여기서 API 호출
    console.log('API 호출 시뮬레이션:', item)
    
    // 랜덤하게 실패 시뮬레이션 (테스트용)
    if (Math.random() < 0.1) {
      throw new Error('서버 오류')
    }
  }

  // 전체 동기화 실행
  async syncAll(): Promise<{ success: number; failed: number }> {
    const items = await this.getPendingItems()
    let success = 0
    let failed = 0

    for (const item of items) {
      const result = await this.syncItem(item)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  // 실패한 항목 정리
  async clearFailedItems(): Promise<void> {
    await db.syncQueue
      .where('retryCount')
      .aboveOrEqual(3)
      .delete()
  }
}