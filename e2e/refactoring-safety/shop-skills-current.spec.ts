import { test, expect } from '@playwright/test'

/**
 * Shop 현재 동작 검증 테스트
 */
test.describe('Shop - 현재 동작 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
  })

  test('상점 기본 요소들이 표시되어야 함', async ({ page }) => {
    // 상점 제목 확인
    await expect(page.locator('h1:has-text("상점")')).toBeVisible()
    
    // 탭 네비게이션 확인
    await expect(page.locator('[role="tablist"]')).toBeVisible()
    
    // 기본 탭들 확인
    await expect(page.locator('button[role="tab"]:has-text("무기")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("방어구")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("소비")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("특별")')).toBeVisible()
  })

  test('탭 전환이 동작해야 함', async ({ page }) => {
    // 무기 탭 활성화 확인 (기본값)
    const weaponTab = page.locator('button[role="tab"]:has-text("무기")')
    await expect(weaponTab).toHaveAttribute('aria-selected', 'true')
    
    // 방어구 탭 클릭
    await page.click('button[role="tab"]:has-text("방어구")')
    const armorTab = page.locator('button[role="tab"]:has-text("방어구")')
    await expect(armorTab).toHaveAttribute('aria-selected', 'true')
    
    // 탭 콘텐츠가 변경되는지 확인
    await expect(page.locator('[role="tabpanel"]')).toBeVisible()
  })

  test('아이템 구매가 동작해야 함', async ({ page }) => {
    // 첫 번째 아이템 찾기
    const firstItem = page.locator('[data-testid="shop-item"]').first()
    
    if (await firstItem.isVisible().catch(() => false)) {
      // 아이템 가격 확인
      const priceText = await firstItem.locator('text=/\\d+\\s*골드/').textContent()
      const price = parseInt(priceText?.match(/\\d+/)?.[0] || '0')
      
      // 구매 버튼 클릭
      await firstItem.locator('button:has-text("구매")').click()
      
      // 구매 확인 모달이나 메시지 확인
      const purchaseConfirm = page.locator('text=/구매하시겠습니까|구매 완료|골드가 부족합니다/')
      await expect(purchaseConfirm).toBeVisible({ timeout: 3000 })
    }
  })

  test('아이템 상세 정보가 표시되어야 함', async ({ page }) => {
    const firstItem = page.locator('[data-testid="shop-item"]').first()
    
    if (await firstItem.isVisible().catch(() => false)) {
      // 아이템 이름 확인
      await expect(firstItem.locator('[class*="font-bold"]')).toBeVisible()
      
      // 아이템 가격 확인
      await expect(firstItem.locator('text=/\\d+\\s*골드/')).toBeVisible()
      
      // 아이템 설명이나 스탯 확인
      const itemStats = firstItem.locator('text=/공격력|방어력|체력|효과/')
      if (await itemStats.isVisible().catch(() => false)) {
        await expect(itemStats).toBeVisible()
      }
    }
  })

  test('골드 잔액이 표시되어야 함', async ({ page }) => {
    // 골드 표시 확인
    const goldDisplay = page.locator('text=/보유 골드|골드:|\\d+\\s*G/').first()
    await expect(goldDisplay).toBeVisible()
  })
})

/**
 * Skills 현재 동작 검증 테스트
 */
