import { useState } from 'react'

interface InsightCard {
  id: string
  emoji: string
  title: string
  mainValue: string
  subValue: string
  color: string
  details: string
}

interface InsightGridProps {
  cards: InsightCard[]
}

export function InsightGrid({ cards }: InsightGridProps) {
  const [activeCard, setActiveCard] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`
            relative overflow-hidden rounded-[2rem] p-6 
            bg-gradient-to-br ${card.color} text-white
            shadow-lg hover:shadow-xl transition-all duration-300
            cursor-pointer transform hover:scale-105
            ${activeCard === card.id ? 'ring-4 ring-white ring-opacity-50' : ''}
          `}
          onClick={() => setActiveCard(activeCard === card.id ? null : card.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setActiveCard(activeCard === card.id ? null : card.id)
            }
          }}
          aria-expanded={activeCard === card.id}
          aria-label={`${card.title}: ${card.mainValue}`}
        >
          {/* 배경 이모지 */}
          <div className="absolute -right-4 -top-4 text-6xl opacity-20" aria-hidden="true">
            {card.emoji}
          </div>

          {/* 컨텐츠 */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl" aria-hidden="true">{card.emoji}</span>
              <h4 className="font-semibold text-sm">{card.title}</h4>
            </div>
            <div className="text-2xl font-bold mb-1">
              {card.mainValue}
            </div>
            <div className="text-xs opacity-90">
              {card.subValue}
            </div>

            {/* 클릭 시 추가 정보 */}
            {activeCard === card.id && (
              <div className="mt-3 pt-3 border-t border-white/30 text-xs animate-bounce-in">
                {card.details}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
