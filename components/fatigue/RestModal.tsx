'use client'

import React, { useState } from 'react'
import { useFatigue } from '@/lib/fatigue/useFatigue'
import { Coffee, Moon, Dumbbell, Book } from 'lucide-react'

interface RestOption {
  id: string
  name: string
  duration: number // 분
  icon: React.ReactNode
  description: string
  recovery: number // 예상 회복량
}

const REST_OPTIONS: RestOption[] = [
  {
    id: 'short-break',
    name: '짧은 휴식',
    duration: 15,
    icon: <Coffee className="w-6 h-6" />,
    description: '잠시 스트레칭을 하거나 차를 마시며 휴식',
    recovery: 5
  },
  {
    id: 'meditation',
    name: '명상/운동',
    duration: 60,
    icon: <Dumbbell className="w-6 h-6" />,
    description: '명상이나 가벼운 운동으로 몸과 마음을 재충전',
    recovery: 20
  },
  {
    id: 'hobby',
    name: '취미 활동',
    duration: 120,
    icon: <Book className="w-6 h-6" />,
    description: '좋아하는 취미 활동으로 스트레스 해소',
    recovery: 35
  },
  {
    id: 'sleep',
    name: '수면',
    duration: 480,
    icon: <Moon className="w-6 h-6" />,
    description: '충분한 수면으로 완전한 회복',
    recovery: 80
  }
]

interface RestModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function RestModal({ userId, isOpen, onClose }: RestModalProps) {
  const { fatigueState, recordRest, refreshFatigue } = useFatigue(userId)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isResting, setIsResting] = useState(false)

  if (!isOpen || !fatigueState) return null

  const handleRest = async () => {
    const option = REST_OPTIONS.find(opt => opt.id === selectedOption)
    if (!option) return

    setIsResting(true)
    
    try {
      const success = await recordRest(option.duration)
      
      if (success) {
        await refreshFatigue()
        
        // 성공 메시지 표시
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } finally {
      setIsResting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">휴식 시간</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>현재 피로도</span>
            <span className="font-medium text-orange-600">
              {Math.round(fatigueState.currentFatigue)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${fatigueState.currentFatigue}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {REST_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={isResting}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedOption === option.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{option.duration}분</span>
                    <span>피로도 -{option.recovery}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isResting}
          >
            취소
          </button>
          <button
            onClick={handleRest}
            disabled={!selectedOption || isResting}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResting ? '휴식 중...' : '휴식하기'}
          </button>
        </div>
      </div>
    </div>
  )
}