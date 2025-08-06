# 리팩토링 가이드 - DungeonBattleTab 컴포넌트 분리

## 개요

이 문서는 DungeonBattleTab 컴포넌트의 안전한 리팩토링 과정을 설명합니다.

## 리팩토링 전략

### 1. 안전한 리팩토링을 위한 인프라 구축

#### Phase 1: 테스트 안전망 구축
- E2E 테스트 작성으로 현재 기능 명세화
- 스크린샷/비디오로 UI 동작 문서화
- 성능 벤치마크 기록

#### Phase 2: 점진적 전환 시스템
- Feature Flag 시스템 구현
- 에러 추적 및 모니터링 시스템 구축
- Safe Guard 패턴으로 자동 폴백 기능 구현

### 2. DungeonBattleTab 컴포넌트 분리 (Phase 3)

#### 분리 전 (DungeonBattleTab.tsx - 700+ 줄)
```
DungeonBattleTab
├── 던전 선택 로직
├── 전투 관리 로직
├── 진행 상황 추적
├── 보상 처리
├── UI 렌더링
└── 상태 관리
```

#### 분리 후
```
DungeonBattleTabV2 (조정자)
├── DungeonSelector (던전 선택 UI)
├── DungeonProgress (진행 상황 UI)
├── BattleScreen (전투 UI)
└── useDungeonBattle (비즈니스 로직 Hook)
```

## 구현 상세

### 1. 컴포넌트 구조

#### DungeonSelector
- 책임: 던전 목록 표시 및 선택
- Props: `characterLevel`, `selectedDifficulty`, `onDifficultyChange`, `onDungeonSelect`
- 순수 UI 컴포넌트로 비즈니스 로직 없음

#### DungeonProgress
- 책임: 던전 진행 상황 표시
- Props: `dungeon`, `progress`, `isLoading`, `onStartBattle`, `onExit`
- 획득 골드/경험치 표시 및 전투 시작 버튼

#### BattleScreen
- 책임: 전투 화면 래핑
- Props: `battleState`, `battleManager`, `autoBattleManager`, `onExit`
- 기존 PokemonAutoBattleUI 재사용

#### useDungeonBattle (Custom Hook)
- 책임: 전투 관련 비즈니스 로직
- 전투 시작/종료 처리
- 보상 계산 및 지급
- 퀘스트 진행 업데이트
- 상태 관리

### 2. Feature Flag 통합

```typescript
// DungeonBattleTabWrapper.tsx
const SafeDungeonBattleTab = createComponentSafeGuard(
  DungeonBattleTabV2,    // 새 버전
  DungeonBattleTab,      // 기존 버전
  'use-new-dungeon-ui'   // Feature Flag 키
)
```

### 3. 점진적 롤아웃 계획

1. **개발 환경 (0%)**: 개발자만 새 버전 사용
2. **스테이징 (10%)**: 내부 테스터 대상
3. **프로덕션 (25%)**: 일부 사용자 대상
4. **프로덕션 (50%)**: 절반 사용자 대상
5. **프로덕션 (100%)**: 전체 사용자 대상

## 모니터링 지표

### 성능 지표
- 컴포넌트 로드 시간
- 전투 시작까지 소요 시간
- 메모리 사용량

### 에러 지표
- 에러 발생률
- 에러 타입별 분포
- 사용자 영향도

### 사용성 지표
- 던전 진입률
- 전투 완료율
- 이탈률

## 롤백 계획

문제 발생 시:
1. Feature Flag를 즉시 0%로 변경
2. 에러 로그 분석
3. 핫픽스 적용
4. 단계별 재배포

## 성공 기준

- ✅ 모든 기존 기능 정상 작동
- ✅ 성능 저하 없음 (±10% 이내)
- ✅ 에러율 증가 없음
- ✅ 사용자 피드백 긍정적

## 다음 단계

1. **상태 관리 통합**: Zustand 스토어 정리 및 최적화
2. **추가 컴포넌트 분리**: 다른 복잡한 컴포넌트에 동일 패턴 적용
3. **성능 최적화**: React.memo, useMemo 등 적용

## 참고 사항

- 모든 변경사항은 Feature Flag로 보호됨
- 실시간 모니터링으로 문제 즉시 감지
- Safe Guard 패턴으로 자동 폴백 지원
- 기존 코드는 완전히 제거하기 전까지 유지