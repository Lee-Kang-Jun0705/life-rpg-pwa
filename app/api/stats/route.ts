import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/database/client'
import { GAME_CONFIG } from '@/lib/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    // 데이터베이스에서 스탯 가져오기
    const stats = await dbHelpers.getStats(userId)
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { statType, activityName, description, experience } = await request.json()
    const userId = GAME_CONFIG.DEFAULT_USER_ID
    
    // 활동 추가
    await dbHelpers.addActivity({
      userId,
      statType,
      activityName,
      description,
      experience,
      timestamp: new Date(),
      synced: false
    })
    
    // 업데이트된 스탯 반환
    const stats = await dbHelpers.getStats(userId)
    
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error updating stats:', error)
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    )
  }
}