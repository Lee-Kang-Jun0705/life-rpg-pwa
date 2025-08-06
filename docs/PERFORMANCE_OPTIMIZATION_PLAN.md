# Life RPG PWA 성능 최적화 계획

## 1. 대시보드 페이지 최적화 (긴급)

### 현재 문제점
- 로딩 시간: 8.7초 (목표: 2초 이내)
- 원인: 순차적인 DB 호출, 매번 중복 체크, 초기화 로직

### 즉시 적용 가능한 개선사항

#### 1.1 병렬 데이터 로딩
```typescript
// 현재: 순차적 로딩
const profile = await dbHelpers.getProfile(userId)
const stats = await dbHelpers.getStats(userId)

// 개선: 병렬 로딩
const [profile, stats] = await Promise.all([
  dbHelpers.getProfile(userId),
  dbHelpers.getStats(userId)
])
```

#### 1.2 중복 체크 최적화
- 중복 체크를 초기 설정 시 한 번만 수행
- 로컬 스토리지에 체크 완료 플래그 저장

#### 1.3 레이지 로딩 적용
- 음성 입력 컴포넌트는 이미 적용됨
- 추가 무거운 컴포넌트 식별 후 적용

## 2. 스킬/인벤토리 페이지 최적화

### 현재 문제점
- 스킬: 3.8초 로딩
- 인벤토리: 3.0초 로딩

### 개선 방안

#### 2.1 가상 스크롤링
```typescript
// react-window 사용
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  )}
</FixedSizeList>
```

#### 2.2 이미지 최적화
- WebP 포맷 사용
- 레이지 로딩 적용
- 적절한 크기로 리사이징

## 3. 탭 전환 성능 개선

### 현재 문제점
- 일부 탭 전환 시 타임아웃 (60초)
- 모바일에서 특히 심각

### 개선 방안

#### 3.1 탭 컨텐츠 프리로딩
```typescript
// 현재 탭 근처의 탭들을 미리 로드
const preloadNearbyTabs = (currentIndex: number) => {
  const prevIndex = Math.max(0, currentIndex - 1)
  const nextIndex = Math.min(tabs.length - 1, currentIndex + 1)
  
  // 이전/다음 탭 컨텐츠 프리로드
  preloadTab(prevIndex)
  preloadTab(nextIndex)
}
```

#### 3.2 애니메이션 최적화
- CSS transform 사용 (GPU 가속)
- will-change 속성 활용
- 복잡한 애니메이션 단순화

## 4. 번들 크기 최적화

### 분석 도구 실행
```bash
npm run analyze
```

### 예상 개선사항
- 사용하지 않는 의존성 제거
- Tree shaking 최적화
- 동적 import 확대 적용

## 5. 구현 우선순위

### Phase 1 (즉시 - 1일)
1. 대시보드 병렬 로딩 구현
2. 중복 체크 최적화
3. 불필요한 리렌더링 방지

### Phase 2 (단기 - 3일)
1. 가상 스크롤링 구현
2. 이미지 최적화
3. 탭 프리로딩

### Phase 3 (중기 - 1주)
1. 전체 번들 최적화
2. Service Worker 구현
3. 캐싱 전략 수립

## 6. 성능 목표

### 최종 목표
- 모든 페이지 2초 이내 로딩
- 탭 전환 300ms 이내
- FPS 60 유지
- 번들 크기 30% 감소

### 측정 방법
- Playwright 성능 테스트 지속 실행
- Lighthouse CI 도입
- 실사용자 모니터링 (RUM) 구현

## 7. 즉시 실행 가능한 Quick Win

1. **대시보드 병렬 로딩**: 예상 개선 50% (8.7초 → 4.3초)
2. **중복 체크 캐싱**: 예상 개선 20% (4.3초 → 3.4초)
3. **불필요한 초기화 제거**: 예상 개선 30% (3.4초 → 2.4초)

총 예상 개선: 8.7초 → 2.4초 (72% 개선)