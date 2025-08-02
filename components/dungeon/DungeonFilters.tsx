'use client'

import React from 'react'
import type { DungeonFilter, DungeonType, DungeonDifficulty, DungeonStatus } from '@/lib/types/dungeon'
import { DUNGEON_TYPE_INFO, DIFFICULTY_INFO } from '@/lib/dungeon/dungeon-data'
import { motion } from 'framer-motion'
import { Filter, CheckCircle, Clock, Lock, Zap, type LucideIcon } from 'lucide-react'

interface DungeonFiltersProps {
  filter: DungeonFilter
  onFilterChange: (filter: Partial<DungeonFilter>) => void
}

const STATUS_INFO: Record<string, { name: string; icon: LucideIcon; color: string }> = {
  available: { name: '입장 가능', icon: Zap, color: 'green' },
  in_progress: { name: '진행 중', icon: Clock, color: 'orange' },
  completed: { name: '완료', icon: CheckCircle, color: 'blue' },
  locked: { name: '잠금', icon: Lock, color: 'gray' },
  cleared: { name: '클리어', icon: CheckCircle, color: 'purple' },
  failed: { name: '실패', icon: Lock, color: 'red' }
}

export function DungeonFilters({ filter, onFilterChange }: DungeonFiltersProps) {
  return (
    <div className="space-y-6">
      {/* 던전 타입 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">던전 타입</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => onFilterChange({ type: undefined })}
            className={`
              flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
              ${!filter.type
      ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
    }
            `}
          >
            <span>전체</span>
          </button>
          {Object.entries(DUNGEON_TYPE_INFO).map(([key, typeInfo]) => (
            <button
              key={key}
              onClick={() => onFilterChange({ type: key as DungeonType })}
              className={`
                flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
                ${filter.type === key
              ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }
              `}
            >
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 난이도 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">난이도</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => onFilterChange({ difficulty: undefined })}
            className={`
              flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
              ${!filter.difficulty
      ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
    }
            `}
          >
            <span>전체</span>
          </button>
          {Object.entries(DIFFICULTY_INFO).map(([key, diffInfo]) => (
            <button
              key={key}
              onClick={() => onFilterChange({ difficulty: key as DungeonDifficulty })}
              className={`
                flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
                ${filter.difficulty === key
              ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }
              `}
            >
              <span>{diffInfo.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* 상태 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium">상태</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => onFilterChange({ status: undefined })}
            className={`
              flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
              ${!filter.status
      ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
    }
            `}
          >
            <span>전체</span>
          </button>
          {Object.entries(STATUS_INFO).map(([key, statusInfo]) => {
            const IconComponent = statusInfo.icon
            return (
              <button
                key={key}
                onClick={() => onFilterChange({ status: key as DungeonStatus })}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border
                  ${filter.status === key
                ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }
                `}
              >
                <IconComponent className="w-4 h-4" />
                <span>{statusInfo.name}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 입장 가능 여부 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.available || false}
              onChange={(e) => onFilterChange({ available: e.target.checked || undefined })}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium">현재 입장 가능한 던전만 표시</span>
          </label>
        </div>
      </motion.div>

      {/* 활성 필터 표시 */}
      {(filter.type || filter.difficulty || filter.status || filter.available) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">활성 필터:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filter.type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                {DUNGEON_TYPE_INFO[filter.type].icon} {DUNGEON_TYPE_INFO[filter.type].name}
                <button
                  onClick={() => onFilterChange({ type: undefined })}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {filter.difficulty && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                {DIFFICULTY_INFO[filter.difficulty].name}
                <button
                  onClick={() => onFilterChange({ difficulty: undefined })}
                  className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {filter.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                {STATUS_INFO[filter.status].name}
                <button
                  onClick={() => onFilterChange({ status: undefined })}
                  className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
            {filter.available && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                <Zap className="w-3 h-3" />
                입장 가능
                <button
                  onClick={() => onFilterChange({ available: undefined })}
                  className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
