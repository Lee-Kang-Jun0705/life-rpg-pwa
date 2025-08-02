import React, { ComponentType, useEffect, useState } from 'react'
import { isClient } from './ssr'

/**
 * 클라이언트 사이드에서만 컴포넌트를 렌더링하는 HOC
 * SSR에서는 fallback 컴포넌트를 렌더링
 */
export function withClientOnly<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = null
) {
  return function ClientOnlyComponent(props: P) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) {
      return <>{fallback}</>
    }

    return <Component {...props} />
  }
}

/**
 * SSR 안전 데이터 페칭 HOC
 * 클라이언트에서만 데이터를 페칭하고, 서버에서는 기본값 사용
 */
export function withSSRSafeData<P extends object, D>(
  Component: ComponentType<P & { data: D }>,
  fetchData: () => Promise<D> | D,
  defaultData: D,
  LoadingComponent?: ComponentType
) {
  return function SSRSafeDataComponent(props: P) {
    const [data, setData] = useState<D>(defaultData)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (isClient()) {
        const loadData = async() => {
          try {
            const result = await fetchData()
            setData(result)
          } catch (error) {
            console.error('Failed to fetch data:', error)
          } finally {
            setLoading(false)
          }
        }
        loadData()
      } else {
        setLoading(false)
      }
    }, [])

    if (loading && LoadingComponent) {
      return <LoadingComponent />
    }

    return <Component {...props} data={data} />
  }
}

/**
 * SSR에서 에러를 방지하는 HOC
 * window, document 등의 브라우저 API 사용 시 안전하게 처리
 */
export function withBrowserAPI<P extends object>(
  Component: ComponentType<P>,
  dependencies: string[] = []
) {
  return function BrowserAPIComponent(props: P) {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
      // 지정된 브라우저 API들이 모두 사용 가능한지 확인
      const allAvailable = dependencies.every(dep => {
        const parts = dep.split('.')
        let current: unknown = window

        for (const part of parts) {
          if (!current || typeof current !== 'object' || current === null || !(part in current)) {
            return false
          }
          current = (current as Record<string, unknown>)[part]
        }

        return true
      })

      setIsReady(allAvailable)
    }, [])

    if (!isReady) {
      return null
    }

    return <Component {...props} />
  }
}

/**
 * 지연 로딩을 위한 SSR 안전 동적 임포트 HOC
 */
export function withLazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: React.ReactNode = null
) {
  return function LazyLoadComponent(props: P) {
    const [Component, setComponent] = useState<ComponentType<P> | null>(null)

    useEffect(() => {
      if (isClient()) {
        importFunc().then(module => {
          setComponent(() => module.default)
        })
      }
    }, [])

    if (!Component) {
      return <>{fallback}</>
    }

    return <Component {...props} />
  }
}

/**
 * SSR과 CSR에서 다른 컴포넌트를 렌더링하는 HOC
 */
export function withHydrationMismatchPrevention<P extends object>(
  ClientComponent: ComponentType<P>,
  ServerComponent: ComponentType<P>
) {
  return function HydrationSafeComponent(props: P) {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
      setIsHydrated(true)
    }, [])

    if (!isHydrated) {
      return <ServerComponent {...props} />
    }

    return <ClientComponent {...props} />
  }
}
