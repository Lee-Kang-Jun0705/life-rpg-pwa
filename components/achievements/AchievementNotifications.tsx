'use client'

import React from 'react'
import type { AchievementNotification, Achievement } from '@/lib/types/achievements'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Trophy, TrendingUp, Check, CheckCheck } from 'lucide-react'

interface AchievementNotificationsProps {
  notifications: AchievementNotification[]
  achievements: Record<string, Achievement>
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
}

export function AchievementNotifications({
  notifications,
  achievements,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}: AchievementNotificationsProps) {
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          {/* 헤더 */}
          <div className="bg-purple-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h2 className="text-lg font-semibold">업적 알림</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                    title="모두 읽음"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
                  알림이 없습니다
                </h3>
                <p className="text-sm text-gray-500">
                  업적을 달성하면 알림이 표시됩니다
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedNotifications.map((notification, index) => {
                  const achievement = achievements[notification.achievementId]
                  if (!achievement) {
                    return null
                  }

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
                      className={`
                        p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                        ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* 아이콘 */}
                        <div className={`
                          p-2 rounded-full flex-shrink-0
                          ${notification.type === 'unlocked'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                    }
                        `}>
                          {notification.type === 'unlocked' ? (
                            <Trophy className="w-4 h-4 text-white" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-sm">
                                {notification.type === 'unlocked'
                                  ? '업적 달성!'
                                  : '진행도 업데이트'
                                }
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-medium">{achievement.name}</span>
                                {notification.type === 'unlocked'
                                  ? '을(를) 달성했습니다!'
                                  : '의 진행도가 업데이트되었습니다'
                                }
                              </p>

                              {/* 보상 미리보기 (달성 시에만) */}
                              {notification.type === 'unlocked' && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {achievement.rewards.exp && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                      +{achievement.rewards.exp} EXP
                                    </span>
                                  )}
                                  {achievement.rewards.gold && (
                                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                                      +{achievement.rewards.gold} 골드
                                    </span>
                                  )}
                                  {achievement.rewards.title && (
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded">
                                      칭호
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* 읽음 표시 */}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>

                          {/* 시간 */}
                          <div className="text-xs text-gray-500 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 하단 */}
          {notifications.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                닫기
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// 시간 포맷팅
function formatTimestamp(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(timestamp).getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) {
    return '방금 전'
  } else if (minutes < 60) {
    return `${minutes}분 전`
  } else if (hours < 24) {
    return `${hours}시간 전`
  } else if (days < 7) {
    return `${days}일 전`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}
