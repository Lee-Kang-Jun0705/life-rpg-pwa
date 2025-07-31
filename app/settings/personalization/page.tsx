'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PersonalizationService } from '@/lib/personalization/personalization-service'
import { PersonalizationMode, StorageUsage } from '@/lib/personalization/types'
import { useDatabase } from '@/lib/hooks/useDatabase'
import './styles.css'

export default function PersonalizationSettingsPage() {
  const router = useRouter()
  const { user } = useDatabase()
  const [mode, setMode] = useState<PersonalizationMode>('light')
  const [showComparison, setShowComparison] = useState(false)
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const personalizationService = PersonalizationService.getInstance()

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const settings = await personalizationService.getSettings(user.id)
      setMode(settings.mode)
      
      const usage = await personalizationService.calculateStorageUsage(user.id)
      setStorageUsage(usage)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMode = async () => {
    if (!user?.id || saving) return
    
    try {
      setSaving(true)
      await personalizationService.changeMode(user.id, mode)
      
      // 성공 메시지 표시 (토스트 등)
      alert(`${mode === 'light' ? '라이트' : '프로'} 모드로 변경되었습니다!`)
      
      // 설정 페이지로 돌아가기
      router.push('/settings')
    } catch (error) {
      console.error('Failed to save mode:', error)
      alert('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="personalization-settings loading">
        <p>설정을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="personalization-settings">
      <div className="header">
        <h2>AI 코치 개인화 수준</h2>
        <p className="subtitle">
          당신의 목표와 기기 성능에 맞는 모드를 선택하세요
        </p>
      </div>
      
      {/* 모드 카드 */}
      <div className="mode-cards">
        {/* 라이트 모드 */}
        <div 
          className={`mode-card light ${mode === 'light' ? 'selected' : ''}`}
          onClick={() => setMode('light')}
        >
          <div className="mode-header">
            <span className="icon">🌤️</span>
            <h3>라이트 모드</h3>
            <span className="badge">권장</span>
          </div>
          
          <div className="mode-description">
            <p>가벼운 습관 추적과 기본적인 코칭</p>
          </div>
          
          <div className="pros-cons">
            <div className="pros">
              <h4>👍 장점</h4>
              <ul>
                <li>빠른 응답 속도</li>
                <li>적은 저장 공간 (10MB)</li>
                <li>배터리 효율적</li>
                <li>심플한 인터페이스</li>
                <li>기본 패턴 분석 제공</li>
              </ul>
            </div>
            
            <div className="cons">
              <h4>👎 제한사항</h4>
              <ul>
                <li>30일 이후 데이터 삭제</li>
                <li>기본적인 통계만 제공</li>
                <li>단순 패턴 분석</li>
                <li>제한된 예측 기능</li>
              </ul>
            </div>
          </div>
          
          <div className="best-for">
            <strong>추천 대상:</strong>
            <ul>
              <li>습관 형성 초보자</li>
              <li>가벼운 건강 관리</li>
              <li>저사양 기기 사용자</li>
              <li>프라이버시 중시</li>
            </ul>
          </div>
        </div>
        
        {/* 프로 모드 */}
        <div 
          className={`mode-card pro ${mode === 'pro' ? 'selected' : ''}`}
          onClick={() => setMode('pro')}
        >
          <div className="mode-header">
            <span className="icon">🚀</span>
            <h3>프로 모드</h3>
            <span className="badge premium">프리미엄</span>
          </div>
          
          <div className="mode-description">
            <p>심층 분석과 정밀한 개인화 코칭</p>
          </div>
          
          <div className="pros-cons">
            <div className="pros">
              <h4>👍 장점</h4>
              <ul>
                <li>1년 데이터 보관</li>
                <li>AI 심층 분석</li>
                <li>정밀 패턴 예측</li>
                <li>고급 통계 대시보드</li>
                <li>맞춤형 프로그램 생성</li>
                <li>이미지 분석 강화</li>
              </ul>
            </div>
            
            <div className="cons">
              <h4>👎 고려사항</h4>
              <ul>
                <li>더 많은 저장 공간 (100MB)</li>
                <li>배터리 소모 증가</li>
                <li>초기 학습 시간 필요</li>
                <li>복잡한 데이터 관리</li>
              </ul>
            </div>
          </div>
          
          <div className="best-for">
            <strong>추천 대상:</strong>
            <ul>
              <li>진지한 자기계발러</li>
              <li>전문 운동선수</li>
              <li>데이터 분석 선호자</li>
              <li>장기 목표 추구자</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 상세 비교표 */}
      <button 
        className="comparison-toggle"
        onClick={() => setShowComparison(!showComparison)}
      >
        {showComparison ? '비교표 닫기' : '상세 비교표 보기'} 
        <span className="arrow">{showComparison ? '▲' : '▼'}</span>
      </button>
      
      {showComparison && (
        <div className="detailed-comparison">
          <table>
            <thead>
              <tr>
                <th>기능</th>
                <th>🌤️ 라이트</th>
                <th>🚀 프로</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>저장 공간</td>
                <td>~10MB</td>
                <td>~100MB</td>
              </tr>
              <tr>
                <td>데이터 보관</td>
                <td>30일</td>
                <td>365일</td>
              </tr>
              <tr>
                <td>활동 기록</td>
                <td>최대 1,000개</td>
                <td>무제한</td>
              </tr>
              <tr>
                <td>패턴 분석</td>
                <td>기본 (시간대, 빈도)</td>
                <td>고급 (상관관계, 예측)</td>
              </tr>
              <tr>
                <td>AI 응답</td>
                <td>일반적 조언</td>
                <td>데이터 기반 정밀 조언</td>
              </tr>
              <tr>
                <td>이미지 분석</td>
                <td>기본 인식</td>
                <td>상세 분석 + 진척도</td>
              </tr>
              <tr>
                <td>리포트</td>
                <td>주간 요약</td>
                <td>월간/연간 심층 리포트</td>
              </tr>
              <tr>
                <td>목표 추적</td>
                <td>단순 체크</td>
                <td>진척도 예측 + 조정</td>
              </tr>
              <tr>
                <td>오프라인 동작</td>
                <td>✅ 완전 지원</td>
                <td>✅ 완전 지원</td>
              </tr>
              <tr>
                <td>배터리 영향</td>
                <td>최소</td>
                <td>보통</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* 현재 사용량 */}
      {storageUsage && (
        <div className="current-usage">
          <h4>현재 데이터 사용량</h4>
          <div className="usage-stats">
            <div className="stat">
              <span className="label">저장 공간:</span>
              <span className="value">
                {storageUsage.totalMB.toFixed(1)}MB / {mode === 'light' ? '10MB' : '100MB'}
              </span>
            </div>
            <div className="stat">
              <span className="label">활동 기록:</span>
              <span className="value">{storageUsage.breakdown.activities}개</span>
            </div>
            <div className="stat">
              <span className="label">AI 상호작용:</span>
              <span className="value">{storageUsage.breakdown.interactions}회</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(storageUsage.totalMB / (mode === 'light' ? 10 : 100)) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
      
      {/* FAQ 섹션 */}
      <div className="faq-section">
        <h4>자주 묻는 질문</h4>
        <details>
          <summary>나중에 모드를 변경할 수 있나요?</summary>
          <p>네! 언제든지 설정에서 변경 가능합니다. 라이트→프로는 즉시 가능하고, 프로→라이트는 데이터 요약 후 전환됩니다.</p>
        </details>
        <details>
          <summary>프로 모드는 유료인가요?</summary>
          <p>아니요, 모든 기능은 무료입니다. 단지 더 많은 저장 공간을 사용할 뿐입니다.</p>
        </details>
        <details>
          <summary>어떤 모드를 선택해야 할까요?</summary>
          <p>처음에는 라이트 모드로 시작하세요. 더 자세한 분석이 필요하다고 느끼면 프로 모드로 업그레이드하면 됩니다.</p>
        </details>
        <details>
          <summary>데이터는 어디에 저장되나요?</summary>
          <p>모든 데이터는 여러분의 기기에만 저장됩니다. 외부 서버로 전송되지 않아 완전히 안전합니다.</p>
        </details>
      </div>
      
      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button 
          className="save-button"
          onClick={handleSaveMode}
          disabled={saving}
        >
          {saving ? '저장 중...' : 
            mode === 'light' ? '라이트 모드로 설정' : '프로 모드로 설정'}
        </button>
        
        <button 
          className="cancel-button"
          onClick={() => router.push('/settings')}
        >
          취소
        </button>
        
        {mode === 'pro' && (
          <p className="warning-text">
            ⚠️ 프로 모드는 더 많은 저장 공간과 배터리를 사용합니다
          </p>
        )}
      </div>
    </div>
  )
}