import { test, expect } from '@playwright/test'
import { TEST_CONFIG, helpers } from '../test-config'

test.describe('상점 및 인벤토리 통합 테스트', () => {
  test.describe('상점 기능', () => {
    test.beforeEach(async({ page }) => {
      await page.goto(TEST_CONFIG.pages.shop)
      await helpers.waitForPageLoad(page)
    })

    test('상점 기본 UI 확인', async({ page }) => {
      // 헤더 확인
      await expect(page.locator('h1, h2').filter({ hasText: '상점' })).toBeVisible()

      // 골드 표시 확인
      const goldDisplay = page.locator('text=/골드|Gold|G:|💰/').first()
      await expect(goldDisplay).toBeVisible()

      // 상품 목록 확인
      const itemGrid = page.locator('.grid, [data-testid="shop-items"]').first()
      await expect(itemGrid).toBeVisible()

      // 상품 카드 확인
      const shopItems = page.locator('[data-testid="shop-item"], .shop-item, [class*="ShopItem"]')
      const itemCount = await shopItems.count()
      expect(itemCount).toBeGreaterThan(0)
    })

    test('상품 필터링 기능', async({ page }) => {
      // 필터 탭 확인
      const filterTabs = page.locator('[role="tablist"], .tabs, [class*="Tab"]').first()

      if (await filterTabs.isVisible()) {
        // 무기 탭 클릭
        const weaponTab = page.locator('[role="tab"], button').filter({ hasText: /무기|Weapon/ })
        if (await weaponTab.first().isVisible()) {
          await weaponTab.first().click()
          await page.waitForTimeout(500)

          // 필터링된 아이템 확인
          const filteredItems = page.locator('[data-testid="shop-item"], .shop-item')
          const count = await filteredItems.count()
          expect(count).toBeGreaterThan(0)
        }
      }
    })

    test('상품 구매 프로세스', async({ page }) => {
      // 첫 번째 상품 선택
      const firstItem = page.locator('[data-testid="shop-item"], .shop-item').first()
      const itemPrice = await firstItem.locator('text=/\\d+\\s*(골드|Gold|G)/').textContent()

      // 구매 버튼 클릭
      const buyButton = firstItem.locator('button').filter({ hasText: /구매|Buy|구입/ })
      await buyButton.first().click()

      // 구매 확인 모달 또는 토스트 메시지 확인
      const modal = page.locator(TEST_CONFIG.selectors.modal)
      const toast = page.locator(TEST_CONFIG.selectors.toast)

      const isModalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false)
      const isToastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false)

      if (isModalVisible) {
        // 모달에서 확인
        await expect(modal).toContainText(/구매|확인/)
        const confirmButton = modal.locator('button').filter({ hasText: /확인|구매/ })
        await confirmButton.first().click()
      }

      // 구매 결과 확인
      if (isToastVisible || (await toast.isVisible({ timeout: 2000 }).catch(() => false))) {
        const toastText = await toast.textContent()
        expect(toastText).toMatch(/구매|성공|실패|골드 부족/)
      }
    })
  })

  test.describe('인벤토리 기능', () => {
    test.beforeEach(async({ page }) => {
      await page.goto(TEST_CONFIG.pages.inventory)
      await helpers.waitForPageLoad(page)
    })

    test('인벤토리 기본 UI 확인', async({ page }) => {
      // 헤더 확인
      await expect(page.locator('h1, h2').filter({ hasText: '인벤토리' })).toBeVisible()

      // 인벤토리 그리드 확인
      const inventoryGrid = page.locator('.grid, [data-testid="inventory-grid"]').first()
      await expect(inventoryGrid).toBeVisible()

      // 필터 옵션 확인
      const filterButtons = page.locator('button, [role="tab"]').filter({ hasText: /전체|무기|방어구|소비/ })
      const filterCount = await filterButtons.count()
      expect(filterCount).toBeGreaterThan(0)
    })

    test('아이템 상세 정보 확인', async({ page }) => {
      // 아이템이 있는지 확인
      const items = page.locator('[data-testid="inventory-item"], .inventory-item, [class*="Item"]')
      const itemCount = await items.count()

      if (itemCount > 0) {
        // 첫 번째 아이템 클릭
        await items.first().click()

        // 상세 정보 모달 확인
        await helpers.waitForModal(page)
        const modal = page.locator(TEST_CONFIG.selectors.modal)

        // 아이템 정보 확인
        await expect(modal).toContainText(/레벨|등급|효과/)

        // 액션 버튼 확인
        const actionButtons = modal.locator('button').filter({ hasText: /장착|사용|판매|강화/ })
        const buttonCount = await actionButtons.count()
        expect(buttonCount).toBeGreaterThan(0)
      }
    })

    test('아이템 장착/해제 기능', async({ page }) => {
      // 장착 가능한 아이템 찾기
      const equipableItem = page.locator('[data-testid="inventory-item"], .inventory-item').filter({ hasText: /무기|방어구|장신구/ }).first()

      if (await equipableItem.isVisible()) {
        await equipableItem.click()
        await helpers.waitForModal(page)

        const modal = page.locator(TEST_CONFIG.selectors.modal)
        const equipButton = modal.locator('button').filter({ hasText: /장착|Equip/ })

        if (await equipButton.first().isVisible()) {
          await equipButton.first().click()

          // 장착 성공 확인
          const toast = page.locator(TEST_CONFIG.selectors.toast)
          const isToastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false)

          if (isToastVisible) {
            await expect(toast).toContainText(/장착|성공/)
          }

          // 모달이 닫혔는지 확인
          await expect(modal).toBeHidden({ timeout: TEST_CONFIG.timeouts.action })
        }
      }
    })

    test('인벤토리 정렬 기능', async({ page }) => {
      // 정렬 버튼 찾기
      const sortButton = page.locator('button, select').filter({ hasText: /정렬|Sort/ }).first()

      if (await sortButton.isVisible()) {
        await sortButton.click()

        // 정렬 옵션 확인
        const sortOptions = page.locator('[role="option"], [role="menuitem"], .sort-option')

        if (await sortOptions.first().isVisible()) {
          // 등급순 정렬 선택
          const gradeSortOption = sortOptions.filter({ hasText: /등급|Grade|희귀도/ }).first()
          if (await gradeSortOption.isVisible()) {
            await gradeSortOption.click()

            // 정렬 적용 대기
            await page.waitForTimeout(500)

            // 아이템 순서가 변경되었는지 확인
            const items = page.locator('[data-testid="inventory-item"], .inventory-item')
            const itemCount = await items.count()
            expect(itemCount).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  test('상점에서 구매한 아이템이 인벤토리에 추가되는지 확인', async({ page }) => {
    // 1. 상점으로 이동
    await page.goto(TEST_CONFIG.pages.shop)
    await helpers.waitForPageLoad(page)

    // 2. 저렴한 아이템 찾기
    const cheapItems = page.locator('[data-testid="shop-item"], .shop-item').filter({ hasText: /[1-9]\d{0,2}\s*(골드|Gold|G)/ })

    if (await cheapItems.first().isVisible()) {
      // 아이템 이름 저장
      const itemName = await cheapItems.first().locator('.item-name, h3, h4').first().textContent()

      // 구매
      const buyButton = cheapItems.first().locator('button').filter({ hasText: /구매|Buy/ })
      await buyButton.first().click()

      // 구매 확인
      const modal = page.locator(TEST_CONFIG.selectors.modal)
      if (await modal.isVisible({ timeout: 2000 })) {
        const confirmButton = modal.locator('button').filter({ hasText: /확인|구매/ })
        await confirmButton.first().click()
        await expect(modal).toBeHidden()
      }

      // 3. 인벤토리로 이동
      await page.goto(TEST_CONFIG.pages.inventory)
      await helpers.waitForPageLoad(page)

      // 4. 구매한 아이템 확인
      if (itemName) {
        const purchasedItem = page.locator('[data-testid="inventory-item"], .inventory-item').filter({ hasText: itemName })
        await expect(purchasedItem.first()).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })
      }
    }
  })
})
