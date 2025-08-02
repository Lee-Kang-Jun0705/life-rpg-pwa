import { test, expect } from '@playwright/test'
import { TEST_CONFIG, helpers } from '../test-config'

test.describe('스킬 시스템 통합 테스트', () => {
  test.beforeEach(async({ page }) => {
    await page.goto(TEST_CONFIG.pages.skills)
    await helpers.waitForPageLoad(page)
  })

  test('스킬 페이지 기본 UI 확인', async({ page }) => {
    // 헤더 확인
    await expect(page.locator('h1, h2').filter({ hasText: '스킬' })).toBeVisible()

    // 스킬 포인트 표시 확인
    const skillPoints = page.locator('text=/스킬 포인트|SP:|포인트:\\s*\\d+/')
    await expect(skillPoints.first()).toBeVisible()

    // 스킬 트리 또는 스킬 목록 확인
    const skillContainer = page.locator('[data-testid="skill-tree"], .skill-tree, [class*="SkillTree"], .skill-list').first()
    await expect(skillContainer).toBeVisible()
  })

  test('스킬 카테고리 탭 전환', async({ page }) => {
    // 탭 컨테이너 찾기
    const tabContainer = page.locator('[role="tablist"], .tabs').first()

    if (await tabContainer.isVisible()) {
      const tabs = tabContainer.locator('[role="tab"], button')
      const tabCount = await tabs.count()

      // 각 탭 클릭 테스트
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i)
        const tabText = await tab.textContent()

        await test.step(`${tabText} 탭 클릭`, async() => {
          await tab.click()

          // 탭 활성화 확인
          await expect(tab).toHaveAttribute('aria-selected', 'true')
            .catch(() => expect(tab).toHaveClass(/active|selected/))

          // 해당 카테고리의 스킬이 표시되는지 확인
          await page.waitForTimeout(300)
          const skills = page.locator('[data-testid="skill-item"], .skill-item, [class*="Skill"]')
          const skillCount = await skills.count()
          expect(skillCount).toBeGreaterThan(0)
        })
      }
    }
  })

  test('스킬 상세 정보 확인', async({ page }) => {
    // 첫 번째 스킬 찾기
    const firstSkill = page.locator('[data-testid="skill-item"], .skill-item, [class*="Skill"]').first()
    await expect(firstSkill).toBeVisible()

    // 스킬 클릭
    await firstSkill.click()

    // 상세 정보 표시 확인 (모달 또는 사이드 패널)
    const detailContainer = page.locator('[data-testid="skill-detail"], .skill-detail, [class*="SkillDetail"], ' + TEST_CONFIG.selectors.modal)
    await expect(detailContainer.first()).toBeVisible({ timeout: TEST_CONFIG.timeouts.action })

    // 스킬 정보 요소 확인
    await expect(detailContainer.first()).toContainText(/레벨|Lv\.|Level/)
    await expect(detailContainer.first()).toContainText(/효과|Effect|설명/)

    // 스킬 레벨업 버튼 확인
    const levelUpButton = detailContainer.first().locator('button').filter({ hasText: /레벨업|학습|배우기|Upgrade/ })
    await expect(levelUpButton.first()).toBeVisible()
  })

  test('스킬 학습/레벨업 프로세스', async({ page }) => {
    // 스킬 포인트 확인
    const skillPointText = await page.locator('text=/스킬 포인트|SP:|포인트:\\s*\\d+/').first().textContent()
    const initialPoints = parseInt(skillPointText?.match(/\d+/)?.[0] || '0')

    if (initialPoints > 0) {
      // 학습 가능한 스킬 찾기
      const learnableSkill = page.locator('[data-testid="skill-item"], .skill-item').filter({ has: page.locator('button:not(:disabled)') }).first()

      if (await learnableSkill.isVisible()) {
        await learnableSkill.click()

        // 상세 정보 대기
        const detailContainer = page.locator('[data-testid="skill-detail"], .skill-detail, ' + TEST_CONFIG.selectors.modal).first()
        await expect(detailContainer).toBeVisible()

        // 레벨업 버튼 클릭
        const levelUpButton = detailContainer.locator('button').filter({ hasText: /레벨업|학습|배우기/ }).first()
        await levelUpButton.click()

        // 성공 메시지 확인
        const toast = page.locator(TEST_CONFIG.selectors.toast)
        const modal = page.locator(TEST_CONFIG.selectors.modal)

        const isToastVisible = await toast.isVisible({ timeout: 2000 }).catch(() => false)
        const isModalVisible = await modal.filter({ hasText: /성공|완료/ }).isVisible({ timeout: 2000 }).catch(() => false)

        expect(isToastVisible || isModalVisible).toBeTruthy()

        // 스킬 포인트 감소 확인
        await page.waitForTimeout(500)
        const updatedPointText = await page.locator('text=/스킬 포인트|SP:|포인트:\\s*\\d+/').first().textContent()
        const updatedPoints = parseInt(updatedPointText?.match(/\d+/)?.[0] || '0')
        expect(updatedPoints).toBeLessThan(initialPoints)
      }
    }
  })

  test('스킬 퀵슬롯 기능', async({ page }) => {
    // 퀵슬롯 영역 찾기
    const quickSlots = page.locator('[data-testid="quick-slots"], .quick-slots, [class*="QuickSlot"]').first()

    if (await quickSlots.isVisible()) {
      // 빈 슬롯 확인
      const emptySlot = quickSlots.locator('.slot, [data-testid="quick-slot"]').filter({ hasText: /비어있음|Empty|^\s*$/ }).first()

      if (await emptySlot.isVisible()) {
        // 스킬을 퀵슬롯에 드래그 앤 드롭 시뮬레이션
        const skill = page.locator('[data-testid="skill-item"], .skill-item').first()

        // 드래그 앤 드롭 대신 클릭으로 등록하는 UI인 경우
        await skill.click()
        const assignButton = page.locator('button').filter({ hasText: /퀵슬롯|등록|Assign/ }).first()

        if (await assignButton.isVisible()) {
          await assignButton.click()

          // 슬롯 선택
          await emptySlot.click()

          // 등록 확인
          await page.waitForTimeout(500)
          await expect(emptySlot).not.toContainText(/비어있음|Empty/)
        }
      }
    }
  })

  test('스킬 검색 기능', async({ page }) => {
    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"], input[placeholder*="Search"]').first()

    if (await searchInput.isVisible()) {
      // 검색어 입력
      await searchInput.fill('공격')
      await page.waitForTimeout(500)

      // 검색 결과 확인
      const skills = page.locator('[data-testid="skill-item"], .skill-item')
      const visibleSkills = await skills.count()

      // 검색 결과가 필터링되었는지 확인
      if (visibleSkills > 0) {
        const firstSkillText = await skills.first().textContent()
        expect(firstSkillText?.toLowerCase()).toMatch(/공격|attack|damage/)
      }

      // 검색 초기화
      await searchInput.clear()
      await page.waitForTimeout(500)
    }
  })

  test('스킬 툴팁 표시', async({ page }) => {
    // 스킬에 호버
    const skill = page.locator('[data-testid="skill-item"], .skill-item').first()
    await skill.hover()

    // 툴팁 확인
    const tooltip = page.locator('[role="tooltip"], .tooltip, [class*="Tooltip"]')
    const isTooltipVisible = await tooltip.isVisible({ timeout: 2000 }).catch(() => false)

    if (isTooltipVisible) {
      // 툴팁 내용 확인
      await expect(tooltip).toContainText(/효과|데미지|쿨다운/)
    }
  })

  test('모바일에서 스킬 UI 확인', async({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await helpers.waitForPageLoad(page)

    // 스킬 그리드가 적절히 조정되었는지 확인
    const skillGrid = page.locator('.grid-cols-2, .grid-cols-3').first()
    await expect(skillGrid).toBeVisible()

    // 터치 타겟 크기 확인
    const skillItem = page.locator('[data-testid="skill-item"], .skill-item').first()
    const box = await skillItem.boundingBox()

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(100)
      expect(box.height).toBeGreaterThanOrEqual(100)
    }
  })
})
