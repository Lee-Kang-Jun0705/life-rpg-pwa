import { Page, ConsoleMessage } from '@playwright/test'

// CLAUDE.md 규칙 준수: 하드코딩 금지, 상수로 관리
export const TEST_TIMEOUTS = {
  NAVIGATION: 3000,
  ANIMATION: 500,
  API_CALL: 5000,
  PAGE_LOAD: 10000
} as const

export const PERFORMANCE_THRESHOLDS = {
  MAX_PAGE_LOAD_TIME: 3000, // 3초
  MAX_INTERACTION_TIME: 1000, // 1초
  MAX_ANIMATION_TIME: 300 // 300ms
} as const

export const CONSOLE_ERROR_PATTERNS = {
  IGNORED: [
    'ResizeObserver loop limit exceeded', // 브라우저 관련 경고, 무시 가능
    'Non-Error promise rejection captured' // Next.js 개발 모드 경고
  ]
} as const

// 콘솔 에러 수집기
export class ConsoleErrorCollector {
  private errors: ConsoleMessage[] = []
  private warnings: ConsoleMessage[] = []

  handleConsoleMessage(msg: ConsoleMessage): void {
    const text = msg.text()
    
    // 무시할 패턴 체크
    const shouldIgnore = CONSOLE_ERROR_PATTERNS.IGNORED.some(pattern => 
      text.includes(pattern)
    )
    
    if (shouldIgnore) return

    if (msg.type() === 'error') {
      this.errors.push(msg)
    } else if (msg.type() === 'warning') {
      this.warnings.push(msg)
    }
  }

  getErrors(): ConsoleMessage[] {
    return this.errors
  }

  getWarnings(): ConsoleMessage[] {
    return this.warnings
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  clear(): void {
    this.errors = []
    this.warnings = []
  }
}

// 성능 측정 도구
export class PerformanceMonitor {
  private measurements: Map<string, number> = new Map()

  async measureNavigation(page: Page, action: () => Promise<void>, label: string): Promise<number> {
    const startTime = Date.now()
    await action()
    const endTime = Date.now()
    const duration = endTime - startTime
    
    this.measurements.set(label, duration)
    return duration
  }

  async measurePageLoad(page: Page, url: string): Promise<number> {
    const startTime = Date.now()
    await page.goto(url, { waitUntil: 'networkidle' })
    const endTime = Date.now()
    
    const duration = endTime - startTime
    this.measurements.set(`pageLoad:${url}`, duration)
    return duration
  }

  getMeasurements(): Map<string, number> {
    return this.measurements
  }

  isWithinThreshold(duration: number, threshold: number): boolean {
    return duration <= threshold
  }
}

// 스크린샷 도구
export class ScreenshotManager {
  private screenshotCount = 0

  async captureFullPage(page: Page, name: string): Promise<string> {
    this.screenshotCount++
    const filename = `screenshots/${this.screenshotCount}-${name}.png`
    await page.screenshot({ 
      path: filename, 
      fullPage: true 
    })
    return filename
  }

  async captureElement(page: Page, selector: string, name: string): Promise<string> {
    this.screenshotCount++
    const filename = `screenshots/${this.screenshotCount}-${name}-element.png`
    const element = await page.locator(selector)
    await element.screenshot({ path: filename })
    return filename
  }

  async captureWithConsole(page: Page, name: string): Promise<string> {
    // 개발자 도구 열기
    await page.keyboard.press('F12')
    await page.waitForTimeout(500)
    
    const filename = await this.captureFullPage(page, `${name}-with-console`)
    
    // 개발자 도구 닫기
    await page.keyboard.press('F12')
    await page.waitForTimeout(500)
    
    return filename
  }
}

// 네비게이션 헬퍼
export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: TEST_TIMEOUTS.PAGE_LOAD 
  })
}

// 요소 대기 헬퍼
export async function waitForElementAndClick(
  page: Page, 
  selector: string, 
  options?: { timeout?: number }
): Promise<void> {
  const element = page.locator(selector)
  await element.waitFor({ 
    state: 'visible', 
    timeout: options?.timeout || TEST_TIMEOUTS.NAVIGATION 
  })
  await element.click()
}

// 텍스트 확인 헬퍼
export async function expectTextContent(
  page: Page, 
  selector: string, 
  expectedText: string | RegExp
): Promise<void> {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible' })
  
  if (typeof expectedText === 'string') {
    await expect(element).toContainText(expectedText)
  } else {
    await expect(element).toContainText(expectedText)
  }
}

// 이것도 추가하겠습니다
import { expect } from '@playwright/test'

// 메뉴 네비게이션 헬퍼
export async function navigateToMenu(page: Page, menuText: string): Promise<void> {
  // 먼저 모바일 메뉴 버튼이 있는지 확인
  const mobileMenuButton = page.locator('[class*="menu"], [class*="hamburger"], button:has(svg.lucide-menu)').first()
  const isMenuOpen = await page.locator(`text="${menuText}"`).isVisible({ timeout: 1000 }).catch(() => false)
  
  // 메뉴가 보이지 않고 모바일 메뉴 버튼이 있으면 클릭
  if (!isMenuOpen && await mobileMenuButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await mobileMenuButton.click({ force: true }) // Next.js 오버레이 무시
    await page.waitForTimeout(500) // 메뉴 애니메이션 대기
  }
  
  // 여러 가능한 선택자 시도
  const menuSelectors = [
    `text="${menuText}"`,
    `a:has-text("${menuText}")`,
    `button:has-text("${menuText}")`,
    `[aria-label="${menuText}"]`,
    `nav >> text="${menuText}"`,
    `aside >> text="${menuText}"`,
    `div[role="navigation"] >> text="${menuText}"`
  ]
  
  let menuButton = null
  for (const selector of menuSelectors) {
    const element = page.locator(selector).first()
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      menuButton = element
      break
    }
  }
  
  if (!menuButton) {
    throw new Error(`메뉴 "${menuText}"를 찾을 수 없습니다`)
  }
  
  await menuButton.click({ force: true }) // Next.js 오버레이 무시
  await page.waitForLoadState('networkidle')
}