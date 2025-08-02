import { test, expect } from '@playwright/test'

test.describe('모험 페이지 통합 테스트', () => {
  test.beforeEach(async({ page }) => {
    await page.goto('http://localhost:3001/dungeon')
  })

  test('모험 페이지가 올바르게 로드되어야 함', async({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("모험 & 성장")')).toBeVisible()

    // 히어로 섹션 확인
    const heroSection = page.locator('[class*="HeroSection"]').first()
    await expect(heroSection).toBeVisible()

    // 캐릭터 정보 확인
    await expect(page.locator('text=모험가')).toBeVisible()
    await expect(page.locator('text=Lv.')).toBeVisible()
  })

  test('탭 네비게이션이 제대로 작동해야 함', async({ page }) => {
    // 모든 탭이 표시되는지 확인
    const tabs = ['일일', '던전', '상점', '장비', '스킬', '도감', '업적', '기록']

    for (const tab of tabs) {
      await expect(page.locator(`[data-testid="ai-coach-tab-${tab.toLowerCase()}"]`)).toBeVisible()
    }

    // 던전 탭 클릭
    await page.click('[data-testid="ai-coach-tab-dungeon"]')
    await expect(page.locator('[data-testid="ai-coach-content-dungeon"]')).toBeVisible()

    // 상점 탭 클릭
    await page.click('[data-testid="ai-coach-tab-shop"]')
    await expect(page.locator('[data-testid="ai-coach-content-shop"]')).toBeVisible()
  })

  test('히어로 섹션에 캐릭터 스탯이 표시되어야 함', async({ page }) => {
    // 스탯 카드들 확인
    await expect(page.locator('text=공격력')).toBeVisible()
    await expect(page.locator('text=방어력')).toBeVisible()
    await expect(page.locator('text=체력')).toBeVisible()
    await expect(page.locator('text=마나')).toBeVisible()
    await expect(page.locator('text=에너지')).toBeVisible()
    await expect(page.locator('text=전투력')).toBeVisible()

    // 경험치 바 확인
    await expect(page.locator('text=EXP')).toBeVisible()
  })

  test('던전 탭에서 개선된 던전 리스트가 표시되어야 함', async({ page }) => {
    // 던전 탭으로 이동
    await page.click('[data-testid="ai-coach-tab-dungeon"]')

    // 던전 헤더 확인
    await expect(page.locator('h1:has-text("던전 탐험")')).toBeVisible()
    await expect(page.locator('text=위험과 보상이 기다리는 던전을 탐험하세요')).toBeVisible()

    // 카테고리 필터 확인
    await expect(page.locator('button:has-text("🎯 전체")')).toBeVisible()
    await expect(page.locator('button:has-text("📖 스토리")')).toBeVisible()
    await expect(page.locator('button:has-text("📅 일일")')).toBeVisible()

    // 던전 카드 확인
    const dungeonCards = page.locator('[data-testid="dungeon-card"]')
    await expect(dungeonCards.first()).toBeVisible()

    // 난이도 별 표시 확인
    await expect(page.locator('[class*="Star"]').first()).toBeVisible()
  })

  test('상점 탭에서 NPC 상인 시스템이 작동해야 함', async({ page }) => {
    // 상점 탭으로 이동
    await page.click('[data-testid="ai-coach-tab-shop"]')

    // 로딩 대기
    await page.waitForSelector('text=마법 상점가', { timeout: 10000 })

    // 상점 헤더 확인
    await expect(page.locator('h2:has-text("마법 상점가")')).toBeVisible()

    // NPC 상인 목록 확인
    await expect(page.locator('text=일반 상인 토비')).toBeVisible()
    await expect(page.locator('text=대장장이 브론')).toBeVisible()
    await expect(page.locator('text=물약상인 엘리나')).toBeVisible()
    await expect(page.locator('text=신비한 상인 루나')).toBeVisible()

    // 골드 표시 확인
    await expect(page.locator('[class*="Coins"]').first()).toBeVisible()
  })

  test('장비 탭에서 캐릭터 프리뷰가 표시되어야 함', async({ page }) => {
    // 장비 탭으로 이동
    await page.click('[data-testid="ai-coach-tab-equipment"]')

    // 장비 관리 헤더 확인
    await expect(page.locator('h1:has-text("장비 관리")')).toBeVisible()

    // 캐릭터 프리뷰 영역 확인
    await expect(page.locator('h2:has-text("캐릭터")')).toBeVisible()

    // 회전 컨트롤 확인
    await expect(page.locator('button:has-text("정면")')).toBeVisible()

    // 장비 슬롯 확인
    await expect(page.locator('h2:has-text("장비 슬롯")')).toBeVisible()
    await expect(page.locator('text=무기')).toBeVisible()
    await expect(page.locator('text=갑옷')).toBeVisible()
    await expect(page.locator('text=액세서리')).toBeVisible()
  })

  test('스킬 탭이 제대로 통합되어야 함', async({ page }) => {
    // 스킬 탭으로 이동
    await page.click('[data-testid="ai-coach-tab-skills"]')

    // 스킬 화면이 로드되는지 확인
    await expect(page.locator('[class*="SkillScreen"]').first()).toBeVisible()
  })

  test('도감 탭에서 갤러리 뷰가 작동해야 함', async({ page }) => {
    // 도감 탭으로 이동
    await page.click('[data-testid="ai-coach-tab-collection"]')

    // 컬렉션 헤더 확인
    await expect(page.locator('h1:has-text("컬렉션")')).toBeVisible()
    await expect(page.locator('text=수집한 아이템과 업적을 확인하세요')).toBeVisible()

    // 카테고리 카드 확인
    await expect(page.locator('text=전체')).toBeVisible()
    await expect(page.locator('text=무기')).toBeVisible()
    await expect(page.locator('text=방어구')).toBeVisible()

    // 검색 기능 확인
    await expect(page.locator('input[placeholder="아이템 검색..."]')).toBeVisible()

    // 보기 모드 전환 버튼 확인
    await expect(page.locator('button:has-text("수집한 것만")')).toBeVisible()
  })

  test('탭 전환 시 애니메이션이 작동해야 함', async({ page }) => {
    // 던전 탭에서 상점 탭으로 전환
    await page.click('[data-testid="ai-coach-tab-dungeon"]')
    await page.click('[data-testid="ai-coach-tab-shop"]')

    // 애니메이션 완료 대기
    await page.waitForTimeout(500)

    // 상점 콘텐츠가 표시되는지 확인
    await expect(page.locator('[data-testid="ai-coach-content-shop"]')).toBeVisible()
  })

  test('모바일 반응형 디자인이 작동해야 함', async({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 })

    // 모바일 하단 탭바가 표시되는지 확인
    const mobileTabBar = page.locator('[class*="md:hidden"]').filter({ hasText: '일일' })
    await expect(mobileTabBar).toBeVisible()

    // 모바일 탭 클릭
    await page.click('[data-testid="ai-coach-mobile-tab-dungeon"]')
    await expect(page.locator('[data-testid="ai-coach-content-dungeon"]')).toBeVisible()
  })
})

