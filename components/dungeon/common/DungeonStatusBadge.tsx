'use client'

import React from 'react'
import { DungeonStatus } from '@/lib/dungeon/types'
import { 
  Lock, 
  CheckCircle, 
  PlayCircle,
  XCircle,
  Clock,
  Star,
  type LucideProps
} from 'lucide-react'

interface DungeonStatusBadgeProps {
  status: DungeonStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<DungeonStatus, {
  label: string
  icon: React.ComponentType<LucideProps>
  className: string
}> = {
  locked: {
    label: '잠김',
    icon: Lock,
    className: 'bg-gray-500/20 text-gray-400 border-gray-600'
  },
  available: {
    label: '입장 가능',
    icon: PlayCircle,
    className: 'bg-green-500/20 text-green-400 border-green-600'
  },
  in_progress: {
    label: '진행 중',
    icon: Clock,
    className: 'bg-blue-500/20 text-blue-400 border-blue-600'
  },
  completed: {
    label: '완료',
    icon: CheckCircle,
    className: 'bg-purple-500/20 text-purple-400 border-purple-600'
  },
  cleared: {
    label: '클리어',
    icon: Star,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-600'
  },
  failed: {
    label: '실패',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-400 border-red-600'
  },
  abandoned: {
    label: '포기',
    icon: XCircle,
    className: 'bg-orange-500/20 text-orange-400 border-orange-600'
  }
}

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3'
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'w-5 h-5'
  }
}

export function DungeonStatusBadge({ status, size = 'md' }: DungeonStatusBadgeProps) {
  const config = statusConfig[status]
  const sizeClasses = sizeConfig[size]
  const Icon = config.icon

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full border
      ${config.className}
      ${sizeClasses.padding}
      ${sizeClasses.text}
    `}>
      <Icon className={sizeClasses.icon} />
      <span className="font-medium">{config.label}</span>
    </div>
  )
}