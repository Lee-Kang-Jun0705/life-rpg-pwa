import { test, expect } from '@playwright/test'

test.describe('던전 전투 애니메이션 및 BGM 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 던전 페이지로 이동
    await page.goto('/dungeon')
    await page.waitForLoadState('networkidle')
  })

  test('전투 애니메이션이 표시되어야 함', async ({ page }) => {
    // 던전 선택 화면이 표시되는지 확인
    await expect(page.locator('h1:has-text("던전")')).toBeVisible()
    
    // 일반 던전 클릭
    await page.click('button:has-text("일반 던전")')
    
    // 전투 화면이 표시될 때까지 대기
    await page.waitForSelector('text=VS', { timeout: 10000 })
    
    // 캐릭터와 몬스터가 표시되는지 확인
    const characterEmoji = await page.locator('text=🦸‍♂️').first()
    await expect(characterEmoji).toBeVisible()
    
    // 몬스터 이모지가 표시되는지 확인 (여러 가능한 몬스터 중 하나)
    const monsterSection = await page.locator('.text-8xl').nth(1)
    await expect(monsterSection).toBeVisible()
    
    // 전투 로그가 표시되는지 확인
    await page.waitForSelector('.animate-fadeIn', { timeout: 5000 })
    
    // 애니메이션 클래스가 적용되는지 확인
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('.animate-shake, .animate-damage-float, .animate-hit-effect')
      return elements.length > 0
    }, { timeout: 10000 })
    
    // 데미지 숫자가 표시되는지 확인
    const damageNumber = await page.locator('.animate-damage-float').first()
    if (await damageNumber.isVisible()) {
      const damageText = await damageNumber.textContent()
      expect(damageText).toMatch(/^\d+!?$/)
    }
  })

  test('던전 BGM이 재생되어야 함', async ({ page, context }) => {
    // 오디오 재생 권한 부여
    await context.grantPermissions(['autoplay'])
    
    // 콘솔 메시지 수집
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(msg.text())
    })
    
    // 일반 던전 클릭
    await page.click('button:has-text("일반 던전")')
    
    // BGM 재생 로그 확인 (던전 BGM 1~5 중 하나)
    await page.waitForFunction(
      (messages) => messages.some((msg: string) => msg.includes('[SoundManager] Selected dungeon BGM: bgm_dungeon_')),
      consoleMessages,
      { timeout: 5000 }
    )
    
    // 실제 오디오 엘리먼트가 생성되었는지 확인
    const hasAudioElement = await page.evaluate(() => {
      const audioElements = document.querySelectorAll('audio')
      return audioElements.length > 0
    })
    expect(hasAudioElement).toBe(true)
  })

  test('전투 중 캐릭터와 몬스터 모션이 작동해야 함', async ({ page }) => {
    // 일반 던전 진입
    await page.click('button:has-text("일반 던전")')
    await page.waitForSelector('text=VS')
    
    // 전투가 시작될 때까지 대기
    await page.waitForSelector('.animate-fadeIn')
    
    // 캐릭터 공격 모션 확인
    const characterDiv = await page.locator('.text-8xl:has-text("🦸‍♂️")').locator('..')
    
    // 애니메이션 클래스가 추가되는지 확인
    await page.waitForFunction(
      (el) => {
        if (!el) return false
        const classes = el.className
        return classes.includes('translate-x-4') || classes.includes('animate-shake')
      },
      await characterDiv.elementHandle(),
      { timeout: 10000 }
    )
    
    // 타격 이펙트 확인
    const hitEffect = await page.locator('.animate-hit-effect')
    await expect(hitEffect).toBeVisible({ timeout: 10000 })
    
    // 이펙트 아이콘 확인 (⚔️ 또는 💥)
    const effectIcon = await hitEffect.locator('.text-6xl, .text-8xl')
    await expect(effectIcon).toBeVisible()
  })

  test('데미지 표시 애니메이션이 작동해야 함', async ({ page }) => {
    // 일반 던전 진입
    await page.click('button:has-text("일반 던전")')
    await page.waitForSelector('text=VS')
    
    // 데미지 표시 대기
    const damageDisplay = await page.locator('.animate-damage-float')
    await expect(damageDisplay).toBeVisible({ timeout: 10000 })
    
    // 데미지 숫자 확인
    const damageText = await damageDisplay.textContent()
    expect(parseInt(damageText || '0')).toBeGreaterThan(0)
    
    // 크리티컬 데미지인 경우 느낌표 확인
    if (damageText?.includes('!')) {
      await expect(damageDisplay).toHaveClass(/text-yellow-400/)
    } else {
      await expect(damageDisplay).toHaveClass(/text-red-400/)
    }
  })

  test('일시정지 기능이 작동해야 함', async ({ page }) => {
    // 일반 던전 진입
    await page.click('button:has-text("일반 던전")')
    await page.waitForSelector('text=VS')
    
    // 일시정지 버튼 클릭
    await page.click('button:has-text("일시정지")')
    
    // 일시정지 메시지 확인
    await expect(page.locator('text=전투 일시정지')).toBeVisible()
    
    // 재개 버튼 확인
    await expect(page.locator('button:has-text("재개")')).toBeVisible()
    
    // 재개 클릭
    await page.click('button:has-text("재개")')
    
    // 전투가 재개되었는지 확인
    await expect(page.locator('text=VS')).toBeVisible()
    await expect(page.locator('text=전투 일시정지')).not.toBeVisible()
  })
})