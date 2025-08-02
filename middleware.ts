import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 유효한 경로 목록
const VALID_ROUTES = [
  '/',  // 홈페이지 추가
  '/dashboard',
  '/dungeon',  // 리다이렉트 유지
  '/adventure',
  '/ai-coach',
  '/shop',
  '/profile',
  '/settings',
  '/settings/notifications',
  '/leaderboard',
  '/offline',
  '/activities',
  '/debug',
  '/debug-db',
  '/test-db',
  '/fix-db',
  '/equipment',
  '/battle',
  '/daily',
  '/collection',
  '/achievements',
  '/ranking'
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 루트 경로(/)로 접속하면 /dashboard로 리다이렉트
  // 테스트를 위해 임시로 비활성화
  // if (pathname === '/') {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  // API 경로, 정적 파일, 특수 경로는 그대로 통과
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/404' ||
    pathname === '/_not-found'
  ) {
    return NextResponse.next()
  }

  // 유효한 경로인지 확인
  const isValidRoute = VALID_ROUTES.some(route => pathname.startsWith(route))

  // 유효하지 않은 경로는 404 페이지로
  if (!isValidRoute) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  return NextResponse.next()
}

// 미들웨어가 작동할 경로 설정
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)'
}
