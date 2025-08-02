import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { PersonalizedAdvice } from '@/lib/ai-coach/types'

interface AdviceTabProps {
  personalizedAdvice: PersonalizedAdvice[]
}

export function AdviceTab({ personalizedAdvice }: AdviceTabProps) {
  const getTypeIcon = (type: PersonalizedAdvice['type']) => {
    switch (type) {
      case 'strength': return '💪'
      case 'weakness': return '🎯'
      case 'opportunity': return '🚀'
      case 'habit': return '⭐'
      default: return '💡'
    }
  }

  const getTypeBadgeStyle = (type: PersonalizedAdvice['type']) => {
    switch (type) {
      case 'strength': return 'bg-gradient-to-r from-candy-green/30 to-candy-green/10 text-candy-green font-semibold'
      case 'weakness': return 'bg-gradient-to-r from-candy-pink/30 to-candy-pink/10 text-candy-pink font-semibold'
      case 'opportunity': return 'bg-gradient-to-r from-candy-blue/30 to-candy-blue/10 text-candy-blue font-semibold'
      case 'habit': return 'bg-gradient-to-r from-candy-purple/30 to-candy-purple/10 text-candy-purple font-semibold'
      default: return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 dark:from-gray-800 dark:to-gray-700'
    }
  }

  const getTypeLabel = (type: PersonalizedAdvice['type']) => {
    switch (type) {
      case 'strength': return '강점'
      case 'weakness': return '개선점'
      case 'opportunity': return '기회'
      case 'habit': return '습관'
      default: return '조언'
    }
  }

  const getPriorityBorderColor = (priority: PersonalizedAdvice['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-candy-pink border-l-8'
      case 'medium': return 'border-l-candy-yellow border-l-8'
      case 'low': return 'border-l-candy-green border-l-8'
      default: return 'border-l-gray-300 border-l-8'
    }
  }

  if (personalizedAdvice.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🤖</div>
            <p>더 정확한 조언을 위해 활동 데이터를 수집 중입니다...</p>
            <p className="text-sm mt-2">며칠 더 활동하시면 맞춤형 조언을 받아보실 수 있어요!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 우선순위별로 정렬
  const sortedAdvice = [...personalizedAdvice].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return (
    <div className="space-y-4">
      {sortedAdvice.map((advice, index) => (
        <Card
          key={index}
          className={`border-l-4 ${getPriorityBorderColor(advice.priority)}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{getTypeIcon(advice.type)}</span>
                {advice.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full ${getTypeBadgeStyle(advice.type)}`}>
                  {getTypeLabel(advice.type)}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  advice.priority === 'high' ? 'bg-gradient-to-r from-candy-pink/30 to-candy-pink/10 text-candy-pink' :
                    advice.priority === 'medium' ? 'bg-gradient-to-r from-candy-yellow/30 to-candy-yellow/10 text-candy-yellow' :
                      'bg-gradient-to-r from-candy-green/30 to-candy-green/10 text-candy-green'
                }`}>
                  {advice.priority === 'high' ? '높음' :
                    advice.priority === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {advice.description}
            </p>
            <div className="space-y-2">
              <p className="font-semibold text-sm flex items-center gap-1">
                <span>🎯</span>
                실행 방안:
              </p>
              <ul className="space-y-2">
                {advice.actionItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
