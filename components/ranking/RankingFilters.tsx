'use client'

import React from 'react'
import type { RankingCategory, RankingPeriod, RankingFilter } from '@/lib/types/ranking'
import { RANKING_CATEGORIES } from '@/lib/ranking/ranking-data'
import { motion } from 'framer-motion'
import { Filter, Search, Users, TrendingUp } from 'lucide-react'

interface RankingFiltersProps {
  filter: RankingFilter
  onFilterChange: (filter: Partial<RankingFilter>) => void
  onSearch?: (query: string) => void
}

const PERIODS = [
  { id: 'weekly', name: '주간', icon: '📅' },
  { id: 'monthly', name: '월간', icon: '🗓️' },
  { id: 'all_time', name: '전체', icon: '🏆' }
] as const

export function RankingFilters({ filter, onFilterChange, onSearch }: RankingFiltersProps) {
  return (
    <div className="space-y-4">
      {/* 검색 */}
      {onSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="사용자 이름 검색..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </motion.div>
      )}

      {/* 기간 선택 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">기간</span>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <button
              key={period.id}
              onClick={() => onFilterChange({ period: period.id as RankingPeriod })}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${filter.period === period.id
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
              `}
            >
              <span>{period.icon}</span>
              <span>{period.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 카테고리 선택 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">카테고리</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(RANKING_CATEGORIES).map(([key, categoryInfo]) => (
            <button
              key={key}
              onClick={() => onFilterChange({ category: key as RankingCategory })}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg text-sm transition-all border
                ${filter.category === key
              ? 'bg-purple-500 text-white border-purple-500 shadow-lg scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }
              `}
            >
              <span className="text-lg">{categoryInfo.icon}</span>
              <span className="font-medium text-xs text-center leading-tight">
                {categoryInfo.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 길드 필터 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">길드</span>
        </div>
        <select
          value={filter.guild || ''}
          onChange={(e) => onFilterChange({ guild: e.target.value || undefined })}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">전체 길드</option>
          <option value="발할라">발할라</option>
          <option value="마법사탑">마법사탑</option>
          <option value="그림자단">그림자단</option>
          <option value="빛의수호자">빛의수호자</option>
          <option value="엘프연합">엘프연합</option>
          <option value="숲의수호자">숲의수호자</option>
          <option value="전사부족">전사부족</option>
          <option value="어둠의군단">어둠의군단</option>
          <option value="무림맹">무림맹</option>
          <option value="정령계약자">정령계약자</option>
        </select>
      </motion.div>

      {/* 레벨 범위 필터 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">최소 레벨</label>
          <input
            type="number"
            min="1"
            max="200"
            value={filter.level?.min || ''}
            onChange={(e) => {
              const min = parseInt(e.target.value) || undefined
              onFilterChange({
                level: min ? {
                  min,
                  max: filter.level?.max || 200
                } : undefined
              })
            }}
            placeholder="1"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">최대 레벨</label>
          <input
            type="number"
            min="1"
            max="200"
            value={filter.level?.max || ''}
            onChange={(e) => {
              const max = parseInt(e.target.value) || undefined
              onFilterChange({
                level: max ? {
                  min: filter.level?.min || 1,
                  max
                } : undefined
              })
            }}
            placeholder="200"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* 현재 필터 표시 */}
      {(filter.guild || filter.level) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          {filter.guild && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
              <Users className="w-3 h-3" />
              {filter.guild}
              <button
                onClick={() => onFilterChange({ guild: undefined })}
                className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
          {filter.level && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
              Lv.{filter.level.min}-{filter.level.max}
              <button
                onClick={() => onFilterChange({ level: undefined })}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
        </motion.div>
      )}
    </div>
  )
}
