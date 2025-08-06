# Life RPG PWA - 페이지별 독립 리팩토링 전략

> 작성일: 2025-08-05  
> 목적: 페이지 간 의존성 문제를 해결하여 독립적인 개발 및 배포 가능하도록 함

## 📋 목차
1. [현재 문제 상황](#현재-문제-상황)
2. [프로젝트 구조 분석](#프로젝트-구조-분석)
3. [해결 전략](#해결-전략)
4. [구현 가이드](#구현-가이드)
5. [테스트 전략](#테스트-전략)
6. [배포 전략](#배포-전략)
7. [체크리스트](#체크리스트)

## 현재 문제 상황

### 핵심 문제
- **페이지 간 높은 의존성**: 한 페이지를 수정하면 다른 페이지에 영향
- **반복되는 버그**: 음성 입력 2회 시도 문제가 3번 이상 재발
- **리팩토링 어려움**: 전체 코드를 동시에 수정하면 무한 에러 발생

### 구체적 사례
1. **음성 입력 버그 (해결됨)**
   - 문제: 첫 시도에서 저장 안됨, 2번째 시도에서만 정상 동작
   - 원인: Race condition (reset()과 onTranscript() 타이밍)
   - 해결: completedVoiceData 상태 분리로 해결

2. **사운드 매니저 충돌**
   - 던전 BGM 수정 → 다른 페이지 오디오 영향
   - 전역 AudioContext 공유로 인한 문제

3. **스탯 시스템 연동**
   - 대시보드 스탯 변경 → 던전 전투력 계산 오류
   - useStats Hook 공유로 인한 상태 동기화 문제

## 프로젝트 구조 분석

### 메인 페이지 (4개)

#### 1. 대시보드 (`/dashboard`)
```
주요 기능: 스탯 관리, 음성 입력, 경험치 시스템
의존성:
  - contexts/DashboardContext
  - hooks/useDashboard
  - hooks/useLevelUpDetection
  - components/voice/EnhancedVoiceInput
  - lib/services/experience-calculator.service
```

#### 2. 던전 (`/dungeon`)
```
주요 기능: 전투, 아이템 획득, BGM/효과음
의존성:
  - store/dungeon-store
  - hooks/useStats (대시보드와 공유!)
  - lib/services/sound-manager
  - lib/dungeon/battle-engine
  - components/dungeon/AutoBattle
```

#### 3. AI 코치 (`/ai-coach`)
```
주요 기능: 6개 탭 (인사이트, 채팅, 분석, 성장, 조언, 활동분석)
의존성:
  - lib/ai-coach/useAICoach
  - components/ai-coach/TabLayout
  - 각 탭별 컴포넌트 (lazy loading)
```

#### 4. 프로필 (`/profile`)
```
주요 기능: 사용자 정보, 통계 표시
의존성:
  - 다른 페이지들의 데이터 읽기
  - (상세 분석 필요)
```

### 공통 의존성 (문제의 근원)
```
lib/hooks/useStats          → 대시보드, 던전 공유
lib/services/sound-manager  → 던전, 기타 페이지 공유
lib/services/level-*.ts     → 여러 페이지에서 사용
contexts/SystemProviders    → 전역 Provider
```

## 해결 전략

### 핵심 전략: Adapter Pattern + Feature Flags

#### 1. Adapter 레이어 도입
각 페이지가 공통 서비스를 직접 사용하지 않고, 자신만의 Adapter를 통해 접근

```typescript
// lib/adapters/dashboard-adapter.ts
export class DashboardAdapter {
  private statsService: StatsService
  private mockMode: boolean = false
  
  constructor(options?: { mockMode?: boolean }) {
    this.mockMode = options?.mockMode || false
    this.statsService = new StatsService()
  }
  
  async getStats() {
    if (this.mockMode) {
      return this.getMockStats()
    }
    return this.statsService.getStats()
  }
  
  async updateStat(type: string, exp: number) {
    // 대시보드 전용 로직
    const result = await this.statsService.updateStat(type, exp)
    // 대시보드에서만 필요한 후처리
    return result
  }
  
  private getMockStats() {
    return [
      { type: 'health', level: 10, exp: 500 },
      { type: 'learning', level: 8, exp: 300 }
    ]
  }
}
```

#### 2. Feature Flag 시스템
```typescript
// lib/feature-flags/refactoring-flags.ts
export const REFACTORING_FLAGS = {
  DASHBOARD_V2: process.env.NEXT_PUBLIC_DASHBOARD_REFACTORED === 'true',
  DUNGEON_V2: process.env.NEXT_PUBLIC_DUNGEON_REFACTORED === 'true',
  AI_COACH_V2: process.env.NEXT_PUBLIC_AI_COACH_REFACTORED === 'true',
  PROFILE_V2: process.env.NEXT_PUBLIC_PROFILE_REFACTORED === 'true'
}

// .env.local
NEXT_PUBLIC_DASHBOARD_REFACTORED=false
NEXT_PUBLIC_DUNGEON_REFACTORED=false
NEXT_PUBLIC_AI_COACH_REFACTORED=false
NEXT_PUBLIC_PROFILE_REFACTORED=false
```

## 구현 가이드

### Phase 1: 대시보드 리팩토링 (우선순위: 높음)

#### 1.1 Adapter 생성
```typescript
// lib/adapters/dashboard-adapter.ts
import { StatsService } from '@/lib/services/stats-service'
import { ExperienceCalculatorService } from '@/lib/services/experience-calculator.service'

export class DashboardAdapter {
  private stats: any[] = []
  private listeners: Set<Function> = new Set()
  
  // 기존 useStats의 로직을 격리
  async loadStats() {
    try {
      const data = await fetch('/api/stats').then(r => r.json())
      this.stats = data.stats
      this.notifyListeners()
      return this.stats
    } catch (error) {
      console.error('[DashboardAdapter] Failed to load stats:', error)
      throw error
    }
  }
  
  async updateStat(type: string, exp: number, activity: string) {
    try {
      const result = await fetch('/api/stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, exp, activity })
      }).then(r => r.json())
      
      // 로컬 상태 업데이트
      this.stats = this.stats.map(stat => 
        stat.type === type ? { ...stat, ...result } : stat
      )
      
      this.notifyListeners()
      return result
    } catch (error) {
      console.error('[DashboardAdapter] Failed to update stat:', error)
      throw error
    }
  }
  
  subscribe(listener: Function) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.stats))
  }
}
```

#### 1.2 새로운 Context 생성
```typescript
// contexts/dashboard-v2/DashboardV2Context.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DashboardAdapter } from '@/lib/adapters/dashboard-adapter'

const DashboardV2Context = createContext<{
  adapter: DashboardAdapter
  stats: any[]
  loading: boolean
  error: string | null
} | undefined>(undefined)

export function DashboardV2Provider({ children }: { children: React.ReactNode }) {
  const [adapter] = useState(() => new DashboardAdapter())
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // 초기 로드
    adapter.loadStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
    
    // 구독
    return adapter.subscribe(setStats)
  }, [adapter])
  
  return (
    <DashboardV2Context.Provider value={{ adapter, stats, loading, error }}>
      {children}
    </DashboardV2Context.Provider>
  )
}

export function useDashboardV2() {
  const context = useContext(DashboardV2Context)
  if (!context) {
    throw new Error('useDashboardV2 must be used within DashboardV2Provider')
  }
  return context
}
```

#### 1.3 새 컴포넌트 생성
```typescript
// app/dashboard/DashboardClientV2.tsx
'use client'

import React from 'react'
import { DashboardV2Provider, useDashboardV2 } from '@/contexts/dashboard-v2/DashboardV2Context'
import { EnhancedVoiceInput } from '@/components/voice/EnhancedVoiceInput'

function DashboardContentV2() {
  const { adapter, stats, loading, error } = useDashboardV2()
  
  const handleVoiceInput = async (transcript: string, statType: string) => {
    await adapter.updateStat(statType, 100, transcript)
  }
  
  if (loading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error}</div>
  
  return (
    <div>
      {/* 대시보드 UI */}
      <EnhancedVoiceInput onTranscript={handleVoiceInput} />
    </div>
  )
}

export default function DashboardClientV2() {
  return (
    <DashboardV2Provider>
      <DashboardContentV2 />
    </DashboardV2Provider>
  )
}
```

#### 1.4 페이지 분기 처리
```typescript
// app/dashboard/page.tsx
import { REFACTORING_FLAGS } from '@/lib/feature-flags/refactoring-flags'
import DashboardClient from './DashboardClient'
import DashboardClientV2 from './DashboardClientV2'

export default function DashboardPage() {
  return REFACTORING_FLAGS.DASHBOARD_V2 ? <DashboardClientV2 /> : <DashboardClient />
}
```

### Phase 2: 던전 리팩토링

#### 2.1 사운드 매니저 격리
```typescript
// lib/services/dungeon-sound-manager.ts
export class DungeonSoundManager {
  private static instance: DungeonSoundManager
  private audioContext: AudioContext | null = null
  private currentBGM: HTMLAudioElement | null = null
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new DungeonSoundManager()
    }
    return this.instance
  }
  
  // 던전 전용 사운드 로직
  playDungeonBGM(type: string) {
    // 기존 BGM 정지
    this.stopBGM()
    
    // 새 BGM 재생
    this.currentBGM = new Audio(`/sounds/dungeon/${type}.mp3`)
    this.currentBGM.loop = true
    this.currentBGM.play()
  }
  
  stopBGM() {
    if (this.currentBGM) {
      this.currentBGM.pause()
      this.currentBGM = null
    }
  }
}
```

#### 2.2 던전 전용 Store
```typescript
// store/dungeon-store-v2.ts
import { create } from 'zustand'

interface DungeonStoreV2 {
  // 던전 상태
  currentDungeon: string | null
  gold: number
  items: any[]
  
  // 액션
  enterDungeon: (type: string) => void
  exitDungeon: () => void
  addGold: (amount: number) => void
  addItem: (item: any) => void
}

export const useDungeonStoreV2 = create<DungeonStoreV2>((set) => ({
  currentDungeon: null,
  gold: 0,
  items: [],
  
  enterDungeon: (type) => set({ currentDungeon: type }),
  exitDungeon: () => set({ currentDungeon: null }),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
}))
```

### Phase 3: AI 코치 리팩토링

#### 3.1 탭별 격리
```typescript
// lib/adapters/ai-coach-adapter.ts
export class AICoachAdapter {
  private tabData: Map<string, any> = new Map()
  
  async loadTabData(tabName: string) {
    // 탭별 데이터 로드 로직
    const data = await fetch(`/api/ai-coach/${tabName}`).then(r => r.json())
    this.tabData.set(tabName, data)
    return data
  }
  
  getTabData(tabName: string) {
    return this.tabData.get(tabName)
  }
}
```

### Phase 4: 프로필 리팩토링

#### 4.1 읽기 전용 Adapter
```typescript
// lib/adapters/profile-adapter.ts
export class ProfileAdapter {
  async getProfileData() {
    // 각 페이지의 공개 API를 통해 데이터 수집
    const [dashboardData, dungeonData, aiCoachData] = await Promise.all([
      fetch('/api/dashboard/summary').then(r => r.json()),
      fetch('/api/dungeon/summary').then(r => r.json()),
      fetch('/api/ai-coach/summary').then(r => r.json())
    ])
    
    return {
      stats: dashboardData.stats,
      dungeonProgress: dungeonData.progress,
      aiInsights: aiCoachData.insights
    }
  }
}
```

## 테스트 전략

### 1. 격리 테스트
```typescript
// e2e/isolated/dashboard-v2.spec.ts
import { test, expect } from '@playwright/test'

// Feature flag 활성화
test.use({
  extraHTTPHeaders: {
    'X-Feature-Dashboard-V2': 'true'
  }
})

test.describe('대시보드 V2 격리 테스트', () => {
  test('음성 입력이 첫 번째 시도에서 저장되어야 함', async ({ page }) => {
    await page.goto('/dashboard')
    // 테스트 로직
  })
})
```

### 2. Mock 모드 테스트
```typescript
// e2e/mock-mode/dashboard-mock.spec.ts
test('Mock 모드에서 대시보드 동작 확인', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('USE_MOCK_MODE', 'true')
  })
  
  await page.goto('/dashboard')
  // Mock 데이터로 테스트
})
```

### 3. 통합 테스트 (모든 페이지 완료 후)
```typescript
// e2e/integration/full-app.spec.ts
test.skip(() => !process.env.ALL_PAGES_REFACTORED, '모든 페이지 리팩토링 후 실행')

test('전체 앱 통합 테스트', async ({ page }) => {
  // 모든 페이지 간 상호작용 테스트
})
```

## 배포 전략

### 1. 단계별 배포

#### Stage 1: 개발 환경
```bash
# .env.development
NEXT_PUBLIC_DASHBOARD_REFACTORED=true
NEXT_PUBLIC_DUNGEON_REFACTORED=false
NEXT_PUBLIC_AI_COACH_REFACTORED=false
NEXT_PUBLIC_PROFILE_REFACTORED=false
```

#### Stage 2: 스테이징 환경
- 일부 테스터에게만 새 버전 노출
- 메트릭 수집 (성능, 에러율)

#### Stage 3: 프로덕션 A/B 테스트
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 10% 사용자에게 새 버전 노출
  if (Math.random() < 0.1) {
    response.cookies.set('feature-dashboard-v2', 'true')
  }
  
  return response
}
```

#### Stage 4: 전체 배포
- 모든 Feature Flag ON
- 구버전 코드 제거 (다음 릴리즈)

### 2. 롤백 계획
```bash
# 긴급 롤백 스크립트
#!/bin/bash
vercel env pull
sed -i 's/NEXT_PUBLIC_DASHBOARD_REFACTORED=true/NEXT_PUBLIC_DASHBOARD_REFACTORED=false/g' .env.production
vercel --prod
```

## 체크리스트

### 사전 준비
- [ ] Feature Flag 시스템 구현
- [ ] Adapter 패턴 기본 구조 생성
- [ ] Mock 데이터 준비
- [ ] 테스트 환경 설정

### Phase 1: 대시보드 (2일)
- [ ] DashboardAdapter 구현
- [ ] DashboardV2Context 생성
- [ ] DashboardClientV2 컴포넌트 작성
- [ ] 음성 입력 연동 확인
- [ ] 격리 테스트 작성
- [ ] Feature Flag 테스트

### Phase 2: 던전 (3일)
- [ ] DungeonSoundManager 격리
- [ ] DungeonStoreV2 구현
- [ ] 전투 시스템 마이그레이션
- [ ] BGM/효과음 테스트
- [ ] AutoBattle 연동
- [ ] 격리 테스트 작성

### Phase 3: AI 코치 (2일)
- [ ] AICoachAdapter 구현
- [ ] 탭별 격리 구조 생성
- [ ] 각 탭 마이그레이션
- [ ] Lazy loading 유지
- [ ] 격리 테스트 작성

### Phase 4: 프로필 (2일)
- [ ] ProfileAdapter 구현
- [ ] 읽기 전용 API 생성
- [ ] 데이터 집계 로직
- [ ] UI 마이그레이션
- [ ] 격리 테스트 작성

### 통합 및 배포 (2일)
- [ ] 전체 통합 테스트
- [ ] 성능 벤치마크
- [ ] 스테이징 배포
- [ ] A/B 테스트 설정
- [ ] 모니터링 대시보드
- [ ] 프로덕션 배포

## 주의사항

### 절대 하지 말아야 할 것
1. **기존 코드 직접 수정**: 항상 새 버전 생성
2. **전역 상태 공유**: 각 페이지는 독립적 상태 관리
3. **하드코딩**: 모든 설정은 환경 변수로
4. **테스트 없는 배포**: 격리 테스트 필수

### 반드시 해야 할 것
1. **백업**: 작업 전 현재 상태 백업
2. **문서화**: 변경사항 상세 기록
3. **점진적 작업**: 한 번에 하나씩
4. **팀 공유**: 진행 상황 공유

## 예상 문제 및 해결책

### 1. 데이터 동기화 문제
**문제**: 페이지 간 데이터 불일치  
**해결**: Event Bus 또는 Webhook으로 동기화

### 2. 번들 크기 증가
**문제**: Adapter 레이어로 인한 코드 중복  
**해결**: Tree shaking, Code splitting 최적화

### 3. 개발 복잡도 증가
**문제**: 두 버전 유지보수  
**해결**: 빠른 마이그레이션, 구버전 조기 제거

## 성공 지표

1. **기술적 지표**
   - 페이지 간 의존성 0
   - 단위 테스트 커버리지 80% 이상
   - 빌드 시간 30% 단축

2. **비즈니스 지표**
   - 배포 주기 50% 단축
   - 버그 발생률 70% 감소
   - 개발 속도 2배 향상

---

**다음 세션 시작 시**: 이 문서의 [체크리스트](#체크리스트)부터 확인하여 작업 시작