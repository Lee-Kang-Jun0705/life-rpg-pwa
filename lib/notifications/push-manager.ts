import { NotificationPayload, NotificationPreferences, NotificationType } from './types'
import { db } from '../db'

export class PushNotificationManager {
  private static instance: PushNotificationManager
  private swRegistration: ServiceWorkerRegistration | null = null
  
  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  // Service Worker 등록 상태 확인
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false
    }
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('푸시 알림이 지원되지 않는 브라우저입니다.')
      return false
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Service Worker 초기화 실패:', error)
      return false
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  // 푸시 구독
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.initialize()
    }

    if (!this.swRegistration) {
      console.error('Service Worker가 등록되지 않았습니다.')
      return null
    }

    try {
      // 기존 구독 확인
      const existingSubscription = await this.swRegistration.pushManager.getSubscription()
      if (existingSubscription) {
        return existingSubscription
      }

      // 새 구독 생성 (실제 서비스에서는 서버에서 VAPID 키를 받아와야 함)
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BKagOI0KfC9okmYi1VfPvjbn4PJYpBUu5rCNPRQsaXxvNpDKKBrAYveZfmKhAkyFDf_fHrp3XqPy6ZONlCKKEYc' // 예시 키
        )
      })

      // 서버에 구독 정보 전송 (실제 구현 필요)
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('푸시 구독 실패:', error)
      return null
    }
  }

  // 로컬 알림 표시
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }
    
    if (!this.swRegistration) {
      await this.initialize()
    }

    if (!this.swRegistration || Notification.permission !== 'granted') {
      console.log('알림 권한이 없습니다.')
      return
    }

    try {
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction || false
      }
      
      // actions는 Service Worker 환경에서만 지원됨
      if (payload.actions) {
        options.actions = payload.actions
      }
      
      await this.swRegistration!.showNotification(payload.title, options)
    } catch (error) {
      console.error('알림 표시 실패:', error)
    }
  }

  // 알림 스케줄링
  async scheduleNotification(
    type: NotificationType,
    scheduledFor: Date,
    payload: NotificationPayload
  ): Promise<void> {
    const now = new Date()
    const delay = scheduledFor.getTime() - now.getTime()

    if (delay <= 0) {
      // 즉시 표시
      await this.showLocalNotification(payload)
      return
    }

    // 타이머로 스케줄링 (실제 서비스에서는 서버 스케줄러 사용 권장)
    setTimeout(async () => {
      const preferences = await this.getPreferences()
      if (preferences.enabled && preferences.types[type]) {
        await this.showLocalNotification(payload)
      }
    }, delay)
  }

  // 활동 리마인더 스케줄링
  async scheduleActivityReminders(): Promise<void> {
    const preferences = await this.getPreferences()
    if (!preferences.schedule.activityReminder.enabled) return

    const now = new Date()
    
    for (const timeStr of preferences.schedule.activityReminder.times) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const scheduledTime = new Date()
      scheduledTime.setHours(hours, minutes, 0, 0)

      // 오늘 시간이 지났으면 내일로
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      await this.scheduleNotification(
        'activity_reminder',
        scheduledTime,
        {
          title: '🎯 활동 시간입니다!',
          body: '오늘의 목표를 달성하고 레벨업하세요!',
          tag: 'activity-reminder',
          actions: [
            { action: 'open', title: '시작하기' },
            { action: 'snooze', title: '나중에' }
          ]
        }
      )
    }
  }

  // 연속 출석 리마인더
  async scheduleStreakReminder(currentStreak: number): Promise<void> {
    const preferences = await this.getPreferences()
    if (!preferences.schedule.streakReminder.enabled) return

    const [hours, minutes] = preferences.schedule.streakReminder.time.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    // 오늘 시간이 지났으면 내일로
    if (scheduledTime <= new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    await this.scheduleNotification(
      'streak_reminder',
      scheduledTime,
      {
        title: `🔥 ${currentStreak}일 연속 출석 중!`,
        body: '연속 기록을 이어가세요! 내일도 만나요.',
        tag: 'streak-reminder',
        requireInteraction: true
      }
    )
  }

  // 던전 리셋 알림
  async scheduleDungeonResetNotification(): Promise<void> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(6, 0, 0, 0) // 오전 6시

    await this.scheduleNotification(
      'dungeon_reset',
      tomorrow,
      {
        title: '⚔️ 새로운 던전이 열렸습니다!',
        body: '일일 던전이 리셋되었습니다. 도전하세요!',
        tag: 'dungeon-reset',
        actions: [
          { action: 'dungeon', title: '던전 가기' }
        ]
      }
    )
  }

  // 알림 설정 가져오기
  async getPreferences(): Promise<NotificationPreferences> {
    const stored = await db.playerData.get('notification-preferences')
    
    if (stored?.data) {
      return stored.data
    }

    // 기본 설정
    return {
      enabled: false,
      types: {
        activity_reminder: true,
        level_up: true,
        dungeon_reset: true,
        achievement_unlocked: true,
        streak_reminder: true,
        friend_activity: false
      },
      schedule: {
        activityReminder: {
          enabled: true,
          times: ['09:00', '18:00']
        },
        streakReminder: {
          enabled: true,
          time: '20:00'
        }
      }
    }
  }

  // 알림 설정 저장
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    await db.playerData.put({
      id: 'notification-preferences',
      data: preferences,
      lastUpdated: new Date()
    })
  }

  // 구독 해제
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        // 서버에서도 구독 정보 제거 (실제 구현 필요)
        return true
      }
    } catch (error) {
      console.error('구독 해제 실패:', error)
    }

    return false
  }

  // 유틸리티 함수들
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    
    if (typeof window === 'undefined' || !window.atob) {
      // Node.js 환경 또는 atob이 없는 경우
      return new Uint8Array(0)
    }
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // 실제 서비스에서는 서버에 구독 정보를 전송
    console.log('구독 정보:', subscription.toJSON())
  }
}