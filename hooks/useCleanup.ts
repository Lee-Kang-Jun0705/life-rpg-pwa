import { useEffect, useRef } from 'react'

/**
 * 비동기 작업 중 컴포넌트 언마운트 시 메모리 누수 방지
 */
export function useCleanup() {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const isMounted = () => isMountedRef.current

  const runIfMounted = <T extends (...args: any[]) => any>(
    callback: T
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      if (isMountedRef.current) {
        callback(...args)
      }
    }
  }

  return { isMounted, runIfMounted }
}

/**
 * AbortController를 사용한 요청 취소 관리
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortControllerRef.current = new AbortController()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const getSignal = () => abortControllerRef.current?.signal

  const abort = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
  }

  return { signal: getSignal(), abort }
}

/**
 * 타이머 자동 정리
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // 콜백이 변경되면 ref 업데이트
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) {
      return
    }

    const id = setTimeout(() => savedCallback.current(), delay)

    return () => clearTimeout(id)
  }, [delay])
}

/**
 * 인터벌 자동 정리
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(id)
  }, [delay])
}