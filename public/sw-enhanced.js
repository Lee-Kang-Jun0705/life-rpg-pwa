// Life RPG Enhanced Service Worker - 백그라운드 동기화 및 캐싱
const CACHE_NAME = 'life-rpg-v1'
const SYNC_TAG = 'sync-game-data'

// API 엔드포인트 패턴
const API_PATTERNS = [
  /\/api\/energy/,
  /\/api\/tickets/,
  /\/api\/player/,
  /\/api\/battle/,
  /\/api\/dungeon/
]

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('[SW] Installing Enhanced Service Worker')
  self.skipWaiting()
})

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('[SW] Activating Enhanced Service Worker')
  self.clients.claim()
})

// Fetch 이벤트 - API 요청 캐싱
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // API 요청만 처리
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공 응답 캐시
          if (response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // 오프라인시 캐시에서 반환
          return caches.match(request)
        })
    )
  }
})

// 백그라운드 동기화
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncGameData())
  }
})

// 메시지 수신 (클라이언트와 통신)
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncGameData())
  }
})

// 게임 데이터 동기화 함수
async function syncGameData() {
  try {
    // 클라이언트에 동기화 완료 알림
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('[SW] Sync error:', error)
  }
}
