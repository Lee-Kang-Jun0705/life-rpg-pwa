'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GAME_CONFIG } from '@/lib/config/game-config'
import { dbHelpers } from '@/lib/database/client'
import { statFormulas, calculateRequiredExperience } from '@/lib/utils/stat-calculator'
import { calculateCharacterLevel } from '@/lib/utils/level-calculator'
// 임시 Character 타입 정의
interface Character {
  id: number
  userId: string
  name: string
  class: string
  level: number
  experience: number
  experienceToNext: number
  energy: number
  avatar: string
  stats?: {
    attack: number
    defense: number
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    speed: number
    critical: number
  }
}
import { 
  Sword, Shield, Heart, Zap, Star, TrendingUp,
  Calendar, Scroll, ShoppingBag, Sparkles,
  BookOpen, Trophy, Crown
} from 'lucide-react'

interface HeroSectionProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function HeroSection({ activeTab = 'quest', onTabChange }: HeroSectionProps) {
  const userId = GAME_CONFIG.DEFAULT_USER_ID
  const router = useRouter()
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCharacterData()
  }, [])

  const loadCharacterData = async () => {
    
    try {
      // 실제 프로필 데이터와 스탯 로드
      const [profile, stats] = await Promise.all([
        dbHelpers.getProfile(userId),
        dbHelpers.getStats(userId)
      ])
      
      if (profile) {
        // 중앙화된 레벨 계산 함수 사용
        const characterLevel = stats && stats.length > 0 
          ? calculateCharacterLevel(stats) 
          : 0
        
        const character: Character = {
          id: 1,
          userId,
          name: profile.name || '용감한 모험가',
          class: '전사',
          level: characterLevel,
          experience: profile.experience || 0,
          experienceToNext: calculateRequiredExperience(characterLevel),
          energy: 85,
          avatar: '⚔️',
          stats: {
            attack: statFormulas.attack(characterLevel),
            defense: statFormulas.defense(characterLevel),
            hp: statFormulas.hp(characterLevel),
            maxHp: statFormulas.hp(characterLevel),
            mp: statFormulas.mp(characterLevel),
            maxMp: statFormulas.mp(characterLevel),
            speed: statFormulas.speed(characterLevel),
            critical: Math.floor(statFormulas.critRate(characterLevel) * 100)
          }
        }
        setCharacter(character)
      }
    } catch (error) {
      console.error('Failed to load character:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 탭 정의
  const tabs = [
    { id: 'daily', label: '일일', icon: Calendar, color: 'from-orange-500 to-red-500' },
    { id: 'quest', label: '퀘스트', icon: Scroll, color: 'from-green-500 to-emerald-500' },
    { id: 'dungeon', label: '탐험', icon: Sword, color: 'from-purple-500 to-pink-500' },
    { id: 'shop', label: '상점', icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
    { id: 'equipment', label: '장비', icon: Shield, color: 'from-amber-500 to-orange-500' },
    { id: 'skills', label: '스킬', icon: Sparkles, color: 'from-pink-500 to-purple-500' },
    { id: 'collection', label: '도감', icon: BookOpen, color: 'from-teal-500 to-green-500' },
    { id: 'achievements', label: '업적', icon: Trophy, color: 'from-yellow-500 to-amber-500' },
    { id: 'records', label: '기록', icon: Crown, color: 'from-indigo-500 to-purple-500' }
  ]

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-700/50 rounded-lg mb-3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-700/50 rounded-lg"></div>
            <div className="h-32 bg-gray-700/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!character) {
    return null
  }

  const expPercentage = (character.experience / character.experienceToNext) * 100

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 rounded-xl p-3 md:p-4 mb-4"
    >
      {/* 캐릭터 정보 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5"
        >
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl">
            {character.avatar || '🧙‍♂️'}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-1.5 py-0.5 text-xs font-bold text-white shadow-lg">
            Lv.{character.level}
          </div>
        </motion.div>

        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">{character.name || '모험가'}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{character.class || '초보자'}</span>
            <div className="flex-1 max-w-xs">
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${expPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {character.experience}/{character.experienceToNext}
            </span>
          </div>
        </div>
      </div>

      {/* 하단 영역: 스탯과 탭 메뉴 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* 왼쪽: 스탯 정보 - 2열로 배치 */}
        <div className="bg-gray-900/50 rounded-lg p-3 md:p-4">
          <div className="grid grid-cols-2 gap-x-4 md:gap-x-5">
            {/* 왼쪽 열 */}
            <div className="space-y-2 md:space-y-2.5">
              <StatRow 
                icon={<Sword className="w-5 h-5 md:w-6 md:h-6" />}
                label="공격력"
                value={character.stats?.attack || 10}
                color="text-red-400"
                compact
              />
              <StatRow 
                icon={<Shield className="w-5 h-5 md:w-6 md:h-6" />}
                label="방어력"
                value={character.stats?.defense || 10}
                color="text-blue-400"
                compact
              />
              <StatRow 
                icon={<Heart className="w-5 h-5 md:w-6 md:h-6" />}
                label="체력"
                value={character.stats?.hp || 100}
                maxValue={character.stats?.maxHp || 100}
                color="text-green-400"
                compact
              />
            </div>
            
            {/* 오른쪽 열 */}
            <div className="space-y-2 md:space-y-2.5">
              <StatRow 
                icon={<Zap className="w-5 h-5 md:w-6 md:h-6" />}
                label="마나"
                value={character.stats?.mp || 50}
                maxValue={character.stats?.maxMp || 50}
                color="text-purple-400"
                compact
              />
              <StatRow 
                icon={<Star className="w-5 h-5 md:w-6 md:h-6" />}
                label="에너지"
                value={character.energy || 100}
                maxValue={100}
                color="text-yellow-400"
                compact
              />
              <StatRow 
                icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                label="전투력"
                value={calculatePower(character)}
                color="text-indigo-400"
                compact
              />
            </div>
          </div>
        </div>

        {/* 오른쪽: 탭 메뉴 */}
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 content-start">
          {tabs.map((tab) => {
            const Icon = tab.icon
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-row items-center justify-center gap-1.5 py-2 px-2 md:py-2.5 md:px-3 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-lg'
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm font-medium">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

interface StatRowProps {
  icon: React.ReactNode
  label: string
  value: number
  maxValue?: number
  color: string
  compact?: boolean
}

function StatRow({ icon, label, value, maxValue, color, compact }: StatRowProps) {
  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'justify-between'} py-1 md:py-1.5`}>
      <div className="flex items-center gap-2 md:gap-2.5">
        <div className={`${color} ${compact ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>{icon}</div>
        <span className={`${compact ? 'text-xs md:text-sm' : 'text-xs md:text-sm'} text-gray-400 font-medium`}>{label}</span>
      </div>
      <div className={`${compact ? 'text-sm md:text-base' : 'text-sm md:text-lg'} font-bold text-white ${compact ? 'ml-auto' : ''}`}>
        {value}
        {maxValue && (
          <span className={`${compact ? 'text-xs md:text-sm' : 'text-xs md:text-sm'} text-gray-400 font-normal`}> / {maxValue}</span>
        )}
      </div>
    </div>
  )
}

function calculatePower(character: Character): number {
  const stats = character.stats
  if (!stats) return 0
  
  return Math.floor(
    (stats.attack || 0) * 2 +
    (stats.defense || 0) * 1.5 +
    ((stats.maxHp || 100) / 10) +
    ((stats.maxMp || 50) / 5) +
    character.level * 10
  )
}