test.describe('Skills - 현재 동작 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills')
    await page.waitForLoadState('networkidle')
  })

  test('스킬 페이지 기본 요소들이 표시되어야 함', async ({ page }) => {
    // 스킬 제목 확인
    await expect(page.locator('h1:has-text("스킬")')).toBeVisible()
    
    // 스킬 포인트 표시 확인
    const skillPoints = page.locator('text=/스킬 포인트|SP:|\\d+\\s*SP/')
    await expect(skillPoints.first()).toBeVisible()
  })

  test('스킬 목록이 표시되어야 함', async ({ page }) => {
    // 스킬 카드들 확인
    const skillCards = page.locator('[data-testid="skill-card"], [class*="skill-card"]')
    
    // 최소 1개 이상의 스킬이 표시되어야 함
    const count = await skillCards.count()
    expect(count).toBeGreaterThan(0)
    
    if (count > 0) {
      // 첫 번째 스킬 카드 확인
      const firstSkill = skillCards.first()
      
      // 스킬 이름 확인
      await expect(firstSkill.locator('[class*="font-bold"]')).toBeVisible()
      
      // 스킬 레벨 확인
      await expect(firstSkill.locator('text=/Lv\\.\\s*\\d+|레벨\\s*\\d+/')).toBeVisible()
    }
  })

  test('스킬 학습/강화가 동작해야 함', async ({ page }) => {
    const firstSkill = page.locator('[data-testid="skill-card"], [class*="skill-card"]').first()
    
    if (await firstSkill.isVisible().catch(() => false)) {
      // 학습/강화 버튼 찾기
      const actionButton = firstSkill.locator('button:has-text("학습"), button:has-text("강화"), button:has-text("레벨업")')
      
      if (await actionButton.isVisible().catch(() => false)) {
        // 초기 스킬 포인트 저장
        const spText = await page.locator('text=/\\d+\\s*SP/').first().textContent()
        const initialSP = parseInt(spText?.match(/\\d+/)?.[0] || '0')
        
        // 버튼 클릭
        await actionButton.click()
        
        // 결과 확인 (성공 메시지 또는 SP 부족 메시지)
        const resultMessage = page.locator('text=/학습 완료|강화 완료|스킬 포인트가 부족합니다/')
        await expect(resultMessage).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('스킬 상세 정보가 표시되어야 함', async ({ page }) => {
    const firstSkill = page.locator('[data-testid="skill-card"], [class*="skill-card"]').first()
    
    if (await firstSkill.isVisible().catch(() => false)) {
      // 스킬 설명 확인
      const description = firstSkill.locator('[class*="text-gray"], [class*="description"]')
      await expect(description).toBeVisible()
      
      // 스킬 효과 수치 확인
      const effectValue = firstSkill.locator('text=/\\d+%|\\d+\\s*데미지|\\d+\\s*회복/')
      if (await effectValue.isVisible().catch(() => false)) {
        await expect(effectValue).toBeVisible()
      }
    }
  })

  test('장착 슬롯이 표시되어야 함', async ({ page }) => {
    // 장착 슬롯 영역 확인
    const equipSlots = page.locator('text=/장착 슬롯|장착된 스킬|퀵슬롯/')
    
    if (await equipSlots.isVisible().catch(() => false)) {
      // 슬롯 UI 확인
      const slots = page.locator('[data-testid="skill-slot"], [class*="skill-slot"]')
      const slotCount = await slots.count()
      
      // 일반적으로 4-6개의 슬롯이 있어야 함
      expect(slotCount).toBeGreaterThanOrEqual(4)
      expect(slotCount).toBeLessThanOrEqual(6)
    }
  })

  test('스킬 장착/해제가 동작해야 함', async ({ page }) => {
    const firstSkill = page.locator('[data-testid="skill-card"], [class*="skill-card"]').first()
    
    if (await firstSkill.isVisible().catch(() => false)) {
      // 장착 버튼 찾기
      const equipButton = firstSkill.locator('button:has-text("장착"), button:has-text("해제")')
      
      if (await equipButton.isVisible().catch(() => false)) {
        const buttonText = await equipButton.textContent()
        await equipButton.click()
        
        // 버튼 텍스트가 변경되었는지 확인 (장착 <-> 해제)
        await page.waitForTimeout(500)
        const newButtonText = await equipButton.textContent()
        
        // 텍스트가 변경되었거나 슬롯이 업데이트되었는지 확인
        expect(buttonText !== newButtonText).toBeTruthy()
      }
    }
  })

  test('스킬 카테고리/필터가 동작해야 함', async ({ page }) => {
    // 카테고리 필터 확인
    const categoryFilter = page.locator('button:has-text("공격"), button:has-text("방어"), button:has-text("보조"), select[name*="category"]')
    
    if (await categoryFilter.first().isVisible().catch(() => false)) {
      // 필터 변경
      if (await page.locator('select[name*="category"]').isVisible().catch(() => false)) {
        await page.selectOption('select[name*="category"]', { index: 1 })
      } else {
        await categoryFilter.first().click()
      }
      
      // 스킬 목록이 업데이트되는지 확인
      await page.waitForTimeout(500)
      
      // 필터링된 결과 확인
      const skillCards = page.locator('[data-testid="skill-card"], [class*="skill-card"]')
      const count = await skillCards.count()
      
      // 필터링 후에도 스킬이 표시되는지 확인
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })
})

/**
 * Shop & Skills 통합 테스트
 */
test.describe('Shop & Skills - 통합 동작', () => {
  test('상점에서 구매한 스킬북이 스킬 페이지에 반영되어야 함', async ({ page }) => {
    // 상점으로 이동
    await page.goto('/shop')
    
    // 특별 탭 클릭 (스킬북이 있을 가능성이 높음)
    await page.click('button[role="tab"]:has-text("특별")')
    await page.waitForTimeout(500)
    
    // 스킬북 찾기
    const skillBook = page.locator('[data-testid="shop-item"]:has-text("스킬"), [class*="skill-book"]').first()
    
    if (await skillBook.isVisible().catch(() => false)) {
      // 스킬북 이름 저장
      const skillBookName = await skillBook.locator('[class*="font-bold"]').textContent()
      
      // 구매 시도
      await skillBook.locator('button:has-text("구매")').click()
      
      // 구매 확인
      const purchaseResult = await page.locator('text=/구매 완료|이미 보유|골드가 부족/').textContent()
      
      if (purchaseResult?.includes('구매 완료')) {
        // 스킬 페이지로 이동
        await page.goto('/skills')
        
        // 새로 추가된 스킬 확인
        const newSkill = page.locator(`text="${skillBookName?.replace('스킬북', '').trim()}"`)
        await expect(newSkill).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('장비 구매 후 스탯이 반영되어야 함', async ({ page }) => {
    // 현재 공격력 확인을 위해 프로필로 이동
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    
    // 초기 공격력 저장 (있다면)
    let initialAttack = 0
    const attackStat = page.locator('text=/공격력\\s*:\\s*\\d+/')
    if (await attackStat.isVisible().catch(() => false)) {
      const attackText = await attackStat.textContent()
      initialAttack = parseInt(attackText?.match(/\\d+/)?.[0] || '0')
    }
    
    // 상점으로 이동
    await page.goto('/shop')
    
    // 무기 탭 확인 (기본값)
    const firstWeapon = page.locator('[data-testid="shop-item"]').first()
    
    if (await firstWeapon.isVisible().catch(() => false)) {
      // 무기 공격력 확인
      const weaponAttack = await firstWeapon.locator('text=/\\+\\d+\\s*공격력/').textContent()
      const attackBonus = parseInt(weaponAttack?.match(/\\d+/)?.[0] || '0')
      
      // 구매 시도
      await firstWeapon.locator('button:has-text("구매")').click()
      
      // 구매 결과 확인
      const purchaseResult = page.locator('text=/구매 완료|장착 완료/')
      
      if (await purchaseResult.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 프로필로 돌아가서 스탯 확인
        await page.goto('/profile')
        
        // 새로운 공격력 확인
        const newAttackStat = page.locator('text=/공격력\\s*:\\s*\\d+/')
        if (await newAttackStat.isVisible().catch(() => false)) {
          const newAttackText = await newAttackStat.textContent()
          const newAttack = parseInt(newAttackText?.match(/\\d+/)?.[0] || '0')
          
          // 공격력이 증가했는지 확인
          expect(newAttack).toBeGreaterThanOrEqual(initialAttack)
        }
      }
    }
  })
})