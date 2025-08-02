// Service Worker 버전 관리
const CACHE_VERSION = 'v2'
const STATIC_CACHE_NAME = `life-rpg-static-${CACHE_VERSION}`
const DYNAMIC_CACHE_NAME = `life-rpg-dynamic-${CACHE_VERSION}`
const DATA_CACHE_NAME = `life-rpg-data-${CACHE_VERSION}`

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// 설치 이벤트 - 정적 자원 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch(err => console.error('[SW] Error precaching:', err))
  )
  // 즉시 활성화
  self.skipWaiting()
})

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('life-rpg-') &&
                         !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // 즉시 클라이언트 제어
  self.clients.claim()
})

// Fetch 이벤트 - 캐시 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chrome 확장 프로그램 등 무시
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // API 요청 - 네트워크 우선, 실패시 캐시
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // 정적 자원 - 캐시 우선, 실패시 네트워크
  if (request.destination === 'image' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // HTML 페이지 - 네트워크 우선, 오프라인시 캐시 또는 오프라인 페이지
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공적인 응답은 캐시에 저장
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // 네트워크 실패시 캐시에서 찾기
          return caches.match(request)
            .then(response => {
              if (response) {
                return response
              }
              // 캐시에도 없으면 오프라인 페이지
              return caches.match('/offline')
            })
        })
    )
    return
  }

  // 기타 요청 - 네트워크 우선
  event.respondWith(networkFirstStrategy(request))
})

// 캐시 우선 전략
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    // 백그라운드에서 업데이트
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone())
        }
      })
      .catch(() => {})

    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Network request failed:', error)
    // 오프라인 대체 응답
    return new Response('오프라인 상태입니다', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8'
      })
    })
  }
}

// 네트워크 우선 전략
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // API 요청 실패시 오프라인 응답
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: '오프라인 상태입니다',
          offline: true
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json'
          }
        })
    }

    throw error
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered')
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData())
  }
})

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '자세히 보기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action)
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// 오프라인 데이터 동기화
async function syncOfflineData() {
  // IndexedDB에서 동기화 대기중인 데이터 가져오기
  // 서버로 전송
  console.log('[SW] Syncing offline data...')
}
