import React from 'react'
import { ElementType, ELEMENT_INFO } from '@/lib/types/element-system'

interface ElementDisplayProps {
  element?: ElementType
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function ElementDisplay({ 
  element, 
  size = 'md',
  showName = false 
}: ElementDisplayProps) {
  if (!element) return null
  
  const elementInfo = ELEMENT_INFO[element]
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  
  return (
    <div className="inline-flex items-center gap-1">
      <span 
        className={`${sizeClasses[size]}`}
        style={{ color: elementInfo.color }}
        title={elementInfo.description}
      >
        {elementInfo.emoji}
      </span>
      {showName && (
        <span 
          className={`${sizeClasses[size]} font-medium`}
          style={{ color: elementInfo.color }}
        >
          {elementInfo.name}
        </span>
      )}
    </div>
  )
}