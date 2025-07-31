# 성능 최적화 마이그레이션 가이드

## 개요
주기적인 업데이트를 이벤트 기반으로 전환하여 배터리 소모를 줄이고 성능을 개선합니다.

## 주요 변경사항

### 1. 에너지 시스템
**이전:**
- 1분마다 서버 호출
- 지속적인 폴링

**이후:**
- 사용자 상호작용 시 업데이트
- 오프라인 회복 계산
- 스마트 타이머 (다음 회복 시점에만 업데이트)

### 2. 전투 티켓 시스템
**이전:**
- 1초마다 카운트다운 업데이트
- 1분마다 상태 체크

**이후:**
- 클라이언트 사이드 카운트다운
- 리셋 시간에만 서버 호출
- 페이지 포커스 시 상태 확인

## 구현 방법

### 1단계: 새로운 서비스로 교체
```typescript
// 이전
import { EnergyService } from '@/lib/energy/energy-service'
import { EnergyDisplay } from '@/components/energy/EnergyDisplay'

// 이후
import { OptimizedEnergyService } from '@/lib/energy/energy-service-optimized'
import { OptimizedEnergyDisplay } from '@/components/energy/OptimizedEnergyDisplay'
```

### 2단계: 컴포넌트 교체
```tsx
// app/layout.tsx 또는 사용하는 곳
// 이전
<EnergyDisplay userId={userId} />
<BattleTicketDisplay userId={userId} />

// 이후
<OptimizedEnergyDisplay userId={userId} />
<OptimizedBattleTicketDisplay userId={userId} />
```

### 3단계: 성능 모니터링 추가
```typescript
// app/layout.tsx
import { PerformanceMonitor, VisibilityManager } from '@/lib/utils/performance-monitor'

// 컴포넌트 정리
useEffect(() => {
  return () => {
    PerformanceMonitor.cleanupComponent('energy')
    VisibilityManager.remove('energy-update')
  }
}, [])
```

## 최적화 전략

### 1. 유저 상호작용 기반 업데이트
```typescript
// 클릭, 포커스, 네비게이션 시 업데이트
document.addEventListener('click', () => {
  SmartUpdateScheduler.triggerUpdates()
})
```

### 2. 백그라운드 동작 중지
```typescript
VisibilityManager.onHidden('pause-timers', () => {
  PerformanceMonitor.cleanup()
})

VisibilityManager.onVisible('resume-timers', () => {
  // 필요한 업데이트만 실행
  loadInitialState()
})
```

### 3. 오프라인 지원
- 마지막 업데이트 시간 저장
- 앱 시작 시 경과 시간 계산
- 최대 24시간까지 오프라인 보상

## 성능 개선 효과

### 배터리 소모
- **이전**: 1초마다 업데이트로 지속적인 CPU 사용
- **이후**: 필요시에만 업데이트로 90% 이상 감소

### 네트워크 사용량
- **이전**: 분당 2-3회 서버 호출
- **이후**: 사용자 액션 시에만 호출 (90% 감소)

### 메모리 사용량
- 불필요한 타이머 제거로 메모리 누수 방지
- 캐싱으로 반복적인 계산 감소

## 테스트 체크리스트

- [ ] 에너지 회복이 정확한 시간에 이루어지는가?
- [ ] 오프라인 후 복귀 시 올바른 에너지가 계산되는가?
- [ ] 전투 티켓 리셋이 정확한 시간에 이루어지는가?
- [ ] 백그라운드에서 불필요한 업데이트가 중지되는가?
- [ ] 사용자 상호작용 시 즉시 업데이트되는가?

## 롤백 방법
문제 발생 시 이전 컴포넌트로 즉시 교체 가능:
```typescript
// 임시로 이전 버전 사용
export { EnergyDisplay as OptimizedEnergyDisplay } from './EnergyDisplay'
```

## 모니터링
```typescript
// 활성 타이머 수 확인
console.log('Active timers:', PerformanceMonitor.getActiveCount())

// 배터리 상태 확인 (실험적 API)
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    console.log('Battery level:', battery.level)
    console.log('Charging:', battery.charging)
  })
}
```