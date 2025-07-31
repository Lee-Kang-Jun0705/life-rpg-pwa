'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { PushNotificationManager } from '@/lib/notifications/push-manager'
import { NotificationPreferences, NotificationType } from '@/lib/notifications/types'

export default function NotificationSettingsPage() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const pushManager = PushNotificationManager.getInstance()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      // 권한 상태 확인
      if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      // 설정 불러오기
      const prefs = await pushManager.getPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error('설정 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pushManager])

  const handleRequestPermission = async () => {
    const result = await pushManager.requestPermission()
    setPermission(result)
    
    if (result === 'granted') {
      // 푸시 구독
      await pushManager.subscribeToPush()
      
      // 알림 활성화
      if (preferences) {
        const updatedPrefs = { ...preferences, enabled: true }
        setPreferences(updatedPrefs)
        await savePreferences(updatedPrefs)
      }
    }
  }

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!preferences) return

    const updatedPrefs = { ...preferences, enabled }
    setPreferences(updatedPrefs)
    await savePreferences(updatedPrefs)

    if (enabled && permission === 'granted') {
      // 알림 스케줄링
      await pushManager.scheduleActivityReminders()
    }
  }

  const handleToggleType = async (type: NotificationType, enabled: boolean) => {
    if (!preferences) return

    const updatedPrefs = {
      ...preferences,
      types: {
        ...preferences.types,
        [type]: enabled
      }
    }
    setPreferences(updatedPrefs)
    await savePreferences(updatedPrefs)
  }

  const handleTimeChange = async (
    schedule: 'activityReminder' | 'streakReminder',
    index: number | null,
    time: string
  ) => {
    if (!preferences) return

    const updatedPrefs = { ...preferences }
    
    if (schedule === 'activityReminder' && index !== null) {
      updatedPrefs.schedule.activityReminder.times[index] = time
    } else if (schedule === 'streakReminder') {
      updatedPrefs.schedule.streakReminder.time = time
    }

    setPreferences(updatedPrefs)
    await savePreferences(updatedPrefs)
  }

  const savePreferences = async (prefs: NotificationPreferences) => {
    setIsSaving(true)
    try {
      await pushManager.savePreferences(prefs)
      
      // 알림 재스케줄링
      if (prefs.enabled && permission === 'granted') {
        await pushManager.scheduleActivityReminders()
      }
    } catch (error) {
      console.error('설정 저장 실패:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const testNotification = async () => {
    await pushManager.showLocalNotification({
      title: '🎯 테스트 알림',
      body: '알림이 정상적으로 작동합니다!',
      tag: 'test',
      actions: [
        { action: 'close', title: '닫기' }
      ]
    })
  }

  if (isLoading || !preferences) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">알림 설정</h1>

      {/* 권한 요청 */}
      {permission !== 'granted' && (
        <Card className="p-6 mb-6 bg-yellow-50 dark:bg-yellow-900/20">
          <h2 className="text-lg font-semibold mb-2">알림 권한이 필요합니다</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            활동 리마인더와 중요한 알림을 받으려면 권한을 허용해주세요.
          </p>
          <Button onClick={handleRequestPermission}>
            알림 권한 요청
          </Button>
        </Card>
      )}

      {/* 메인 토글 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">푸시 알림</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              모든 알림을 켜거나 끕니다
            </p>
          </div>
          <Toggle
            checked={preferences.enabled && permission === 'granted'}
            onChange={handleToggleNotifications}
            disabled={permission !== 'granted'}
          />
        </div>

        {preferences.enabled && permission === 'granted' && (
          <Button
            onClick={testNotification}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            테스트 알림 보내기
          </Button>
        )}
      </Card>

      {/* 알림 종류 설정 */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">알림 종류</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">활동 리마인더</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                일정 시간마다 활동을 상기시켜드립니다
              </p>
            </div>
            <Toggle
              checked={preferences.types.activity_reminder}
              onChange={(checked) => handleToggleType('activity_reminder', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">레벨업 알림</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                레벨업 시 축하 메시지를 보냅니다
              </p>
            </div>
            <Toggle
              checked={preferences.types.level_up}
              onChange={(checked) => handleToggleType('level_up', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">던전 리셋</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                새로운 던전이 열렸을 때 알려드립니다
              </p>
            </div>
            <Toggle
              checked={preferences.types.dungeon_reset}
              onChange={(checked) => handleToggleType('dungeon_reset', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">업적 달성</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                새로운 업적을 달성했을 때 알려드립니다
              </p>
            </div>
            <Toggle
              checked={preferences.types.achievement_unlocked}
              onChange={(checked) => handleToggleType('achievement_unlocked', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">연속 출석</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                연속 출석 기록을 유지하도록 도와드립니다
              </p>
            </div>
            <Toggle
              checked={preferences.types.streak_reminder}
              onChange={(checked) => handleToggleType('streak_reminder', checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </div>
      </Card>

      {/* 스케줄 설정 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">알림 시간 설정</h2>
        
        {/* 활동 리마인더 시간 */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">활동 리마인더 시간</h3>
          <div className="space-y-2">
            {preferences.schedule.activityReminder.times.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange('activityReminder', index, e.target.value)}
                  disabled={!preferences.enabled || !preferences.types.activity_reminder}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {index === 0 ? '오전' : '오후'} 알림
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 연속 출석 리마인더 시간 */}
        <div>
          <h3 className="font-medium mb-3">연속 출석 리마인더</h3>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={preferences.schedule.streakReminder.time}
              onChange={(e) => handleTimeChange('streakReminder', null, e.target.value)}
              disabled={!preferences.enabled || !preferences.types.streak_reminder}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              매일 이 시간에 알림
            </span>
          </div>
        </div>
      </Card>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg">
          저장 중...
        </div>
      )}
    </div>
  )
}