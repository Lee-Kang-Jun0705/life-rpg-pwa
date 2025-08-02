'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useEmotion } from '@/contexts/EmotionContext'

interface EmotionCheckInProps {
  onComplete: (emotion: string, intensity: number) => void
  onSkip?: () => void
}

const EMOTIONS = [
  { id: 'happy', emoji: '😊', label: '행복해요', color: 'from-yellow-400 to-yellow-500' },
  { id: 'excited', emoji: '🤗', label: '신나요', color: 'from-orange-400 to-orange-500' },
  { id: 'calm', emoji: '😌', label: '평온해요', color: 'from-green-400 to-green-500' },
  { id: 'tired', emoji: '😴', label: '피곤해요', color: 'from-blue-400 to-blue-500' },
  { id: 'stressed', emoji: '😰', label: '스트레스', color: 'from-purple-400 to-purple-500' },
  { id: 'sad', emoji: '😢', label: '슬퍼요', color: 'from-indigo-400 to-indigo-500' },
  { id: 'anxious', emoji: '😟', label: '불안해요', color: 'from-red-400 to-red-500' },
  { id: 'angry', emoji: '😠', label: '화나요', color: 'from-pink-400 to-pink-500' }
]

export function EmotionCheckIn({ onComplete, onSkip }: EmotionCheckInProps) {
  const { setEmotion } = useEmotion()
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [step, setStep] = useState<'emotion' | 'intensity'>('emotion')

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId)
    setStep('intensity')
  }

  const handleComplete = () => {
    if (selectedEmotion) {
      setEmotion(selectedEmotion, intensity)
      onComplete(selectedEmotion, intensity)
    }
  }

  const selectedEmotionData = EMOTIONS.find(e => e.id === selectedEmotion)

  if (step === 'emotion') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-center mb-4">지금 기분이 어떠세요?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            현재 감정을 선택해주세요
          </p>
          <div className="grid grid-cols-2 gap-3">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => handleEmotionSelect(emotion.id)}
                className={`p-4 rounded-2xl bg-gradient-to-r ${emotion.color} text-white 
                  transform transition-all duration-200 hover:scale-105 active:scale-95
                  shadow-lg hover:shadow-xl`}
              >
                <div className="text-4xl mb-2">{emotion.emoji}</div>
                <div className="text-sm font-medium">{emotion.label}</div>
              </button>
            ))}
          </div>
          {onSkip && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                나중에 하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">{selectedEmotionData?.emoji}</div>
          <h3 className="text-xl font-bold">{selectedEmotionData?.label}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            얼마나 강하게 느끼시나요?
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>약함</span>
              <span className="font-bold text-lg">{intensity}</span>
              <span>강함</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className={`w-full h-3 rounded-full bg-gradient-to-r ${selectedEmotionData?.color} 
                appearance-none cursor-pointer`}
              style={{
                background: `linear-gradient(to right, 
                  ${selectedEmotionData?.color.split(' ')[1]} 0%, 
                  ${selectedEmotionData?.color.split(' ')[3]} ${intensity * 10}%, 
                  #e5e7eb ${intensity * 10}%, 
                  #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between mt-1">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    i < intensity ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('emotion')}
              className="flex-1"
            >
              다시 선택
            </Button>
            <Button
              onClick={handleComplete}
              className={`flex-1 bg-gradient-to-r ${selectedEmotionData?.color} text-white
                hover:opacity-90 border-0`}
            >
              완료
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
