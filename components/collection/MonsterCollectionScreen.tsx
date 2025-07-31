'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Search, Filter, Grid3X3, List, Star, Lock, Trophy, Sparkles, ChevronRight, Skull, Eye, Target } from 'lucide-react'
import { collectionService } from '@/lib/services/collection.service'
import { MONSTER_TEMPLATES, getMonsterData } from '@/lib/data/monsters'
import type { CollectionFilter, CollectionSortOption, CollectionCategory, MonsterCollectionEntry } from '@/lib/types/collection'
import type { MonsterData } from '@/lib/data/monsters'
import { useToast } from '@/components/ui/Toast'

export function MonsterCollectionScreen() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyDiscovered, setShowOnlyDiscovered] = useState(false)
  const [selectedMonster, setSelectedMonster] = useState<MonsterData | null>(null)
  const [sortBy, setSortBy] = useState<CollectionSortOption>('name')
  const [ascending, setAscending] = useState(true)
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReturnType<typeof collectionService.getCollectionStats> | null>(null)
  const [categories, setCategories] = useState<CollectionCategory[]>([])
  const [monsters, setMonsters] = useState<Array<{ monster: MonsterData; entry?: MonsterCollectionEntry }>>([])
  const [achievements, setAchievements] = useState<ReturnType<typeof collectionService.getAchievements>>([])

  useEffect(() => {
    loadCollectionData()
  }, [])

  useEffect(() => {
    updateFilteredMonsters()
  }, [selectedCategory, searchQuery, showOnlyDiscovered, sortBy, ascending])

  const loadCollectionData = async () => {
    try {
      await collectionService.initialize()
      
      setStats(collectionService.getCollectionStats())
      setCategories(collectionService.getCategories())
      setAchievements(collectionService.getAchievements())
      updateFilteredMonsters()
    } catch (error) {
      console.error('Failed to load collection data:', error)
      toast({ title: '컬렉션 데이터를 불러오는데 실패했습니다.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updateFilteredMonsters = () => {
    const filter: CollectionFilter = {
      discovered: showOnlyDiscovered ? true : undefined,
      searchQuery
    }
    
    if (selectedCategory !== 'all') {
      filter.category = [selectedCategory]
    }
    
    setMonsters(collectionService.getFilteredMonsters(filter, sortBy, ascending))
  }

  const handleRewardClaim = async (categoryId: string, rewardId: string) => {
    const success = await collectionService.claimReward(categoryId, rewardId)
    if (success) {
      loadCollectionData()
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      normal: '⚪',
      beast: '🐾',
      undead: '💀',
      elemental: '🔮',
      humanoid: '👤',
      dragon: '🐲',
      demon: '👹',
      boss: '👑'
    }
    return icons[type] || '❓'
  }

  const getElementIcon = (element?: string) => {
    const icons: Record<string, string> = {
      fire: '🔥',
      water: '💧',
      earth: '🌍',
      air: '💨',
      light: '✨',
      dark: '🌑',
      ice: '❄️',
      thunder: '⚡'
    }
    return icons[element || ''] || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* 헤더 - 대폭 축소 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Book className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">몬스터 도감</h1>
            <p className="text-xs text-gray-900 font-semibold">조우한 몬스터들을 확인하고 보상을 획득하세요</p>
          </div>
          
          {/* 전체 진행도 */}
          {stats && (
            <div className="text-right">
              <div className="text-base font-bold text-white">
                {stats.defeatedMonsters} / {stats.totalMonsters}
              </div>
              <div className="text-[10px] text-gray-400">
                전체 수집률 {Math.round(stats.completionRate)}%
              </div>
            </div>
          )}
        </div>

        {/* 통계 카드 - 크기 대폭 축소 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-lg p-2"
            >
              <Eye className="w-4 h-4 text-blue-400 mb-1" />
              <div className="text-base font-bold text-white">{stats.discoveredMonsters}</div>
              <div className="text-[10px] text-blue-300">발견한 몬스터</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-600/20 to-green-500/20 rounded-lg p-2"
            >
              <Target className="w-4 h-4 text-green-400 mb-1" />
              <div className="text-base font-bold text-white">{stats.defeatedMonsters}</div>
              <div className="text-[10px] text-green-300">처치한 몬스터</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-red-600/20 to-red-500/20 rounded-lg p-2"
            >
              <Skull className="w-4 h-4 text-red-400 mb-1" />
              <div className="text-base font-bold text-white">{stats.totalKills}</div>
              <div className="text-[10px] text-red-300">총 처치 수</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-600/20 to-purple-500/20 rounded-lg p-2"
            >
              <Trophy className="w-4 h-4 text-purple-400 mb-1" />
              <div className="text-base font-bold text-white">
                {achievements.filter(a => a.isUnlocked).length}
              </div>
              <div className="text-[10px] text-purple-300">달성한 업적</div>
            </motion.div>
          </div>
        )}

        {/* 카테고리 탭 - 크기 축소 */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            전체
          </button>
          {categories.map(category => {
            const progress = collectionService.getCategoryProgress(category.id)
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.name}
                <span className="text-[10px]">
                  ({progress.defeated}/{category.monsterIds.length})
                </span>
              </button>
            )
          })}
        </div>

        {/* 필터 & 정렬 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="몬스터 검색..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyDiscovered}
              onChange={(e) => setShowOnlyDiscovered(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-gray-300">발견한 몬스터만</span>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CollectionSortOption)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="name">이름순</option>
            <option value="level">레벨순</option>
            <option value="kills">처치수순</option>
            <option value="discovered">발견순</option>
          </select>

          <button
            onClick={() => setAscending(!ascending)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
          >
            {ascending ? '오름차순' : '내림차순'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 몬스터 목록 */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {monsters.map(({ monster, entry }) => (
              <motion.button
                key={monster.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMonster(monster)}
                className={`relative bg-gray-800/50 rounded-xl p-4 transition-all ${
                  entry?.isDiscovered 
                    ? 'hover:bg-gray-700/50' 
                    : 'opacity-50 grayscale'
                }`}
              >
                {/* 처치 뱃지 */}
                {entry?.isDefeated && (
                  <div className="absolute top-2 right-2 bg-green-500/20 p-1 rounded">
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                )}

                {/* 몬스터 아이콘 */}
                <div className="text-5xl mb-2">
                  {entry?.isDiscovered ? monster.icon : '❓'}
                </div>

                {/* 몬스터 정보 */}
                <h3 className="font-medium text-white">
                  {entry?.isDiscovered ? monster.name : '???'}
                </h3>
                <div className="text-sm text-gray-400">
                  Lv.{monster.level}
                </div>

                {/* 처치 수 */}
                {entry && entry.killCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    처치: {entry.killCount}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {monsters.map(({ monster, entry }) => (
              <motion.div
                key={monster.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedMonster(monster)}
                className={`flex items-center gap-4 bg-gray-800/50 rounded-lg p-4 cursor-pointer transition-all ${
                  entry?.isDiscovered 
                    ? 'hover:bg-gray-700/50' 
                    : 'opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl">
                  {entry?.isDiscovered ? monster.icon : '❓'}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {entry?.isDiscovered ? monster.name : '???'}
                  </h3>
                  <div className="text-sm text-gray-400">
                    Lv.{monster.level} • {getTypeIcon(monster.type)} {monster.type}
                    {monster.element && ` • ${getElementIcon(monster.element)}`}
                  </div>
                </div>

                <div className="text-right">
                  {entry?.isDefeated && (
                    <div className="text-green-400 text-sm mb-1">처치함</div>
                  )}
                  {entry && entry.killCount > 0 && (
                    <div className="text-xs text-gray-500">
                      처치: {entry.killCount}
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))}
          </div>
        )}

        {/* 몬스터 상세 정보 모달 */}
        <AnimatePresence>
          {selectedMonster && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedMonster(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl">{selectedMonster.icon}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedMonster.name}</h2>
                      <p className="text-gray-400">
                        Lv.{selectedMonster.level} • {getTypeIcon(selectedMonster.type)} {selectedMonster.type}
                        {selectedMonster.element && ` • ${getElementIcon(selectedMonster.element)}`}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6">{selectedMonster.description}</p>

                  {/* 스탯 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">체력</div>
                      <div className="text-xl font-bold text-white">{selectedMonster.hp}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">공격력</div>
                      <div className="text-xl font-bold text-white">{selectedMonster.attack}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">방어력</div>
                      <div className="text-xl font-bold text-white">{selectedMonster.defense}</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">속도</div>
                      <div className="text-xl font-bold text-white">{selectedMonster.speed}</div>
                    </div>
                  </div>

                  {/* 드롭 아이템 */}
                  {selectedMonster.drops && selectedMonster.drops.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">드롭 아이템</h3>
                      <div className="space-y-2">
                        {selectedMonster.drops.map((drop, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                            <span className="text-gray-300">{drop.itemId}</span>
                            <span className="text-sm text-gray-400">{Math.round(drop.dropRate * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedMonster(null)}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 카테고리 보상 */}
        {selectedCategory !== 'all' && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">카테고리 보상</h2>
            {categories
              .find(c => c.id === selectedCategory)
              ?.rewards.map(reward => {
                const progress = collectionService.getCategoryProgress(selectedCategory)
                const canClaim = !reward.isClaimed && progress.defeated >= reward.requiredCount
                
                return (
                  <motion.div
                    key={reward.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-gray-800/50 rounded-lg p-4 mb-3 ${
                      reward.isClaimed ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{reward.name}</h3>
                        <p className="text-sm text-gray-400">{reward.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          {reward.rewards.exp && (
                            <span className="text-purple-400">경험치 +{reward.rewards.exp}</span>
                          )}
                          {reward.rewards.gold && (
                            <span className="text-yellow-400">골드 +{reward.rewards.gold}</span>
                          )}
                          {reward.rewards.title && (
                            <span className="text-blue-400">칭호: {reward.rewards.title}</span>
                          )}
                        </div>
                      </div>
                      
                      {reward.isClaimed ? (
                        <div className="text-green-400">수령 완료</div>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleRewardClaim(selectedCategory, reward.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          수령하기
                        </button>
                      ) : (
                        <div className="text-gray-500">
                          {progress.defeated}/{reward.requiredCount}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
          </div>
        )}
      </motion.div>
    </div>
  )
}