'use client'

import { useState } from 'react'
import { Challenge } from '@/lib/dungeon'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ChallengeProgressModalProps {
  challenge: Challenge | null
  isOpen: boolean
  onClose: () => void
  onUpdateProgress: (value: number) => Promise<void>
  onComplete: () => Promise<void>
}

export function ChallengeProgressModal({
  challenge,
  isOpen,
  onClose,
  onUpdateProgress,
  onComplete
}: ChallengeProgressModalProps) {
  const [inputValue, setInputValue] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!challenge) return null

  const handleUpdateProgress = async () => {
    const value = parseInt(inputValue)
    if (isNaN(value) || value < 0) return

    setIsUpdating(true)
    try {
      await onUpdateProgress(value)
      setInputValue('')
      onClose()
    } finally {
      setIsUpdating(false)
    }
  }

  const handleQuickComplete = async () => {
    setIsUpdating(true)
    try {
      await onComplete()
      onClose()
    } finally {
      setIsUpdating(false)
    }
  }

  const progressPercentage = challenge.targetValue > 0 
    ? (challenge.currentValue / challenge.targetValue) * 100 
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{challenge.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          {challenge.description}
        </p>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">현재 진행 상황</span>
            <span className="text-sm">
              {challenge.currentValue} / {challenge.targetValue}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {challenge.type === 'stat' && challenge.targetValue > 0 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                진행도 업데이트
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`0 ~ ${challenge.targetValue}`}
                  min="0"
                  max={challenge.targetValue}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
                <Button
                  onClick={handleUpdateProgress}
                  disabled={!inputValue || isUpdating}
                  size="sm"
                >
                  업데이트
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue(String(challenge.currentValue + 10))}
                disabled={challenge.currentValue >= challenge.targetValue}
              >
                +10
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue(String(challenge.currentValue + 30))}
                disabled={challenge.currentValue >= challenge.targetValue}
              >
                +30
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputValue(String(challenge.targetValue))}
                disabled={challenge.currentValue >= challenge.targetValue}
              >
                최대
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isUpdating}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            variant="default"
            onClick={handleQuickComplete}
            disabled={challenge.completed || isUpdating}
            className="flex-1"
          >
            {challenge.completed ? '완료됨' : '완료하기'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}