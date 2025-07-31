'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '@/lib/settings/settings-context'
import { useCharacter } from '@/lib/character'
import { DotCharacter } from '@/components/character/DotCharacter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CharacterCustomizationModal } from '@/components/character/CharacterCustomizationModal'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { Stat } from '@/lib/types/dashboard'
import type { Activity } from '@/lib/database/types'
import { Calendar, TrendingUp, Award, Target, Clock, Flame, Star, Trophy, BookOpen } from 'lucide-react'

export default function ProfilePage() {
  const { settings, updateSettings, isLoading } = useSettings()
  const { currentAppearance } = useCharacter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: settings.profile.displayName,
    bio: settings.profile.bio || ''
  })
  const [userStats, setUserStats] = useState<Stat[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [joinDate] = useState(new Date('2024-01-01')) // 가입일 (실제로는 DB에서 가져와야 함)

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stats, recentActivities] = await Promise.all([
          dbHelpers.getStats(GAME_CONFIG.DEFAULT_USER_ID),
          dbHelpers.getActivities(GAME_CONFIG.DEFAULT_USER_ID, 50) // 최근 50개 활동
        ])
        setUserStats(stats)
        setActivities(recentActivities)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setStatsLoading(false)
      }
    }
    loadData()
  }, [])

  // 계산된 값들
  const totalDays = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalLevel = userStats.reduce((sum, stat) => sum + (stat.level || 0), 0)
  const totalExp = userStats.reduce((sum, stat) => sum + (stat.experience || 0), 0)
  const totalActivities = userStats.reduce((sum, stat) => sum + (stat.totalActivities || 0), 0)
  const avgDailyActivities = totalActivities / Math.max(totalDays, 1)
  
  // 연속 활동 일수 계산 (간단한 버전)
  const streakDays = calculateStreakDays(activities)
  
  // 주요 마일스톤들
  const milestones = generateMilestones(userStats, activities, joinDate)

  function calculateStreakDays(activities: Activity[]): number {
    if (activities.length === 0) return 0
    
    const today = new Date()
    let streak = 0
    
    // 최근 활동부터 역순으로 확인
    for (let i = 0; i < Math.min(30, activities.length); i++) {
      const activityDate = new Date(activities[i].timestamp)
      const daysDiff = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  function generateMilestones(stats: Stat[], activities: Activity[], joinDate: Date) {
    const milestones = []
    
    // 가입일
    milestones.push({
      date: joinDate,
      title: 'Life RPG 여정 시작! 🎮',
      description: '새로운 자기계발 여정을 시작했어요',
      type: 'start',
      icon: '🚀'
    })
    
    // 첫 활동
    if (activities.length > 0) {
      const firstActivity = activities[activities.length - 1]
      milestones.push({
        date: new Date(firstActivity.timestamp),
        title: '첫 번째 활동 완료! 💪',
        description: `${firstActivity.activityName}로 첫 걸음을 내딛었어요`,
        type: 'achievement',
        icon: '⭐'
      })
    }
    
    // 레벨 업 마일스톤들
    stats.forEach(stat => {
      if (stat.level >= 5) {
        milestones.push({
          date: stat.updatedAt,
          title: `${stat.type} 스탯 레벨 ${stat.level} 달성! 🏆`,
          description: `꾸준한 노력으로 ${stat.type} 능력이 크게 향상되었어요`,
          type: 'level',
          icon: '📈'
        })
      }
    })
    
    // 활동 수 마일스톤들
    const activityMilestones = [10, 50, 100, 250, 500, 1000]
    activityMilestones.forEach(milestone => {
      if (totalActivities >= milestone) {
        milestones.push({
          date: new Date(), // 실제로는 달성 시점을 저장해야 함
          title: `총 ${milestone}회 활동 달성! 🎯`,
          description: `꾸준함의 힘으로 ${milestone}번의 활동을 완료했어요`,
          type: 'activity',
          icon: '🎯'
        })
      }
    })
    
    return milestones.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const handleSaveProfile = async () => {
    await updateSettings({
      profile: {
        ...settings.profile,
        displayName: editForm.displayName,
        bio: editForm.bio
      }
    })
    setIsEditModalOpen(false)
  }

  // 설정이 로딩 중일 때만 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">나의 성장 스토리</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              지금까지의 여정과 앞으로의 꿈
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/settings'}
            variant="ghost"
            size="icon"
            aria-label="설정"
          >
            ⚙️
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 - 프로필 & 핵심 지표 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 프로필 카드 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center">
                    {/* 캐릭터 */}
                    <div className="relative mx-auto mb-4 w-24 h-30">
                      <div className="w-full h-full rounded-xl bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center p-2">
                        <DotCharacter appearance={currentAppearance} size="medium" />
                      </div>
                      <button 
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg text-sm"
                        onClick={() => setIsCharacterModalOpen(true)}
                      >
                        ✏️
                      </button>
                    </div>

                    <h2 className="text-xl font-bold mb-1">
                      {settings.profile.displayName || '이름 없음'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {settings.profile.email}
                    </p>
                    
                    {settings.profile.bio && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        &ldquo;{settings.profile.bio}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <div className="text-blue-600 dark:text-blue-400 font-semibold">{totalDays}일</div>
                        <div className="text-gray-600 dark:text-gray-400">여정</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <div className="text-green-600 dark:text-green-400 font-semibold">{streakDays}일</div>
                        <div className="text-gray-600 dark:text-gray-400">연속</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setIsEditModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                    >
                      프로필 편집
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 핵심 지표 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    핵심 지표
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">총 레벨</span>
                      </div>
                      <span data-testid="user-level" className="text-xl font-bold text-purple-600 dark:text-purple-400">Lv.{totalLevel}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">총 경험치</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalExp.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="font-medium">총 활동</span>
                      </div>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">{totalActivities}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">일평균 활동</span>
                      </div>
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{avgDailyActivities.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 스탯 현황 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">현재 스탯</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {settings.statCustomizations.map((statConfig) => {
                      const userStat = userStats.find(s => s.type === statConfig.type)
                      return (
                        <div key={statConfig.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="text-2xl">{statConfig.emoji}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{statConfig.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Lv.{userStat?.level || 0} • {userStat?.experience || 0} EXP
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 오른쪽 컬럼 - 타임라인 & 인사이트 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 성장 타임라인 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    나의 성장 타임라인
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {milestones.map((milestone, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-4 border-purple-500"
                      >
                        <div className="text-2xl">{milestone.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{milestone.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {milestone.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {milestone.date.toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 최근 활동 하이라이트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    최근 활동 하이라이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.slice(0, 6).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                          {activity.statType.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{activity.activityName}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            +{activity.experience} EXP • {new Date(activity.timestamp).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {activities.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>아직 활동이 없어요</p>
                      <p className="text-sm">첫 번째 활동을 시작해보세요!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 성장 인사이트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    성장 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                        🌱 가장 활발한 영역
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userStats.sort((a, b) => (b.totalActivities || 0) - (a.totalActivities || 0))[0]?.type || 'health'} 스탯에서 
                        가장 많은 활동을 하고 있어요!
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        🚀 성장 속도
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        일평균 {avgDailyActivities.toFixed(1)}회 활동으로 
                        꾸준히 성장하고 있어요!
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                      <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        🔥 연속 기록
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {streakDays}일 연속으로 활동 중이에요! 
                        꾸준함이 힘이에요.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                      <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
                        ⭐ 다음 목표
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.ceil((totalActivities + 50) / 50) * 50}회 활동까지 
                        {Math.ceil((totalActivities + 50) / 50) * 50 - totalActivities}회 남았어요!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6">프로필 편집</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                이름
              </label>
              <input
                id="displayName"
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg
                         border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="표시할 이름을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                자기소개
              </label>
              <textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg
                         border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-primary
                         resize-none"
                rows={4}
                placeholder="간단한 자기소개를 작성해주세요"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleSaveProfile} className="flex-1">
              저장
            </Button>
            <Button 
              onClick={() => setIsEditModalOpen(false)} 
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      {/* 캐릭터 커스터마이징 모달 */}
      <CharacterCustomizationModal 
        isOpen={isCharacterModalOpen} 
        onClose={() => setIsCharacterModalOpen(false)} 
      />
    </main>
  )
}