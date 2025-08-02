import React from 'react'
import { AIPattern, AI_PATTERN_TRAITS, MonsterAIState } from '@/lib/types/monster-ai'

interface AIPatternDisplayProps {
  pattern?: AIPattern
  aiState?: MonsterAIState
  showDetails?: boolean
}

export function AIPatternDisplay({ 
  pattern, 
  aiState,
  showDetails = false 
}: AIPatternDisplayProps) {
  if (!pattern) return null
  
  const traits = AI_PATTERN_TRAITS[pattern]
  const moodEmojis = {
    calm: '😌',
    angry: '😡',
    defensive: '🛡️',
    desperate: '😱'
  }
  
  const moodColors = {
    calm: 'text-green-500',
    angry: 'text-red-500',
    defensive: 'text-blue-500',
    desperate: 'text-yellow-500'
  }
  
  return (
    <div className="text-xs">
      <div className="flex items-center gap-1">
        <span className="text-gray-600">AI:</span>
        <span className="font-medium text-purple-600">{traits.name}</span>
        {aiState && (
          <span 
            className={`ml-1 ${moodColors[aiState.currentMood]}`}
            title={`현재 기분: ${aiState.currentMood}`}
          >
            {moodEmojis[aiState.currentMood]}
          </span>
        )}
      </div>
      
      {showDetails && aiState && (
        <div className="mt-1 text-[10px] text-gray-500 space-y-0.5">
          <div>공격성: {aiState.aggression}%</div>
          <div>지능: {aiState.intelligence}%</div>
          <div>협동성: {aiState.teamwork}%</div>
        </div>
      )}
    </div>
  )
}