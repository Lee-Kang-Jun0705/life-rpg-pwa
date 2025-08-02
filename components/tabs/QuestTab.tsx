'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scroll, Star, Sparkles, Calendar, Zap, Wand2 } from 'lucide-react'
import { QuestList } from '@/components/quest/QuestList'
import { useQuests } from '@/hooks/useQuests'
import { DynamicQuestGenerator } from '@/components/quest/DynamicQuestGenerator'
import { DynamicQuest } from '@/lib/types/dynamic-quest'

export function QuestTab() {
  const { mainQuests, dailyQuests, sideQuests, eventQuests, activeQuests } = useQuests()
  const [activeSection, setActiveSection] = useState<'active' | 'main' | 'daily' | 'side' | 'event' | 'dynamic'>('main')

  const sections = [
    { id: 'active' as const, label: '진행 중', icon: Zap, count: activeQuests.length },
    { id: 'main' as const, label: '메인', icon: Star, count: mainQuests.length },
    { id: 'daily' as const, label: '일일', icon: Calendar, count: dailyQuests.length },
    { id: 'side' as const, label: '사이드', icon: Scroll, count: sideQuests.length },
    { id: 'event' as const, label: '이벤트', icon: Sparkles, count: eventQuests.length },
    { id: 'dynamic' as const, label: '맞춤형', icon: Wand2, count: 0 }
  ]

  const getQuestsBySection = () => {
    switch (activeSection) {
      case 'active':
        return activeQuests
      case 'main':
        return mainQuests
      case 'daily':
        return dailyQuests
      case 'side':
        return sideQuests
      case 'event':
        return eventQuests
    }
  }

  return (
    <div className="space-y-3">
      {/* 퀘스트 요약 - 크기 대폭 축소 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-3 border border-purple-500/30"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <Scroll className="w-4 h-4 text-purple-500" />
              퀘스트 관리
            </h2>
            <p className="text-xs text-white font-semibold">당신의 모험을 기록하고 보상을 획득하세요</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">진행 중인 퀘스트</p>
            <p className="text-lg font-bold text-white">{activeQuests.length}</p>
          </div>
        </div>

        {/* 퀘스트 통계 - 크기 축소 */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-gray-800/50 rounded p-1.5 text-center">
            <p className="text-sm font-bold text-purple-400">{mainQuests.filter(q => q.status === 'completed' || q.status === 'claimed').length}</p>
            <p className="text-[10px] text-gray-400">메인 완료</p>
          </div>
          <div className="bg-gray-800/50 rounded p-1.5 text-center">
            <p className="text-sm font-bold text-blue-400">{dailyQuests.filter(q => q.status === 'completed' || q.status === 'claimed').length}</p>
            <p className="text-[10px] text-gray-400">일일 완료</p>
          </div>
          <div className="bg-gray-800/50 rounded p-1.5 text-center">
            <p className="text-sm font-bold text-green-400">{sideQuests.filter(q => q.status === 'completed' || q.status === 'claimed').length}</p>
            <p className="text-[10px] text-gray-400">사이드 완료</p>
          </div>
          <div className="bg-gray-800/50 rounded p-1.5 text-center">
            <p className="text-sm font-bold text-red-400">{eventQuests.filter(q => q.status === 'completed' || q.status === 'claimed').length}</p>
            <p className="text-[10px] text-gray-400">이벤트 완료</p>
          </div>
        </div>
      </motion.div>

      {/* 섹션 선택 - 크기 축소 */}
      <div className="flex gap-1 p-0.5 bg-gray-800/50 rounded-lg">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Icon className="w-3 h-3" />
                <span>{section.label}</span>
                {section.count > 0 && (
                  <span className={`px-1.5 py-0 text-[10px] rounded-full ${
                    activeSection === section.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {section.count}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 퀘스트 목록 또는 동적 퀘스트 생성기 */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'dynamic' ? (
          <DynamicQuestGenerator
            userId="current-user"
            onQuestAccept={(quest: DynamicQuest) => {
              // 퀘스트 수락 시 진행 중 목록에 추가
              console.log('동적 퀘스트 수락:', quest)
              // TODO: 실제 퀘스트 시스템과 연동
            }}
          />
        ) : (
          <QuestList
            quests={getQuestsBySection()}
            title={sections.find(s => s.id === activeSection)?.label || '퀘스트'}
            emptyMessage={
              activeSection === 'active'
                ? '진행 중인 퀘스트가 없습니다'
                : `${sections.find(s => s.id === activeSection)?.label} 퀘스트가 없습니다`
            }
          />
        )}
      </motion.div>
    </div>
  )
}
