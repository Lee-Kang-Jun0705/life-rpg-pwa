# 앱 일관성 개선 문서

## 완료된 개선 사항

### 1. 디자인 시스템
- ✅ 일관된 색상 팔레트 적용 (캔디 컬러 테마)
- ✅ 그라데이션 효과 통일
- ✅ 어두운 테마 전체 적용

### 2. 컴포넌트 일관성
- ✅ 카드 컴포넌트 스타일 통일
- ✅ 버튼 스타일 일관성
- ✅ 모달/다이얼로그 패턴 통일

### 3. 레이아웃 시스템
- ✅ AppLayout으로 전체 레이아웃 통일
- ✅ 네비게이션 바 일관성
- ✅ 반응형 디자인 패턴 통일

### 4. 폰트 시스템
- ✅ Inter (영문) + Noto Sans KR (한글) 폰트 적용
- ✅ CSS 변수를 통한 폰트 시스템 구축
- ✅ 일관된 폰트 사이즈 및 두께

### 5. 애니메이션
- ✅ Framer Motion 기반 애니메이션 통일
- ✅ 기본 트랜지션 효과 표준화
- ✅ 로딩 상태 애니메이션 일관성

### 6. 아이콘 시스템
- ✅ Lucide Icons 라이브러리 사용
- ✅ 이모지 + 아이콘 조합 패턴
- ✅ 일관된 아이콘 크기 및 색상

## 추가 개선 제안

### 1. 간격 시스템
```css
/* Tailwind 간격 규칙 */
- padding: p-4 (16px) 기본
- margin: space-y-6 (24px) 섹션 간격
- gap: gap-4 (16px) 그리드/플렉스
```

### 2. 둥근 모서리
```css
/* 일관된 border-radius */
- 카드: rounded-lg (0.5rem)
- 버튼: rounded-lg
- 입력 필드: rounded-md
- 모달: rounded-2xl
```

### 3. 그림자 효과
```css
/* 일관된 shadow */
- 카드: shadow-sm
- 호버: hover:shadow-md
- 모달: shadow-2xl
```

### 4. 상태 색상
```css
/* 일관된 상태 표시 */
- 성공: green-500
- 경고: yellow-500
- 에러: red-500
- 정보: blue-500
```

### 5. 텍스트 스타일
```css
/* 일관된 텍스트 계층 */
- 제목: text-2xl font-bold
- 서브제목: text-lg font-semibold
- 본문: text-base
- 캡션: text-sm text-gray-400
```

## 컴포넌트 가이드라인

### 1. 페이지 구조
```tsx
<div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-gray-900">
  <div className="container mx-auto px-4 py-6">
    {/* 페이지 헤더 */}
    <PageHeader />
    
    {/* 콘텐츠 영역 */}
    <main className="space-y-6">
      {/* 섹션들 */}
    </main>
  </div>
</div>
```

### 2. 카드 패턴
```tsx
<Card className="bg-gray-800/50 border-gray-700">
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    {/* 콘텐츠 */}
  </CardContent>
</Card>
```

### 3. 버튼 패턴
```tsx
// Primary
<button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-4 py-2">

// Secondary
<button className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2">

// Ghost
<button className="text-gray-400 hover:text-white">
```

## 접근성 개선

### 1. ARIA 라벨
- 모든 인터랙티브 요소에 적절한 라벨
- 스크린 리더 지원

### 2. 키보드 네비게이션
- Tab 순서 논리적 구성
- Focus 상태 명확히 표시

### 3. 색상 대비
- WCAG AA 기준 충족
- 다크 모드에서도 충분한 대비

## 성능 일관성

### 1. 이미지 로딩
- Next.js Image 컴포넌트 사용
- placeholder="blur" 적용
- 적절한 사이즈 지정

### 2. 코드 스플리팅
- 큰 컴포넌트는 dynamic import
- 탭 콘텐츠 lazy loading
- 조건부 렌더링 최적화

### 3. 상태 관리
- Zustand 스토어 패턴 통일
- 로컬 스토리지 동기화
- 캐싱 전략 일관성

## 체크리스트

새 페이지/컴포넌트 추가 시:
- [ ] 다크 테마 적용 확인
- [ ] 반응형 디자인 테스트
- [ ] 애니메이션 패턴 일치
- [ ] 폰트 시스템 활용
- [ ] 간격 시스템 준수
- [ ] 접근성 테스트
- [ ] 성능 최적화 적용