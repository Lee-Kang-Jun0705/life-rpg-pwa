import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'

export function GameGuide() {
  const guideItems = [
    {
      id: 'guide-stat-click',
      icon: '🎯',
      title: '스탯 버튼 클릭/스와이프',
      description: '해당 활동을 완료했을 때 클릭 또는 스와이프하여 경험치를 획듍하세요!'
    },
    {
      id: 'guide-voice-input',
      icon: '🎤',
      title: '음성 입력',
      description: '아래 마이크 버튼으로 활동을 음성으로 기록할 수 있어요!'
    },
    {
      id: 'guide-level-up',
      icon: '📈',
      title: '레벨업',
      description: '100 경험치마다 레벨이 오르고 더 강해져요!'
    },
    {
      id: 'guide-growth-check',
      icon: '🏆',
      title: '성장 확인',
      description: '상단의 요약 카드에서 전체 진행상황을 확인하세요!'
    }
  ]

  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          💡 게임 방법
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {guideItems.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <strong>{item.title}:</strong> {item.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
