'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Star, Target, Medal } from 'lucide-react'

export function AchievementsTab() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 업적 카테고리
  const categories = [
    { id: 'all', name: '전체', icon: Trophy },
    { id: 'combat', name: '전투', icon: Target },
    { id: 'growth', name: '성장', icon: Star },
    { id: 'social', name: '소셜', icon: Medal }
  ]

  // 업적 데이터
  const achievements = [
    {
      id: 1,
      category: 'growth',
      name: '첫 걸음',
      description: '레벨 5 달성',
      progress: 5,
      maxProgress: 5,
      completed: true,
      reward: { exp: 100, gold: 50 },
      icon: '👣'
    },
    {
      id: 2,
      category: 'growth',
      name: '성장의 길',
      description: '레벨 10 달성',
      progress: 7,
      maxProgress: 10,
      completed: false,
      reward: { exp: 200, gold: 100 },
      icon: '🌱'
    },
    {
      id: 3,
      category: 'combat',
      name: '전투의 시작',
      description: '첫 전투 승리',
      progress: 1,
      maxProgress: 1,
      completed: true,
      reward: { exp: 50, gold: 30 },
      icon: '⚔️'
    },
    {
      id: 4,
      category: 'combat',
      name: '백전백승',
      description: '100회 전투 승리',
      progress: 45,
      maxProgress: 100,
      completed: false,
      reward: { exp: 500, gold: 300 },
      icon: '🏆'
    },
    {
      id: 5,
      category: 'social',
      name: '인기인',
      description: '친구 10명 만들기',
      progress: 3,
      maxProgress: 10,
      completed: false,
      reward: { exp: 150, gold: 100 },
      icon: '👥'
    },
    {
      id: 6,
      category: 'growth',
      name: '꾸준함의 힘',
      description: '7일 연속 접속',
      progress: 7,
      maxProgress: 7,
      completed: true,
      reward: { exp: 200, gold: 150 },
      icon: '🔥'
    }
  ]

  // 필터링된 업적
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  // 전체 진행도 계산
  const totalCompleted = achievements.filter(a => a.completed).length
  const totalAchievements = achievements.length
  const completionRate = (totalCompleted / totalAchievements) * 100

  // 카테고리별 통계
  const categoryStats = categories.slice(1).map(cat => {
    const catAchievements = achievements.filter(a => a.category === cat.id)
    const completed = catAchievements.filter(a => a.completed).length
    return {
      ...cat,
      completed,
      total: catAchievements.length,
      percentage: catAchievements.length > 0 ? (completed / catAchievements.length) * 100 : 0
    }
  })

  return (
    <div className="space-y-3">
      {/* 업적 개요 - 패딩과 간격 대폭 축소 */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            업적
          </h2>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-600">{totalCompleted}</div>
            <div className="text-xs text-gray-600">완료한 업적</div>
          </div>
        </div>

        <Progress value={completionRate} className="h-2 mb-2" />
        
        {/* 카테고리별 통계 - 크기 축소 */}
        <div className="grid grid-cols-3 gap-2">
          {categoryStats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.id} className="text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                <div className="text-xs font-medium">{stat.name}</div>
                <div className="text-[10px] text-gray-600">
                  {stat.completed}/{stat.total} ({stat.percentage.toFixed(0)}%)
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 카테고리 필터 - 크기 축소 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(category => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {category.name}
            </button>
          )
        })}
      </div>

      {/* 업적 목록 - 간격과 패딩 축소 */}
      <div className="space-y-2">
        {filteredAchievements.map(achievement => (
          <Card 
            key={achievement.id}
            className={`p-2.5 transition-all ${
              achievement.completed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200' 
                : ''
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* 아이콘 */}
              <div className="text-2xl">{achievement.icon}</div>
              
              {/* 내용 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">{achievement.name}</h3>
                  {achievement.completed && (
                    <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5">완료</Badge>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mb-1.5">{achievement.description}</p>
                
                {/* 진행도 */}
                <div className="mb-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span>진행도</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.maxProgress) * 100} 
                    className="h-1.5"
                  />
                </div>
                
                {/* 보상 */}
                <div className="flex gap-3 text-[10px]">
                  <span className="text-purple-600">+{achievement.reward.exp} EXP</span>
                  <span className="text-yellow-600">+{achievement.reward.gold} Gold</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}