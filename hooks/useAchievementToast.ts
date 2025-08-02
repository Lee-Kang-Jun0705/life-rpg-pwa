import { useEffect, useCallback } from 'react'
import { useToast, toastHelpers } from '@/components/ui/Toast'
import { achievementService } from '@/lib/achievements/achievement-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import type { AchievementSystemState } from '@/lib/types/achievements'

let lastNotificationCount = 0

export function useAchievementToast() {
  const { toast } = useToast()

  const checkForNewAchievements = useCallback(async() => {
    try {
      const state = await achievementService.getAchievementState()
      if (!state) {
        return
      }

      // 읽지 않은 'unlocked' 타입의 알림만 필터링
      const unreadUnlockedNotifications = state.notifications.filter(
        (n) => !n.isRead && n.type === 'unlocked'
      )

      // 새로운 알림이 있는지 확인
      if (unreadUnlockedNotifications.length > lastNotificationCount) {
        // 가장 최근 알림에 대해서만 Toast 표시
        const latestNotifications = unreadUnlockedNotifications
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, unreadUnlockedNotifications.length - lastNotificationCount)

        for (const notification of latestNotifications) {
          const achievement = state.achievements[notification.achievementId]
          if (achievement) {
            toast(toastHelpers.success(
              '🏆 업적 달성!',
              achievement.name,
              {
                duration: 6000,
                action: {
                  label: '보상 확인',
                  onClick: () => {
                    // 업적 페이지로 이동
                    window.location.href = '/achievements'
                  }
                }
              }
            ))
          }
        }
      }

      lastNotificationCount = unreadUnlockedNotifications.length
    } catch (error) {
      // DexieError와 초기화 관련 에러는 무시
      if (error instanceof Error) {
        const ignorableErrors = [
          'DexieError',
          'Database not opened',
          'Cannot read properties of null',
          'db is null'
        ]

        const shouldIgnore = ignorableErrors.some(msg =>
          error.name === msg || error.message.includes(msg)
        )

        if (!shouldIgnore && process.env.NODE_ENV === 'development') {
          console.warn('[Achievements] Database not ready yet:', error.message)
        }
      }
    }
  }, [toast])

  useEffect(() => {
    // 초기 로드
    checkForNewAchievements()

    // 주기적으로 확인 (5초마다)
    const interval = setInterval(checkForNewAchievements, 5000)

    // 사용자 활동 시에도 확인
    const handleActivity = () => {
      checkForNewAchievements()
    }

    window.addEventListener('focus', handleActivity)
    document.addEventListener('visibilitychange', handleActivity)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleActivity)
      document.removeEventListener('visibilitychange', handleActivity)
    }
  }, [checkForNewAchievements])

  return { checkForNewAchievements }
}
