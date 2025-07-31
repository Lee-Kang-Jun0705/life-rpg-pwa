'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/database'
import { dataIntegrityChecker } from '@/lib/utils/data-integrity-checker'
import { gameStore } from '@/lib/store/game-store'
import { realTimeSync } from '@/lib/sync/real-time-sync'
import { GAME_CONFIG } from '@/lib/config/game-config'
import type { IntegrityIssue } from '@/lib/utils/data-integrity-checker'
import type { UserProfileSchema, StatSchema, ActivitySchema, PlayerDataSchema } from '@/lib/database/schema'
import type { SyncMessage } from '@/lib/sync/real-time-sync'

interface DataSnapshot {
  profiles: UserProfileSchema[]
  stats: StatSchema[]
  activities: ActivitySchema[]
  playerData: PlayerDataSchema[]
  timestamp: Date
}

export default function DataSyncDebugPage() {
  const [dataSnapshot, setDataSnapshot] = useState<DataSnapshot | null>(null)
  const [syncIssues, setSyncIssues] = useState<IntegrityIssue[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(2000)
  const [syncMessages, setSyncMessages] = useState<SyncMessage[]>([])
  const [gameStoreState, setGameStoreState] = useState(gameStore.getAllState())

  // 데이터 스냅샷 가져오기
  const fetchSnapshot = async () => {
    try {
      const snapshot: DataSnapshot = {
        profiles: await db.profiles.toArray(),
        stats: await db.stats.toArray(),
        activities: await db.activities.orderBy('timestamp').reverse().limit(10).toArray(),
        playerData: await db.playerData.toArray(),
        timestamp: new Date()
      }
      setDataSnapshot(snapshot)
      setGameStoreState(gameStore.getAllState())
    } catch (error) {
      console.error('스냅샷 가져오기 실패:', error)
    }
  }

  // 데이터 무결성 검사
  const checkIntegrity = async () => {
    setIsChecking(true)
    try {
      const issues = await dataIntegrityChecker.checkAll(GAME_CONFIG.DEFAULT_USER_ID)
      setSyncIssues(issues)
    } catch (error) {
      console.error('무결성 검사 실패:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh) {
      fetchSnapshot()
      const interval = setInterval(fetchSnapshot, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // 동기화 메시지 리스너
  useEffect(() => {
    const unsubscribe = realTimeSync.on('DATA_UPDATED', (message) => {
      setSyncMessages(prev => [{
        ...message,
        receivedAt: new Date()
      }, ...prev].slice(0, 20))
    })
    
    return unsubscribe
  }, [])

  // 이슈 자동 수정
  const autoFixIssues = async () => {
    const criticalIssues = syncIssues.filter(issue => issue.severity === 'critical')
    const result = await dataIntegrityChecker.autoFix(criticalIssues)
    
    alert(`수정됨: ${result.fixed}, 실패: ${result.failed}`)
    await checkIntegrity()
    await fetchSnapshot()
  }

  // 테스트 데이터 생성
  const generateTestData = async () => {
    try {
      await gameStore.updateExperience('health', 50, '테스트 활동')
      alert('테스트 데이터 생성됨')
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">데이터 동기화 디버그 도구</h1>
        
        {/* 컨트롤 패널 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              자동 새로고침
            </label>
            
            <label className="flex items-center gap-2">
              간격:
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-gray-700 rounded px-2 py-1"
              >
                <option value={1000}>1초</option>
                <option value={2000}>2초</option>
                <option value={5000}>5초</option>
                <option value={10000}>10초</option>
              </select>
            </label>
            
            <button
              onClick={fetchSnapshot}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              수동 새로고침
            </button>
            
            <button
              onClick={checkIntegrity}
              disabled={isChecking}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {isChecking ? '검사 중...' : '무결성 검사'}
            </button>
            
            <button
              onClick={generateTestData}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              테스트 데이터 생성
            </button>
          </div>
        </div>

        {/* 게임 스토어 상태 */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-4">게임 스토어 상태</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">프로필</h3>
              <pre className="bg-gray-700 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(gameStoreState.profile, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">스탯</h3>
              <pre className="bg-gray-700 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(gameStoreState.stats, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* 무결성 이슈 */}
        {syncIssues.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">무결성 이슈 ({syncIssues.length})</h2>
              <button
                onClick={autoFixIssues}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm"
              >
                자동 수정 시도
              </button>
            </div>
            <div className="space-y-2">
              {syncIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${
                    issue.severity === 'critical' 
                      ? 'bg-red-900/50' 
                      : issue.severity === 'warning'
                      ? 'bg-yellow-900/50'
                      : 'bg-blue-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold">{issue.type}</span>
                      <span className="text-sm ml-2 opacity-75">({issue.table})</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      issue.severity === 'critical' 
                        ? 'bg-red-600' 
                        : issue.severity === 'warning'
                        ? 'bg-yellow-600'
                        : 'bg-blue-600'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{issue.description}</p>
                  {issue.suggestion && (
                    <p className="text-sm text-green-400 mt-1">💡 {issue.suggestion}</p>
                  )}
                  {(issue.expected !== undefined || issue.actual !== undefined) && (
                    <div className="text-xs mt-2 font-mono">
                      {issue.expected !== undefined && (
                        <div>예상: {JSON.stringify(issue.expected)}</div>
                      )}
                      {issue.actual !== undefined && (
                        <div>실제: {JSON.stringify(issue.actual)}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 데이터베이스 스냅샷 */}
        {dataSnapshot && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 프로필 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">프로필</h2>
              <div className="bg-gray-700 p-3 rounded">
                {dataSnapshot.profiles.map((profile, index) => (
                  <div key={index} className="mb-2">
                    <div className="font-semibold">{profile.name}</div>
                    <div className="text-sm opacity-75">
                      레벨: {profile.level} | 
                      총 경험치: {profile.totalExperience || 'N/A'} | 
                      현재 경험치: {profile.currentExperience || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 스탯 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">스탯</h2>
              <div className="space-y-2">
                {dataSnapshot.stats.map((stat, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="font-semibold">{stat.type}</span>
                      <span>Lv.{stat.level}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      경험치: {stat.experience} | 활동: {stat.totalActivities}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">최근 활동</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dataSnapshot.activities.map((activity, index) => (
                  <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                    <div className="flex justify-between">
                      <span>{activity.activityName}</span>
                      <span className="text-green-400">+{activity.experience} exp</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {activity.statType} | {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 동기화 메시지 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">동기화 메시지</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {syncMessages.length === 0 ? (
                  <div className="text-gray-500">대기 중...</div>
                ) : (
                  syncMessages.map((msg, index) => (
                    <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{msg.type}</span>
                        <span className="text-xs opacity-75">
                          {new Date(msg.receivedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {msg.tables && (
                        <div className="text-xs opacity-75">
                          테이블: {msg.tables.join(', ')}
                        </div>
                      )}
                      <div className="text-xs opacity-50">
                        소스: {msg.source}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 타임스탬프 */}
        {dataSnapshot && (
          <div className="text-center text-sm opacity-50 mt-6">
            마지막 업데이트: {dataSnapshot.timestamp.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}