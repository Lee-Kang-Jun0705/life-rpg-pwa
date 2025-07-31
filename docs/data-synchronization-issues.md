# 데이터 동기화 문제 분석 및 해결 방안

## 현재 발견된 문제점

### 1. 레벨/경험치 계산 불일치
- **문제**: 대시보드의 calculateLevel과 던전의 레벨 계산이 다른 로직 사용
- **위치**: 
  - `lib/types/dashboard.ts` - calculateLevel() 함수
  - `lib/utils/stat-calculator.ts` - calculateLevelFromExperience() 함수
- **영향**: 같은 경험치에 대해 다른 레벨 표시 가능

### 2. 프로필 레벨과 스탯 레벨 분리
- **문제**: UserProfile의 level 필드와 개별 스탯의 level이 독립적으로 관리됨
- **위치**: 
  - `profiles` 테이블의 level
  - `stats` 테이블의 각 스탯별 level
- **영향**: 던전에서 보이는 레벨과 대시보드 스탯 레벨이 다를 수 있음

### 3. 경험치 저장 방식 불일치
- **문제**: 총 경험치 vs 현재 레벨 경험치 혼용
- **현황**:
  - 대시보드: 각 스탯의 총 경험치 저장
  - 던전: 프로필의 경험치 필드 부재 (레벨만 저장)
- **영향**: 레벨업 시 경험치 진행도가 리셋되거나 잘못 표시될 수 있음

### 4. 실시간 동기화 부재
- **문제**: 한 페이지에서 변경한 데이터가 다른 페이지에 즉시 반영되지 않음
- **원인**: 각 페이지가 독립적으로 데이터를 로드하고 캐싱
- **영향**: 사용자가 페이지 간 이동 시 데이터 불일치 경험

## 해결 방안

### 1. 레벨 계산 로직 통합
```typescript
// lib/types/dashboard.ts의 calculateLevel을 삭제하고
// 모든 곳에서 stat-calculator.ts의 함수 사용

import { calculateLevelFromExperience } from '@/lib/utils/stat-calculator'

// 사용 예시
const { level, currentExp } = calculateLevelFromExperience(totalExp)
```

### 2. 프로필 스키마 업데이트
```typescript
// UserProfile 인터페이스에 경험치 필드 추가
interface UserProfile {
  // ... 기존 필드
  level: number
  totalExperience: number  // 추가
  currentExperience: number  // 추가
}
```

### 3. 중앙 상태 관리 시스템 구현
```typescript
// lib/services/game-state.service.ts
class GameStateService {
  private listeners: Map<string, Set<() => void>> = new Map()
  
  async updateLevel(userId: string, exp: number) {
    // 1. DB 업데이트
    await dbHelpers.updateProfile(userId, {
      totalExperience: exp,
      level: calculateLevelFromExperience(exp).level,
      currentExperience: calculateLevelFromExperience(exp).currentExp
    })
    
    // 2. 리스너들에게 알림
    this.notifyListeners('profile')
  }
  
  subscribe(key: string, callback: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)
  }
}
```

### 4. 데이터 로더 개선
```typescript
// hooks/useGameData.ts
export function useGameData() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  useEffect(() => {
    // 초기 로드
    loadProfile()
    
    // 변경 사항 구독
    gameStateService.subscribe('profile', loadProfile)
    
    return () => {
      gameStateService.unsubscribe('profile', loadProfile)
    }
  }, [])
  
  return { profile }
}
```

## 즉시 적용 가능한 개선사항

### 1. HeroSection 경험치 표시 수정
현재 `experienceToNext`만 표시하고 있어 현재 경험치 진행도가 보이지 않음.

### 2. 데이터베이스 마이그레이션
- profiles 테이블에 totalExperience, currentExperience 필드 추가
- 기존 사용자 데이터 마이그레이션 스크립트 필요

### 3. 캐시 무효화 전략
- 데이터 변경 시 관련 캐시 즉시 무효화
- 페이지 포커스 시 데이터 재로드

## 우선순위

1. **높음**: 레벨 계산 로직 통합 (즉시 수정 가능)
2. **높음**: 프로필 경험치 필드 추가 및 마이그레이션
3. **중간**: 실시간 동기화 시스템 구현
4. **낮음**: 전체 상태 관리 시스템 도입 (큰 리팩토링 필요)