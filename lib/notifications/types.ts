export type NotificationType = 
  | 'activity_reminder'
  | 'level_up'
  | 'dungeon_reset'
  | 'achievement_unlocked'
  | 'streak_reminder'
  | 'friend_activity'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  requireInteraction?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationPreferences {
  enabled: boolean
  types: {
    [key in NotificationType]: boolean
  }
  schedule: {
    activityReminder: {
      enabled: boolean
      times: string[] // ['09:00', '18:00']
    }
    streakReminder: {
      enabled: boolean
      time: string // '20:00'
    }
  }
}

export interface ScheduledNotification {
  id: string
  type: NotificationType
  scheduledFor: Date
  payload: NotificationPayload
  sent: boolean
}