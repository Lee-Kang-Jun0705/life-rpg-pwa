'use client'

import React from 'react'
import { DifficultyLevel } from '@/lib/dungeon/types'
import { 
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Activity,
  type LucideProps
} from 'lucide-react'

interface DungeonDifficultyBadgeProps {
  difficulty: DifficultyLevel
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const difficultyConfig: Record<DifficultyLevel, {
  label: string
  icon: React.ComponentType<LucideProps>
  gradient: string
  stars: number
}> = {
  easy: {
    label: '쉬움',
    icon: Star,
    gradient: 'from-green-400 to-green-600',
    stars: 1
  },
  normal: {
    label: '보통',
    icon: Zap,
    gradient: 'from-blue-400 to-blue-600',
    stars: 2
  },
  hard: {
    label: '어려움',
    icon: Flame,
    gradient: 'from-orange-400 to-orange-600',
    stars: 3
  },
  expert: {
    label: '전문가',
    icon: Crown,
    gradient: 'from-red-400 to-red-600',
    stars: 4
  },
  legendary: {
    label: '전설',
    icon: Sparkles,
    gradient: 'from-purple-400 to-purple-600',
    stars: 5
  },
  dynamic: {
    label: '동적',
    icon: Activity,
    gradient: 'from-indigo-400 to-indigo-600',
    stars: 0
  }
}

const sizeConfig = {
  sm: {
    container: 'px-2 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3',
    star: 'w-3 h-3'
  },
  md: {
    container: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4',
    star: 'w-4 h-4'
  },
  lg: {
    container: 'px-4 py-2',
    text: 'text-base',
    icon: 'w-5 h-5',
    star: 'w-5 h-5'
  }
}

export function DungeonDifficultyBadge({ 
  difficulty, 
  showLabel = true,
  size = 'md' 
}: DungeonDifficultyBadgeProps) {
  const config = difficultyConfig[difficulty]
  const sizeClasses = sizeConfig[size]
  const Icon = config.icon

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full
      bg-gradient-to-r ${config.gradient}
      ${sizeClasses.container}
    `}>
      <Icon className={`${sizeClasses.icon} text-white`} />
      
      {showLabel && (
        <span className={`${sizeClasses.text} font-medium text-white`}>
          {config.label}
        </span>
      )}
      
      {config.stars > 0 && (
        <div className="flex items-center gap-0.5 ml-1">
          {Array.from({ length: config.stars }).map((_, i) => (
            <Star 
              key={i} 
              className={`${sizeClasses.star} text-white fill-white`} 
            />
          ))}
        </div>
      )}
    </div>
  )
}