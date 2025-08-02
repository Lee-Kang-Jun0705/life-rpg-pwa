'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { SpecialQuest } from '@/lib/types/special-quest'
import { specialQuestService } from '@/lib/services/special-quest.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Trophy, Lock, Star, Sparkles, AlertCircle } from 'lucide-react'

interface SpecialQuestListProps {
  userId: string
  onQuestSelect: (quest: SpecialQuest) => void
}

export function SpecialQuestList({ userId, onQuestSelect }: SpecialQuestListProps) {
  const [quests, setQuests] = useState<SpecialQuest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all')

  useEffect(() => {
    loadQuests()
  }, [userId])

  const loadQuests = async() => {
    try {
      setLoading(true)
      const allQuests = await specialQuestService.getSpecialQuests(userId)
      setQuests(allQuests)
    } catch (error) {
      console.error('Failed to load special quests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuests = quests.filter(quest => {
    if (filter === 'all') {
      return true
    }
    if (filter === 'available') {
      return quest.status === 'available'
    }
    if (filter === 'completed') {
      return quest.status === 'completed'
    }
    return true
  })

  const getQuestTypeColor = (type: SpecialQuest['type']) => {
    const colors = {
      event: 'bg-purple-500',
      achievement: 'bg-yellow-500',
      collection: 'bg-blue-500',
      challenge: 'bg-red-500',
      story: 'bg-green-500',
      hidden: 'bg-gray-700'
    }
    return colors[type] || 'bg-gray-500'
  }

  const getQuestTypeIcon = (type: SpecialQuest['type']) => {
    const icons = {
      event: '🎉',
      achievement: '🏆',
      collection: '📦',
      challenge: '⚔️',
      story: '📖',
      hidden: '🔮'
    }
    return icons[type] || '❓'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-500',
      normal: 'text-blue-500',
      hard: 'text-orange-500',
      extreme: 'text-red-500',
      legendary: 'text-purple-500'
    }
    return colors[difficulty as keyof typeof colors] || 'text-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          전체
        </Button>
        <Button
          variant={filter === 'available' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('available')}
        >
          진행 가능
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          완료
        </Button>
      </div>

      {/* 퀘스트 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuests.map((quest) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                quest.status === 'locked' ? 'opacity-60' : ''
              }`}
              onClick={() => quest.status === 'available' && onQuestSelect(quest)}
            >
              {/* 퀘스트 타입 뱃지 */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs text-white ${getQuestTypeColor(quest.type)}`}>
                {getQuestTypeIcon(quest.type)} {quest.type}
              </div>

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{quest.icon}</span>
                  <span className="text-lg">{quest.name}</span>
                </CardTitle>
                <CardDescription>{quest.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 난이도 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">난이도</span>
                  <span className={`font-semibold ${getDifficultyColor(quest.difficulty)}`}>
                    {quest.difficulty.toUpperCase()}
                  </span>
                </div>

                {/* 스테이지 & 예상 시간 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">스테이지: {quest.stages}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {quest.estimatedTime}분
                  </span>
                </div>

                {/* 특별 보상 표시 */}
                {quest.rewards.guaranteedItems && quest.rewards.guaranteedItems.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-1">확정 보상</p>
                    <div className="flex flex-wrap gap-1">
                      {quest.rewards.guaranteedItems.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {item.icon} {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 제한 사항 */}
                {quest.maxAttempts && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">도전 가능</span>
                    <span className={quest.remainingAttempts === 0 ? 'text-red-500' : ''}>
                      {quest.remainingAttempts}/{quest.maxAttempts}회
                    </span>
                  </div>
                )}

                {/* 시간 제한 */}
                {quest.availableUntil && (
                  <div className="flex items-center gap-1 text-xs text-orange-500">
                    <AlertCircle className="h-3 w-3" />
                    {new Date(quest.availableUntil).toLocaleDateString()} 까지
                  </div>
                )}

                {/* 상태 표시 */}
                <div className="pt-2">
                  {quest.status === 'locked' && (
                    <Button variant="secondary" size="sm" disabled className="w-full">
                      <Lock className="h-4 w-4 mr-1" />
                      조건 미달성
                    </Button>
                  )}
                  {quest.status === 'available' && (
                    <Button variant="default" size="sm" className="w-full">
                      <Sparkles className="h-4 w-4 mr-1" />
                      도전하기
                    </Button>
                  )}
                  {quest.status === 'completed' && (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      <Trophy className="h-4 w-4 mr-1" />
                      완료
                    </Button>
                  )}
                  {quest.status === 'expired' && (
                    <Button variant="secondary" size="sm" disabled className="w-full">
                      <Clock className="h-4 w-4 mr-1" />
                      종료됨
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>조건에 맞는 특별 퀘스트가 없습니다.</p>
        </div>
      )}
    </div>
  )
}
