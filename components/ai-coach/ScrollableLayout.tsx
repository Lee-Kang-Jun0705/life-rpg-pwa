'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  label: string
  emoji: string
}

interface ScrollableLayoutProps {
  sections: Section[]
  children: React.ReactNode[]
  activeSection?: string
  onSectionChange?: (sectionId: string) => void
}

// 스크롤 성능 최적화를 위한 throttle 함수
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function ScrollableLayout({
  sections,
  children,
  activeSection: externalActiveSection,
  onSectionChange
}: ScrollableLayoutProps) {
  const [activeSection, setActiveSection] = useState(externalActiveSection || sections[0]?.id)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 섹션으로 스크롤
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      setIsScrolling(true)
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
      onSectionChange?.(sectionId)
      
      // 스크롤 완료 후 플래그 해제
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000)
    }
  }, [onSectionChange])

  // 스크롤 핸들러 (throttled)
  const handleScroll = useCallback(
    throttle(() => {
      if (isScrolling) return // 프로그래매틱 스크롤 중에는 무시

      const scrollPosition = window.scrollY + 100 // 오프셋 추가

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(`section-${sections[i].id}`)
        if (element && element.offsetTop <= scrollPosition) {
          if (activeSection !== sections[i].id) {
            setActiveSection(sections[i].id)
            onSectionChange?.(sections[i].id)
          }
          break
        }
      }
    }, 100), // 100ms throttle
    [sections, activeSection, isScrolling, onSectionChange]
  )

  // 스크롤 이벤트 리스너 설정
  useEffect(() => {
    // passive 옵션으로 성능 개선
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 초기 위치 체크

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  return (
    <>
      {/* 상단 고정 네비게이션 */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "whitespace-nowrap transition-all",
                  activeSection === section.id
                    ? "bg-gradient-to-r from-candy-blue/20 to-candy-purple/20 text-candy-purple font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className="text-lg mr-1">{section.emoji}</span>
                <span className="text-sm">{section.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* 섹션 콘텐츠 */}
      <div className="space-y-8 pb-32">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="min-h-[60vh] scroll-mt-20"
          >
            {/* 섹션 헤더 */}
            <div className="mb-6 animate-fade-in">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 px-4 py-2 rounded-full">
                <span className="text-2xl animate-float">{section.emoji}</span>
                <h2 className="text-xl font-bold">{section.label}</h2>
              </div>
            </div>

            {/* 섹션 콘텐츠 */}
            <div className="animate-slide-up">
              {children[index]}
            </div>
          </section>
        ))}
      </div>


      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </>
  )
}