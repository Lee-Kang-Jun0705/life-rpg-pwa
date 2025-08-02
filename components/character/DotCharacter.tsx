import React from 'react'
import { CharacterAppearance } from '@/lib/character/types'
import { cn } from '@/lib/utils'

interface DotCharacterProps {
  appearance: CharacterAppearance
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function DotCharacter({ appearance, size = 'medium', className }: DotCharacterProps) {
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-24 h-24 text-4xl',
    large: 'w-32 h-32 text-6xl'
  }

  if (appearance.style === 'emoji') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: appearance.color }}
      >
        <span className="select-none">😊</span>
      </div>
    )
  }

  // Pixel art style
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        sizeClasses[size],
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-3/4 h-3/4 rounded-lg"
          style={{ backgroundColor: appearance.color }}
        >
          {/* Simple pixel character */}
          <div className="relative w-full h-full">
            {/* Head */}
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1/3 h-1/3 bg-yellow-300 rounded-sm" />
            {/* Body */}
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-1/2 h-1/3 bg-blue-500 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
