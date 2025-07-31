import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 서버 측에서는 DB 접근 불가
    const isServer = typeof window === 'undefined'
    
    return NextResponse.json({
      status: 'ok',
      environment: {
        isServer,
        nodeVersion: process.version,
        platform: process.platform
      },
      message: 'API route is working. Database operations must be done on client side.'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}