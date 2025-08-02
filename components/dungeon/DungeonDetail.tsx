'use client'

import { useState } from 'react'
import { Dungeon, Challenge } from '@/lib/dungeon'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChallengeProgressModal } from './ChallengeProgressModal'

interface DungeonDetailProps {
  dungeon: Dungeon | null
  isOpen: boolean
  onClose: () => void
  onCompleteChallenge: (challengeId: string) => Promise<void>
  onUpdateChallengeProgress?: (challengeId: string, value: number) => Promise<void>
  onExit: () => void
  onStartBattle?: (monsterId: string) => void
}

export function DungeonDetail({
  dungeon,
  isOpen,
  onClose,
  onCompleteChallenge,
  onUpdateChallengeProgress,
  onExit,
  onStartBattle
}: DungeonDetailProps) {
  const [completingChallenge, setCompletingChallenge] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)

  if (!dungeon) {
    return null
  }

  const handleCompleteChallenge = async(challengeId: string) => {
    setCompletingChallenge(challengeId)
    try {
      await onCompleteChallenge(challengeId)
    } finally {
      setCompletingChallenge(null)
    }
  }

  const completedCount = dungeon.challenges.filter(c => c.completed).length
  const totalProgress = (completedCount / dungeon.challenges.length) * 100

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{dungeon.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg">
          <div className="text-4xl mb-2">⚔️</div>
          <p className="text-gray-600 dark:text-gray-400">{dungeon.description}</p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">전체 진행률</span>
            <span className="text-sm">{completedCount} / {dungeon.challenges.length}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-lg">도전 과제</h4>
          {dungeon.challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onComplete={() => handleCompleteChallenge(challenge.id)}
              onClick={() => {
                setSelectedChallenge(challenge)
                setIsProgressModalOpen(true)
              }}
              isCompleting={completingChallenge === challenge.id}
            />
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-2">클리어 보상</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-2xl">🏆</div>
                <div>{dungeon.rewards.exp} EXP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">💰</div>
                <div>{dungeon.rewards.coins} 코인</div>
              </div>
              {dungeon.rewards.items && dungeon.rewards.items.length > 0 && (
                <div className="text-center">
                  <div className="text-2xl">📦</div>
                  <div>{dungeon.rewards.items.length} 아이템</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {onStartBattle && (
              <Button
                onClick={() => {
                  // 던전 난이도에 따른 몬스터 선택
                  const monstersByDifficulty: { [key: string]: string } = {
                    easy: 'slime',
                    normal: 'goblin',
                    hard: 'orc',
                    nightmare: 'dragon'
                  }
                  const monsterId = monstersByDifficulty[dungeon.difficulty] || 'slime'
                  onStartBattle(monsterId)
                }}
                variant="default"
                className="w-full"
              >
                ⚔️ 전투 시작
              </Button>
            )}
            <Button
              onClick={onExit}
              variant="secondary"
              className="w-full"
            >
              던전 나가기
            </Button>
          </div>
        </div>
      </div>

      <ChallengeProgressModal
        challenge={selectedChallenge}
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false)
          setSelectedChallenge(null)
        }}
        onUpdateProgress={async(value) => {
          if (selectedChallenge && onUpdateChallengeProgress) {
            await onUpdateChallengeProgress(selectedChallenge.id, value)
          }
        }}
        onComplete={async() => {
          if (selectedChallenge) {
            await handleCompleteChallenge(selectedChallenge.id)
          }
        }}
      />
    </Modal>
  )
}

interface ChallengeCardProps {
  challenge: Challenge
  onComplete: () => void
  onClick: () => void
  isCompleting: boolean
}

function ChallengeCard({ challenge, onComplete, onClick, isCompleting }: ChallengeCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${challenge.completed ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-semibold mb-1 flex items-center gap-2">
            {challenge.completed && <span className="text-green-500">✓</span>}
            {challenge.title}
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {challenge.description}
          </p>
          {challenge.targetValue > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((challenge.currentValue / challenge.targetValue) * 100, 100)}%`
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {challenge.currentValue} / {challenge.targetValue}
              </span>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={challenge.completed ? 'secondary' : 'default'}
          onClick={(e) => {
            e.stopPropagation()
            onComplete()
          }}
          disabled={challenge.completed || isCompleting}
          className="ml-4"
        >
          {challenge.completed ? '완료' : isCompleting ? '처리중...' : '빠른완료'}
        </Button>
      </div>
    </Card>
  )
}
