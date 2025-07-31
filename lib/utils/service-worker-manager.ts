// Service Worker 관리자
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private syncInterval: number | null = null

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  async register() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        // 기존 SW와 충돌하지 않도록 enhanced SW 등록
        this.registration = await navigator.serviceWorker.register('/sw-enhanced.js', {
          scope: '/'
        })
        
        console.log('[SW Manager] Service Worker registered')

        // SW 업데이트 체크
        this.registration.addEventListener('updatefound', () => {
          console.log('[SW Manager] New service worker available')
        })

        // 백그라운드 동기화 등록
        await this.registerBackgroundSync()

        // 주기적 동기화 설정 (30분마다)
        this.setupPeriodicSync()

        // SW 메시지 리스너
        navigator.serviceWorker.addEventListener('message', this.handleSWMessage)

        return true
      } catch (error) {
        console.error('[SW Manager] Registration failed:', error)
        return false
      }
    }
    return false
  }

  // 백그라운드 동기화 등록
  private async registerBackgroundSync() {
    if (this.registration && 'sync' in this.registration) {
      try {
        await this.registration.sync.register('sync-game-data')
        console.log('[SW Manager] Background sync registered')
      } catch (error) {
        console.error('[SW Manager] Background sync registration failed:', error)
      }
    }
  }

  // 주기적 동기화 설정
  private setupPeriodicSync() {
    // 30분마다 동기화
    this.syncInterval = window.setInterval(() => {
      this.triggerSync()
    }, 30 * 60 * 1000)

    // 페이지 포커스 시 동기화
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.triggerSync()
      }
    })
  }

  // 즉시 동기화 트리거
  async triggerSync() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOW'
      })
    }
  }

  // SW 메시지 처리
  private handleSWMessage = (event: MessageEvent) => {
    console.log('[SW Manager] Message from SW:', event.data)

    switch (event.data.type) {
      case 'SYNC_COMPLETE':
        // 동기화 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('sw-sync-complete', {
          detail: event.data
        }))
        break
    }
  }

  // 알림 권한 요청
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  // 정리
  unregister() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    navigator.serviceWorker.removeEventListener('message', this.handleSWMessage)
  }
}

// React Hook
import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const swManager = ServiceWorkerManager.getInstance()
    
    swManager.register().then(registered => {
      setIsRegistered(registered)
    })

    // 동기화 완료 리스너
    const handleSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent
      setLastSync(new Date(customEvent.detail.timestamp))
    }

    window.addEventListener('sw-sync-complete', handleSyncComplete)

    return () => {
      window.removeEventListener('sw-sync-complete', handleSyncComplete)
    }
  }, [])

  return {
    isRegistered,
    lastSync,
    triggerSync: () => ServiceWorkerManager.getInstance().triggerSync(),
    requestNotifications: () => ServiceWorkerManager.getInstance().requestNotificationPermission()
  }
}