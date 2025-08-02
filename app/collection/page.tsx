'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CollectionService } from '@/lib/collection/collection-service'
import { GAME_CONFIG } from '@/lib/types/dashboard'
import { MONSTER_DATABASE as MONSTERS } from '@/lib/battle/monster-database'
import { MONSTER_LORE } from '@/lib/collection/collection-data'
import type { CollectionState, CollectionFilter, CollectionSortOption } from '@/lib/types/collection'
import { MonsterCard } from '@/components/collection/MonsterCard'
import { CollectionStats } from '@/components/collection/CollectionStats'
import { CollectionRewards } from '@/components/collection/CollectionRewards'
import { CollectionAchievements } from '@/components/collection/CollectionAchievements'
import { motion } from 'framer-motion'
import { Book, Search, Filter, Trophy, Gift, Sparkles } from 'lucide-react'

export default function CollectionPage() {
  const [collectionState, setCollectionState] = useState<CollectionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'monsters' | 'rewards' | 'achievements'>('monsters')

  // 필터 및 정렬
  const [filter, setFilter] = useState<CollectionFilter>({})
  const [sortBy, setSortBy] = useState<CollectionSortOption>('id')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const collectionService = CollectionService.getInstance()

  const loadCollectionData = useCallback(async() => {
    try {
      setIsLoading(true)
      const state = await collectionService.initializeCollection(GAME_CONFIG.DEFAULT_USER_ID)

      // 임시로 일부 몬스터 발견/처치 상태 설정
      if (state.entries['slime']) {
        state.entries['slime'].isDiscovered = true
        state.entries['slime'].isDefeated = true
        state.entries['slime'].killCount = 15
      }
      if (state.entries['goblin']) {
        state.entries['goblin'].isDiscovered = true
        state.entries['goblin'].killCount = 5
      }
      if (state.entries['wolf']) {
        state.entries['wolf'].isDiscovered = true
      }

      setCollectionState(state)
    } catch (error) {
      console.error('Failed to load collection data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [collectionService])

  // 초기 데이터 로드
  useEffect(() => {
    loadCollectionData()
  }, [loadCollectionData])

  if (isLoading || !collectionState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  // 통계 계산
  const stats = collectionService.calculateStats(collectionState)

  // 필터링 및 정렬
  const filteredMonsters = collectionService.filterAndSortMonsters(
    collectionState.entries,
    { ...filter, searchQuery },
    sortBy
  )

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Book className="w-8 h-8 text-purple-500" />
            몬스터 도감
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            모험 중 만난 몬스터들의 정보를 확인하세요
          </p>
        </div>

        {/* 통계 */}
        <CollectionStats stats={stats} />

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('monsters')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'monsters'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Book className="w-4 h-4" />
            몬스터 ({stats.discoveredMonsters}/{stats.totalMonsters})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Gift className="w-4 h-4" />
            카테고리 보상
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'achievements'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            업적
          </button>
        </div>

        {/* 몬스터 탭 */}
        {activeTab === 'monsters' && (
          <>
            {/* 검색 및 필터 */}
            <div className="mb-6 space-y-4">
              {/* 검색바 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="몬스터 이름으로 검색..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* 필터 및 정렬 옵션 */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    필터
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as CollectionSortOption)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <option value="id">기본순</option>
                    <option value="name">이름순</option>
                    <option value="level">레벨순</option>
                    <option value="kills">처치순</option>
                    <option value="discovered">발견순</option>
                  </select>
                </div>

                <div className="text-sm text-gray-500">
                  {filteredMonsters.length}개 표시
                </div>
              </div>

              {/* 필터 패널 */}
              {showFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">상태</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filter.discovered === true}
                            onChange={(e) => setFilter({
                              ...filter,
                              discovered: e.target.checked ? true : undefined
                            })}
                          />
                          발견한 몬스터만
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filter.defeated === true}
                            onChange={(e) => setFilter({
                              ...filter,
                              defeated: e.target.checked ? true : undefined
                            })}
                          />
                          처치한 몬스터만
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">카테고리</h4>
                      <div className="space-y-2">
                        {collectionState.categories.map(category => (
                          <label key={category.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={filter.category?.includes(category.id) || false}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...(filter.category || []), category.id]
                                  : filter.category?.filter(c => c !== category.id) || []
                                setFilter({
                                  ...filter,
                                  category: newCategories.length > 0 ? newCategories : undefined
                                })
                              }}
                            />
                            {category.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setFilter({})}
                    className="text-sm text-purple-500 hover:text-purple-600"
                  >
                    필터 초기화
                  </button>
                </motion.div>
              )}
            </div>

            {/* 몬스터 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMonsters.map((entry, index) => {
                const monster = MONSTERS[entry.monsterId]
                const lore = MONSTER_LORE[entry.monsterId]

                if (!monster) {
                  return null
                }

                return (
                  <motion.div
                    key={entry.monsterId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <MonsterCard
                      monster={monster}
                      entry={entry}
                      lore={lore}
                    />
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* 보상 탭 */}
        {activeTab === 'rewards' && (
          <CollectionRewards
            categories={collectionState.categories}
            entries={collectionState.entries}
          />
        )}

        {/* 업적 탭 */}
        {activeTab === 'achievements' && (
          <CollectionAchievements
            achievements={collectionState.achievements}
          />
        )}
      </div>
    </div>
  )
}
