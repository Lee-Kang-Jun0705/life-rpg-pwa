/**
 * 실시간 데이터 동기화 시스템
 * BroadcastChannel을 사용한 탭 간 동기화
 */

import { gameStore } from '@/lib/store/game-store'

export interface SyncMessage {
  type: 'DATA_UPDATED' | 'REFRESH_REQUIRED' | 'STORE_RESET'
  tables?: string[]
  timestamp: number
  source: string
  data?: any
}

export class RealTimeSync {
  private channel: BroadcastChannel | null = null
  private isInitialized = false
  private source = `tab-${Date.now()}`
  private listeners: Map<string, Set<(message: SyncMessage) => void>> = new Map()

  /**
   * 동기화 시스템 초기화
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    
    try {
      // BroadcastChannel 생성
      this.channel = new BroadcastChannel('life-rpg-sync')
      
      // 메시지 수신 처리
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data)
      }
      
      // 에러 처리
      this.channel.onmessageerror = (event) => {
        console.error('Sync channel error:', event)
      }
      
      this.isInitialized = true
      console.log('실시간 동기화 시스템 초기화됨')
      
      // 탭 포커스 시 데이터 새로고침
      this.setupVisibilityHandler()
      
    } catch (error) {
      console.warn('BroadcastChannel을 지원하지 않는 환경입니다:', error)
      // 폴백: localStorage 이벤트 사용
      this.setupLocalStorageFallback()
    }
  }

  /**
   * 메시지 처리
   */
  private handleMessage(message: SyncMessage): void {
    // 자신이 보낸 메시지는 무시
    if (message.source === this.source) return
    
    console.log('동기화 메시지 수신:', message)
    
    switch (message.type) {
      case 'DATA_UPDATED':
        // 다른 탭에서 데이터가 변경됨
        this.handleDataUpdate(message)
        break
        
      case 'REFRESH_REQUIRED':
        // 전체 새로고침 필요
        gameStore.refreshFromDatabase()
        break
        
      case 'STORE_RESET':
        // 스토어 초기화 - 개발 환경에서는 무시
        console.warn('STORE_RESET 메시지 수신됨 - 개발 환경에서는 무시됩니다')
        // gameStore.reset() // 비활성화
        break
    }
    
    // 리스너들에게 알림
    this.notifyListeners(message.type, message)
  }

  /**
   * 데이터 업데이트 처리
   */
  private async handleDataUpdate(message: SyncMessage): Promise<void> {
    // 변경된 테이블이 명시되어 있으면 해당 데이터만 새로고침
    if (message.tables && message.tables.length > 0) {
      // 특정 테이블만 새로고침하는 로직
      // 현재는 전체 새로고침으로 처리
      await gameStore.refreshFromDatabase()
    } else {
      // 전체 새로고침
      await gameStore.refreshFromDatabase()
    }
  }

  /**
   * 데이터 변경 알림 브로드캐스트
   */
  broadcast(type: SyncMessage['type'], tables?: string[], data?: any): void {
    if (!this.isInitialized) return
    
    const message: SyncMessage = {
      type,
      tables,
      timestamp: Date.now(),
      source: this.source,
      data
    }
    
    try {
      this.channel?.postMessage(message)
      
      // localStorage 폴백도 함께 업데이트
      this.updateLocalStorageSync(message)
    } catch (error) {
      console.error('동기화 메시지 전송 실패:', error)
    }
  }

  /**
   * 탭 가시성 변경 처리
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 탭이 활성화되면 데이터 새로고침
        console.log('탭 활성화 - 데이터 새로고침')
        gameStore.refreshFromDatabase()
      }
    })
    
    // 탭 포커스 이벤트
    window.addEventListener('focus', () => {
      // 포커스를 받으면 동기화 상태 확인
      this.checkSyncStatus()
    })
  }

  /**
   * localStorage 폴백 설정
   */
  private setupLocalStorageFallback(): void {
    // localStorage 변경 감지
    window.addEventListener('storage', (event) => {
      if (event.key === 'life-rpg-sync') {
        try {
          const message = JSON.parse(event.newValue || '{}') as SyncMessage
          this.handleMessage(message)
        } catch (error) {
          console.error('localStorage 동기화 메시지 파싱 실패:', error)
        }
      }
    })
  }

  /**
   * localStorage 동기화 업데이트
   */
  private updateLocalStorageSync(message: SyncMessage): void {
    try {
      localStorage.setItem('life-rpg-sync', JSON.stringify(message))
      localStorage.setItem('life-rpg-sync-timestamp', Date.now().toString())
    } catch (error) {
      console.error('localStorage 동기화 실패:', error)
    }
  }

  /**
   * 동기화 상태 확인
   */
  private async checkSyncStatus(): Promise<void> {
    try {
      const lastSyncTime = localStorage.getItem('life-rpg-sync-timestamp')
      if (lastSyncTime) {
        const timeDiff = Date.now() - parseInt(lastSyncTime)
        // 5초 이상 차이나면 새로고침
        if (timeDiff > 5000) {
          await gameStore.refreshFromDatabase()
        }
      }
    } catch (error) {
      console.error('동기화 상태 확인 실패:', error)
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: SyncMessage['type'], callback: (message: SyncMessage) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    
    // 구독 해제 함수 반환
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  /**
   * 리스너들에게 알림
   */
  private notifyListeners(event: SyncMessage['type'], message: SyncMessage): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(message)
      } catch (error) {
        console.error('Sync listener error:', error)
      }
    })
  }

  /**
   * 정리
   */
  destroy(): void {
    this.channel?.close()
    this.channel = null
    this.isInitialized = false
    this.listeners.clear()
  }
}

// 싱글톤 인스턴스
export const realTimeSync = new RealTimeSync()

// 자동 초기화
if (typeof window !== 'undefined') {
  realTimeSync.initialize()
}