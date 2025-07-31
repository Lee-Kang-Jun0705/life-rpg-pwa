'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { dbHelpers } from '@/lib/database/client'
import type { UserProfile, Stat } from '@/lib/database/types'
import { calculateCharacterLevel, getUniqueStats, debugStats } from '@/lib/utils/level-calculator'
import { 
  Sword, Shield, Heart, Zap, Star, TrendingUp,
  Calendar, Scroll, ShoppingBag, Sparkles,
  BookOpen, Trophy, Crown
} from 'lucide-react'

// 탭 컴포넌트들
import { SimpleDungeonTab } from '@/components/tabs/SimpleDungeonTab'
import { QuestTab } from '@/components/tabs/QuestTab'

// 간단한 캐릭터 정보 컴포넌트
function CharacterInfo() {
  const userId = GAME_CONFIG.DEFAULT_USER_ID
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [totalLevel, setTotalLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadProfile()
  }, [])
  
  // 프로필 변경 감지
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile()
    }
    
    window.addEventListener('profile-updated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])
  
  const loadProfile = async () => {
    
    try {
      const [userProfile, stats] = await Promise.all([
        dbHelpers.getProfile(userId),
        dbHelpers.getStats(userId)
      ])
      
      if (userProfile) {
        setProfile(userProfile)
      }
      
      // 중앙화된 레벨 계산 함수 사용
      if (stats && stats.length > 0) {
        const characterLevel = calculateCharacterLevel(stats)
        
        // 디버깅 정보 출력
        debugStats(stats, 'AdventurePage CharacterInfo')
        
        setTotalLevel(characterLevel)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 mb-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded w-24 mb-2" />
            <div className="h-4 bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl">
          ⚔️
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{profile?.name || '모험가'}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Lv.{totalLevel}</span>
            <span>•</span>
            <span>전투력 {totalLevel * 100}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 탭 메뉴 컴포넌트
function TabMenu({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'quest', label: '퀘스트', icon: Scroll, color: 'from-green-500 to-emerald-500' },
    { id: 'dungeon', label: '탐험', icon: Sword, color: 'from-purple-500 to-pink-500' },
    { id: 'daily', label: '일일', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: 'shop', label: '상점', icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
    { id: 'equipment', label: '장비', icon: Shield, color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="grid grid-cols-5 gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg
              transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-lg scale-105'
                  : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// 임시 탭 컴포넌트
function ComingSoonTab({ title }: { title: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-8 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">준비 중입니다</p>
    </div>
  )
}

export default function AdventurePage() {
  const [activeTab, setActiveTab] = useState('quest')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            모험 & 성장
          </h1>
          <p className="text-sm text-gray-400">당신의 영웅적인 여정이 시작됩니다</p>
        </motion.div>

        {/* 캐릭터 정보 */}
        <CharacterInfo />

        {/* 탭 메뉴 */}
        <TabMenu activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 컨텐츠 */}
        <div className="min-h-[400px]">
          {activeTab === 'quest' && <QuestTab />}
          {activeTab === 'dungeon' && <SimpleDungeonTab />}
          {activeTab === 'daily' && <ComingSoonTab title="일일 미션" />}
          {activeTab === 'shop' && <ComingSoonTab title="상점" />}
          {activeTab === 'equipment' && <ComingSoonTab title="장비" />}
        </div>
      </div>
    </div>
  )
}