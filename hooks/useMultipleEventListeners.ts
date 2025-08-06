import { useEffect, useRef } from 'react'

type EventMap = Record<string, EventListener>

/**
 * 여러 이벤트 리스너를 관리하는 커스텀 훅
 * 자동으로 cleanup 처리
 */
export function useMultipleEventListeners(
  events: EventMap,
  target: EventTarget = window
) {
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    const eventEntries = Object.entries(eventsRef.current)
    
    // 이벤트 리스너 등록
    eventEntries.forEach(([event, handler]) => {
      target.addEventListener(event, handler)
    })

    // Cleanup
    return () => {
      eventEntries.forEach(([event, handler]) => {
        target.removeEventListener(event, handler)
      })
    }
  }, [target])
}