test.describe('개별 컴포넌트 상호작용 테스트', () => {
  test.beforeEach(async({ page }) => {
    await page.goto('http://localhost:3001/dungeon')
  })

  test('던전 카드 호버 효과가 작동해야 함', async({ page }) => {
    await page.click('[data-testid="ai-coach-tab-dungeon"]')

    // 첫 번째 던전 카드에 호버
    const dungeonCard = page.locator('[data-testid="dungeon-card"]').first()
    await dungeonCard.hover()

    // 호버 시 추가 정보가 표시되는지 확인 (예상 소요시간 등)
    await expect(page.locator('text=예상 소요시간').first()).toBeVisible()
  })

  test('상점에서 상인 전환이 작동해야 함', async({ page }) => {
    await page.click('[data-testid="ai-coach-tab-shop"]')
    await page.waitForSelector('text=마법 상점가')

    // 대장장이 클릭
    await page.click('text=대장장이 브론')

    // 대장장이 인사말이 표시되는지 확인
    await expect(page.locator('text=최고급 장비들을 준비했습니다')).toBeVisible()
  })

  test('장비 슬롯 클릭 시 확장되어야 함', async({ page }) => {
    await page.click('[data-testid="ai-coach-tab-equipment"]')

    // 무기 슬롯 클릭
    const weaponSlot = page.locator('text=무기').locator('..')
    await weaponSlot.click()

    // 보유 무기 섹션이 표시되는지 확인
    await expect(page.locator('text=보유 무기')).toBeVisible()
  })

  test('컬렉션에서 검색이 작동해야 함', async({ page }) => {
    await page.click('[data-testid="ai-coach-tab-collection"]')

    // 검색어 입력
    await page.fill('input[placeholder="아이템 검색..."]', '철검')

    // 검색 결과가 필터링되는지 확인 (테스트 환경에 따라 조정 필요)
    const items = page.locator('[class*="grid"] > div')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('성능 및 로딩 테스트', () => {
  test('페이지 로딩 시간이 적절해야 함', async({ page }) => {
    const startTime = Date.now()
    await page.goto('http://localhost:3001/dungeon')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000)
  })

  test('탭 전환이 빠르게 이루어져야 함', async({ page }) => {
    await page.goto('http://localhost:3001/dungeon')

    const tabs = ['dungeon', 'shop', 'equipment', 'collection']

    for (const tab of tabs) {
      const startTime = Date.now()
      await page.click(`[data-testid="ai-coach-tab-${tab}"]`)
      await page.waitForSelector(`[data-testid="ai-coach-content-${tab}"]`)
      const switchTime = Date.now() - startTime

      // 탭 전환은 500ms 이내에 완료되어야 함
      expect(switchTime).toBeLessThan(500)
    }
  })
})
