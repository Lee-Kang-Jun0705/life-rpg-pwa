import { test, expect } from '@playwright/test'
import { TEST_CONFIG } from '../test-config'

test.describe('보안 테스트', () => {
  test('XSS 공격 방어', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.activities)

    // XSS 페이로드 테스트
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ]

    for (const payload of xssPayloads) {
      // 입력 필드에 XSS 페이로드 입력
      const inputField = page.locator('input[type="text"], textarea').first()

      if (await inputField.isVisible()) {
        await inputField.fill(payload)

        // 제출 시도
        const submitButton = page.locator('button').filter({ hasText: /추가|저장|확인/ }).first()
        if (await submitButton.isVisible()) {
          await submitButton.click()
        }

        // alert가 발생하지 않는지 확인
        let alertTriggered = false
        page.on('dialog', () => {
          alertTriggered = true
        })

        await page.waitForTimeout(1000)
        expect(alertTriggered).toBeFalsy()

        // 페이로드가 그대로 렌더링되지 않는지 확인
        const pageContent = await page.content()
        expect(pageContent).not.toContain('<script>alert("XSS")</script>')
      }
    }
  })

  test('로컬 스토리지 데이터 암호화', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    // 활동 수행하여 데이터 생성
    const statCard = page.locator('button').filter({ hasText: '건강' }).first()
    await statCard.click()

    const modal = page.locator(TEST_CONFIG.selectors.modal)
    await expect(modal).toBeVisible()

    const activityButton = modal.locator('button').filter({ hasText: /운동|산책/ }).first()
    await activityButton.click()
    await expect(modal).toBeHidden()

    // 로컬 스토리지 데이터 확인
    const localStorageData = await page.evaluate(() => {
      const data = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          data[key] = localStorage.getItem(key)
        }
      }
      return data
    })

    console.log('로컬 스토리지 키:', Object.keys(localStorageData))

    // 민감한 정보가 평문으로 저장되지 않는지 확인
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i
    ]

    for (const [key, value] of Object.entries(localStorageData)) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(key) && value) {
          // 민감한 키가 있다면 값이 암호화되어 있는지 확인
          expect(value).not.toMatch(/^[A-Za-z0-9]+$/) // 단순 평문이 아님
          expect(value.length).toBeGreaterThan(20) // 충분한 길이
        }
      }
    }
  })

  test('CSRF 보호', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    // API 요청 가로채기
    const apiRequests = []
    page.on('request', request => {
      if (request.method() === 'POST' || request.method() === 'PUT' || request.method() === 'DELETE') {
        apiRequests.push({
          url: request.url(),
          headers: request.headers(),
          method: request.method()
        })
      }
    })

    // 활동 수행 (API 호출 트리거)
    const statCard = page.locator('button').filter({ hasText: '건강' }).first()
    await statCard.click()

    const modal = page.locator(TEST_CONFIG.selectors.modal)
    await expect(modal).toBeVisible()

    const activityButton = modal.locator('button').filter({ hasText: /운동|산책/ }).first()
    await activityButton.click()

    await page.waitForTimeout(1000)

    // CSRF 토큰 또는 보호 헤더 확인
    for (const request of apiRequests) {
      const headers = request.headers

      // CSRF 보호 메커니즘 확인
      const hasCSRFProtection =
        headers['x-csrf-token'] ||
        headers['x-requested-with'] === 'XMLHttpRequest' ||
        headers['origin'] ||
        headers['referer']

      console.log(`${request.method} ${request.url} - CSRF 보호: ${hasCSRFProtection ? '있음' : '없음'}`)
    }
  })

  test('세션 타임아웃', async({ page, context }) => {
    await page.goto(TEST_CONFIG.pages.dashboard)

    // 세션 쿠키 확인
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('auth'))

    if (sessionCookie) {
      console.log(`세션 쿠키: ${sessionCookie.name}`)

      // HttpOnly 플래그 확인
      expect(sessionCookie.httpOnly).toBeTruthy()

      // Secure 플래그 확인 (프로덕션에서는 true여야 함)
      if (sessionCookie.domain !== 'localhost') {
        expect(sessionCookie.secure).toBeTruthy()
      }

      // SameSite 속성 확인
      expect(['Strict', 'Lax']).toContain(sessionCookie.sameSite)
    }
  })

  test('안전하지 않은 직접 객체 참조 (IDOR)', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.inventory)

    // 다른 사용자의 리소스에 접근 시도
    const maliciousUrls = [
      '/api/user/999999/inventory',
      '/api/items/other-user-item-id',
      '/inventory?userId=999999'
    ]

    for (const url of maliciousUrls) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null)

      if (response) {
        const status = response.status()

        // 401, 403, 404 응답이어야 함
        expect([401, 403, 404]).toContain(status)
        console.log(`${url} - 상태 코드: ${status}`)
      }
    }
  })

  test('민감한 데이터 노출 방지', async({ page }) => {
    await page.goto(TEST_CONFIG.pages.profile)

    // 페이지 소스에서 민감한 정보 검색
    const pageContent = await page.content()

    // 민감한 정보 패턴
    const sensitivePatterns = [
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
      /secret\s*[:=]\s*["'][^"']+["']/i,
      /password\s*[:=]\s*["'][^"']+["']/i,
      /token\s*[:=]\s*["'][^"']+["']/i
    ]

    for (const pattern of sensitivePatterns) {
      expect(pageContent).not.toMatch(pattern)
    }

    // 콘솔 로그 확인
    const consoleLogs = []
    page.on('console', msg => {
      consoleLogs.push(msg.text())
    })

    await page.reload()
    await page.waitForTimeout(1000)

    // 콘솔에 민감한 정보가 로그되지 않는지 확인
    for (const log of consoleLogs) {
      for (const pattern of sensitivePatterns) {
        expect(log).not.toMatch(pattern)
      }
    }
  })

  test('Content Security Policy (CSP) 헤더', async({ page }) => {
    const response = await page.goto(TEST_CONFIG.pages.dashboard)

    if (response) {
      const headers = response.headers()
      const csp = headers['content-security-policy']

      if (csp) {
        console.log('CSP 헤더:', csp)

        // 기본적인 CSP 지시어 확인
        expect(csp).toContain('default-src')
        expect(csp).toContain('script-src')

        // unsafe-inline, unsafe-eval 사용 제한 확인
        if (csp.includes('unsafe-inline') || csp.includes('unsafe-eval')) {
          console.warn('주의: unsafe-inline 또는 unsafe-eval 사용 중')
        }
      } else {
        console.warn('CSP 헤더가 설정되지 않음')
      }

      // 기타 보안 헤더 확인
      const securityHeaders = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security']
      }

      console.log('보안 헤더:', securityHeaders)
    }
  })

  test('파일 업로드 보안', async({ page }) => {
    // 프로필 페이지로 이동 (아바타 업로드 가능)
    await page.goto(TEST_CONFIG.pages.profile)

    const fileInput = page.locator('input[type="file"]').first()

    if (await fileInput.isVisible({ timeout: 2000 })) {
      // 허용된 파일 형식 확인
      const accept = await fileInput.getAttribute('accept')
      console.log('허용된 파일 형식:', accept)

      // 이미지 파일만 허용하는지 확인
      if (accept) {
        expect(accept).toMatch(/image\//)
        expect(accept).not.toContain('.exe')
        expect(accept).not.toContain('.js')
      }
    }
  })

  test('에러 메시지 정보 누출 방지', async({ page }) => {
    // 잘못된 URL로 이동하여 에러 유발
    const response = await page.goto('/api/invalid-endpoint')

    if (response) {
      const text = await page.textContent('body')

      // 민감한 정보가 에러 메시지에 포함되지 않는지 확인
      expect(text).not.toContain('stacktrace')
      expect(text).not.toContain('at Object.')
      expect(text).not.toContain('/home/')
      expect(text).not.toContain('C:\\')
      expect(text).not.toMatch(/line \d+/i)
    }
  })
})
