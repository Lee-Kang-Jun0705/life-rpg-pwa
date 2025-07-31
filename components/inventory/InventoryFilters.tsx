'use client'

import React from 'react'
import type { ItemFilter, ItemSortOption, ItemType, ItemRarity } from '@/lib/types/item-system'
import { 
  SortAsc, 
  SortDesc,
  Sword,
  Shield,
  Gem,
  FlaskConical,
  Package
} from 'lucide-react'

interface InventoryFiltersProps {
  filter: ItemFilter
  onFilterChange: (filter: ItemFilter) => void
  sortBy: ItemSortOption
  onSortByChange: (sortBy: ItemSortOption) => void
  sortAscending: boolean
  onSortAscendingChange: (ascending: boolean) => void
}

export function InventoryFilters({
  filter,
  onFilterChange,
  sortBy,
  onSortByChange,
  sortAscending,
  onSortAscendingChange
}: InventoryFiltersProps) {
  const itemTypes: Array<{ value: ItemType; label: string; icon: React.ReactNode }> = [
    { value: 'weapon', label: '무기', icon: <Sword className="w-4 h-4" /> },
    { value: 'armor', label: '방어구', icon: <Shield className="w-4 h-4" /> },
    { value: 'accessory', label: '액세서리', icon: <Gem className="w-4 h-4" /> },
    { value: 'consumable', label: '소비', icon: <FlaskConical className="w-4 h-4" /> },
    { value: 'material', label: '재료', icon: <Package className="w-4 h-4" /> }
  ]

  const rarities: Array<{ value: ItemRarity; label: string; color: string }> = [
    { value: 'common', label: '일반', color: 'text-gray-400' },
    { value: 'uncommon', label: '고급', color: 'text-green-400' },
    { value: 'rare', label: '희귀', color: 'text-blue-400' },
    { value: 'epic', label: '영웅', color: 'text-purple-400' },
    { value: 'legendary', label: '전설', color: 'text-orange-400' }
  ]

  const sortOptions: Array<{ value: ItemSortOption; label: string }> = [
    { value: 'name', label: '이름' },
    { value: 'level', label: '레벨' },
    { value: 'rarity', label: '희귀도' },
    { value: 'type', label: '타입' },
    { value: 'value', label: '가치' },
    { value: 'power', label: '전투력' },
    { value: 'obtainedAt', label: '획득 시간' }
  ]

  const toggleTypeFilter = (type: ItemType) => {
    const currentTypes = filter.type || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    
    onFilterChange({
      ...filter,
      type: newTypes.length === 0 ? undefined : newTypes
    })
  }

  const toggleRarityFilter = (rarity: ItemRarity) => {
    const currentRarities = filter.rarity || []
    const newRarities = currentRarities.includes(rarity)
      ? currentRarities.filter(r => r !== rarity)
      : [...currentRarities, rarity]
    
    onFilterChange({
      ...filter,
      rarity: newRarities.length === 0 ? undefined : newRarities
    })
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 아이템 타입 필터 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">아이템 타입</h3>
          <div className="flex flex-wrap gap-2">
            {itemTypes.map(({ value, label, icon }) => {
              const isActive = filter.type?.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleTypeFilter(value)}
                  className={`
                    px-3 py-2 rounded-lg flex items-center gap-2 transition-colors
                    ${isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }
                  `}
                  data-testid={`filter-type-${value}`}
                >
                  {icon}
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 희귀도 필터 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">희귀도</h3>
          <div className="flex flex-wrap gap-2">
            {rarities.map(({ value, label, color }) => {
              const isActive = filter.rarity?.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleRarityFilter(value)}
                  className={`
                    px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                    }
                  `}
                  data-testid={`filter-rarity-${value}`}
                >
                  <span className={isActive ? '' : color}>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 레벨 범위 필터 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">레벨 범위</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">최소</span>
              <input
                type="number"
                value={filter.minLevel || ''}
                onChange={(e) => onFilterChange({
                  ...filter,
                  minLevel: e.target.value ? Number(e.target.value) : undefined
                })}
                className="w-20 px-2 py-1 bg-gray-700 rounded text-sm"
                placeholder="1"
                min="1"
                data-testid="filter-min-level"
              />
            </div>
            <span className="text-gray-500">~</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">최대</span>
              <input
                type="number"
                value={filter.maxLevel || ''}
                onChange={(e) => onFilterChange({
                  ...filter,
                  maxLevel: e.target.value ? Number(e.target.value) : undefined
                })}
                className="w-20 px-2 py-1 bg-gray-700 rounded text-sm"
                placeholder="99"
                min="1"
                data-testid="filter-max-level"
              />
            </div>
          </div>
        </div>

        {/* 특수 필터 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">특수 필터</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onFilterChange({
                ...filter,
                hasSetBonus: filter.hasSetBonus === true ? undefined : true
              })}
              className={`
                px-3 py-2 rounded-lg transition-colors
                ${filter.hasSetBonus === true 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }
              `}
              data-testid="filter-set-bonus"
            >
              세트 아이템
            </button>
            <button
              onClick={() => onFilterChange({
                ...filter,
                hasSpecialEffect: filter.hasSpecialEffect === true ? undefined : true
              })}
              className={`
                px-3 py-2 rounded-lg transition-colors
                ${filter.hasSpecialEffect === true 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }
              `}
              data-testid="filter-special-effect"
            >
              특수 효과
            </button>
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-gray-400">정렬</h3>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as ItemSortOption)}
              className="px-3 py-2 bg-gray-700 rounded-lg text-sm"
              data-testid="sort-by"
            >
              {sortOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => onSortAscendingChange(!sortAscending)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              data-testid="sort-direction"
            >
              {sortAscending ? (
                <SortAsc className="w-5 h-5" />
              ) : (
                <SortDesc className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 필터 초기화 */}
          <button
            onClick={() => {
              onFilterChange({})
              onSortByChange('obtainedAt')
              onSortAscendingChange(false)
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            data-testid="reset-filters"
          >
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  )
}