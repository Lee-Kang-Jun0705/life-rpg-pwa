import { Card } from '@/components/ui/Card'
import type { PersonalizedAdvice } from '@/lib/ai-coach/types'

interface TipsCardProps {
  advice: PersonalizedAdvice[]
}

export function TipsCard({ advice }: TipsCardProps) {
  const highPriorityAdvice = advice.filter(a => a.priority === 'high').slice(0, 2)

  return (
    <Card className="p-6 bg-gradient-to-br from-candy-yellow/20 to-candy-orange/20">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="text-2xl animate-pulse">💡</span>
        오늘의 성장 팁
      </h3>
      <div className="space-y-2">
        {highPriorityAdvice.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-candy-orange" aria-hidden="true">•</span>
            <p className="text-sm">{item.actionItems[0]}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}