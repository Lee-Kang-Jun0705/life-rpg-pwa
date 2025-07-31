'use client'

import { useState, useEffect, useCallback } from 'react'
import { Quest, QuestProgress } from '@/lib/types/quest'
import { ALL_QUESTS } from '@/lib/data/quests'

export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>(ALL_QUESTS)
  const [questProgress, setQuestProgress] = useState<Map<string, QuestProgress>>(new Map())
  const [activeQuests, setActiveQuests] = useState<Quest[]>([])

  // 로컬 스토리지에서 진행 상황 로드
  useEffect(() => {
    const savedProgress = localStorage.getItem('questProgress')
    if (savedProgress) {
      const progressData = JSON.parse(savedProgress)
      const progressMap = new Map(Object.entries(progressData))
      setQuestProgress(progressMap)
    }

    const savedActive = localStorage.getItem('activeQuests')
    if (savedActive) {
      const activeIds = JSON.parse(savedActive)
      const activeQuestsList = quests.filter(q => activeIds.includes(q.id))
      setActiveQuests(activeQuestsList)
    }
  }, [])

  // 진행 상황 저장
  const saveProgress = useCallback((progress: Map<string, QuestProgress>) => {
    const progressData = Object.fromEntries(progress)
    localStorage.setItem('questProgress', JSON.stringify(progressData))
  }, [])

  // 활성 퀘스트 저장
  const saveActiveQuests = useCallback((active: Quest[]) => {
    const activeIds = active.map(q => q.id)
    localStorage.setItem('activeQuests', JSON.stringify(activeIds))
  }, [])

  // 퀘스트 수락
  const acceptQuest = useCallback((questId: string) => {
    const quest = quests.find(q => q.id === questId)
    if (!quest || quest.status !== 'available') return

    // 퀘스트 상태 업데이트
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, status: 'in_progress' as const } : q
    )
    setQuests(updatedQuests)

    // 진행 상황 초기화
    const progress: QuestProgress = {
      questId,
      userId: 'user-1', // 실제로는 현재 사용자 ID 사용
      startedAt: new Date().toISOString(),
      objectives: quest.objectives.map(obj => ({
        objectiveId: obj.id,
        current: 0,
        completed: false
      })),
      completed: false,
      claimed: false
    }
    
    const newProgress = new Map(questProgress)
    newProgress.set(questId, progress)
    setQuestProgress(newProgress)
    saveProgress(newProgress)

    // 활성 퀘스트에 추가
    const newActive = [...activeQuests, quest]
    setActiveQuests(newActive)
    saveActiveQuests(newActive)
  }, [quests, questProgress, activeQuests, saveProgress, saveActiveQuests])

  // 퀘스트 진행도 업데이트
  const updateQuestProgress = useCallback((questId: string, objectiveId: string, progress: number) => {
    const questProg = questProgress.get(questId)
    if (!questProg) return

    const updatedProgress = {
      ...questProg,
      objectives: questProg.objectives.map(obj => {
        if (obj.objectiveId === objectiveId) {
          const quest = quests.find(q => q.id === questId)
          const objective = quest?.objectives.find(o => o.id === objectiveId)
          if (!objective) return obj

          const newCurrent = Math.min(progress, objective.required)
          const completed = newCurrent >= objective.required

          return {
            ...obj,
            current: newCurrent,
            completed
          }
        }
        return obj
      })
    }

    // 모든 목표가 완료되었는지 확인
    const allCompleted = updatedProgress.objectives.every(obj => obj.completed)
    if (allCompleted) {
      updatedProgress.completed = true
      
      // 퀘스트 상태 업데이트
      const updatedQuests = quests.map(q => 
        q.id === questId ? { ...q, status: 'completed' as const } : q
      )
      setQuests(updatedQuests)
    }

    const newProgress = new Map(questProgress)
    newProgress.set(questId, updatedProgress)
    setQuestProgress(newProgress)
    saveProgress(newProgress)
  }, [quests, questProgress, saveProgress])

  // 퀘스트 완료 및 보상 수령
  const claimQuestRewards = useCallback((questId: string) => {
    const quest = quests.find(q => q.id === questId)
    if (!quest || quest.status !== 'completed') return

    // 퀘스트 상태 업데이트
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, status: 'claimed' as const, claimedAt: new Date().toISOString() } : q
    )
    setQuests(updatedQuests)

    // 진행 상황 업데이트
    const questProg = questProgress.get(questId)
    if (questProg) {
      const updatedProgress = { ...questProg, claimed: true }
      const newProgress = new Map(questProgress)
      newProgress.set(questId, updatedProgress)
      setQuestProgress(newProgress)
      saveProgress(newProgress)
    }

    // 활성 퀘스트에서 제거
    const newActive = activeQuests.filter(q => q.id !== questId)
    setActiveQuests(newActive)
    saveActiveQuests(newActive)

    // TODO: 실제 보상 지급 로직 구현
    console.log('보상 지급:', quest.rewards)

    // 다음 퀘스트 잠금 해제
    unlockNextQuests(questId)
  }, [quests, questProgress, activeQuests, saveProgress, saveActiveQuests])

  // 다음 퀘스트 잠금 해제
  const unlockNextQuests = useCallback((completedQuestId: string) => {
    const updatedQuests = quests.map(quest => {
      if (quest.status === 'locked' && quest.requirements?.quests?.includes(completedQuestId)) {
        // 모든 선행 퀘스트가 완료되었는지 확인
        const allPrereqCompleted = quest.requirements.quests.every(reqId => {
          const reqQuest = quests.find(q => q.id === reqId)
          return reqQuest?.status === 'claimed'
        })

        if (allPrereqCompleted) {
          return { ...quest, status: 'available' as const }
        }
      }
      return quest
    })
    setQuests(updatedQuests)
  }, [quests])

  // 일일 퀘스트 리셋
  const resetDailyQuests = useCallback(() => {
    const updatedQuests = quests.map(quest => {
      if (quest.type === 'daily' && quest.resetType === 'daily') {
        return {
          ...quest,
          status: 'available' as const,
          objectives: quest.objectives.map(obj => ({
            ...obj,
            current: 0,
            completed: false
          }))
        }
      }
      return quest
    })
    setQuests(updatedQuests)

    // 일일 퀘스트 진행 상황 초기화
    const newProgress = new Map(questProgress)
    updatedQuests.forEach(quest => {
      if (quest.type === 'daily' && quest.resetType === 'daily') {
        newProgress.delete(quest.id)
      }
    })
    setQuestProgress(newProgress)
    saveProgress(newProgress)
  }, [quests, questProgress, saveProgress])

  return {
    quests,
    questProgress,
    activeQuests,
    acceptQuest,
    updateQuestProgress,
    claimQuestRewards,
    resetDailyQuests,
    mainQuests: quests.filter(q => q.type === 'main'),
    dailyQuests: quests.filter(q => q.type === 'daily'),
    sideQuests: quests.filter(q => q.type === 'side'),
    eventQuests: quests.filter(q => q.type === 'event')
  }
}