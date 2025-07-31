import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from '../test-config';

test.describe('접근성 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_CONFIG.pages.dashboard);
  });

  test('키보드 네비게이션', async ({ page }) => {
    // Tab 키로 포커스 이동 테스트
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // 주요 인터랙티브 요소들이 포커스 가능한지 확인
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          class: el?.className,
          text: el?.textContent?.substring(0, 50)
        };
      });
      
      console.log(`포커스된 요소: ${focusedElement.tag} - ${focusedElement.text}`);
    }
    
    // Enter 키로 버튼 클릭 가능한지 확인
    const firstButton = page.locator('button').first();
    await firstButton.focus();
    await page.keyboard.press('Enter');
    
    // 모달이 열렸는지 확인
    const modal = page.locator(TEST_CONFIG.selectors.modal);
    const isModalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isModalVisible) {
      // ESC 키로 모달 닫기
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
    }
  });

  test('스크린 리더 지원', async ({ page }) => {
    // ARIA 레이블 확인
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 5)) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaDescribedBy = await button.getAttribute('aria-describedby');
      const title = await button.getAttribute('title');
      const text = await button.textContent();
      
      // 버튼에 접근 가능한 이름이 있는지 확인
      const hasAccessibleName = ariaLabel || ariaDescribedBy || title || text?.trim();
      expect(hasAccessibleName).toBeTruthy();
    }
    
    // 랜드마크 역할 확인
    const landmarks = ['banner', 'navigation', 'main', 'contentinfo'];
    for (const landmark of landmarks) {
      const element = page.locator(`[role="${landmark}"]`);
      const count = await element.count();
      console.log(`${landmark} 랜드마크: ${count}개`);
    }
    
    // 헤딩 구조 확인
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const text = await heading.textContent();
      headingLevels.push({ level: tagName, text: text?.substring(0, 50) });
    }
    
    console.log('헤딩 구조:', headingLevels);
    
    // h1이 존재하는지 확인
    expect(headingLevels.some(h => h.level === 'H1')).toBeTruthy();
  });

  test('색상 대비', async ({ page }) => {
    // 텍스트 요소들의 색상 대비 확인
    const textElements = await page.locator('p, span, div, button, a').all();
    
    for (const element of textElements.slice(0, 10)) {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // 투명 배경이 아닌 경우에만 검사
      if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        console.log(`텍스트 색상: ${styles.color}, 배경색: ${styles.backgroundColor}`);
      }
    }
    
    // 포커스 표시가 명확한지 확인
    const firstButton = page.locator('button').first();
    await firstButton.focus();
    
    const focusStyles = await firstButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineColor: computed.outlineColor,
        boxShadow: computed.boxShadow
      };
    });
    
    // 포커스 표시가 있는지 확인
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' || 
      focusStyles.boxShadow !== 'none';
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('터치 타겟 크기', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    
    // 모든 클릭 가능한 요소 확인
    const clickableElements = await page.locator('button, a, input[type="checkbox"], input[type="radio"]').all();
    
    for (const element of clickableElements.slice(0, 10)) {
      const box = await element.boundingBox();
      if (box) {
        // WCAG 권장 최소 크기: 44x44 픽셀
        const isLargeEnough = box.width >= 44 && box.height >= 44;
        
        if (!isLargeEnough) {
          const text = await element.textContent();
          console.warn(`작은 터치 타겟: ${text?.substring(0, 30)} - ${box.width}x${box.height}px`);
        }
      }
    }
  });

  test('폼 접근성', async ({ page }) => {
    // 설정 페이지로 이동 (폼 요소가 있을 가능성이 높음)
    await page.goto(TEST_CONFIG.pages.settings);
    
    // 모든 입력 필드 확인
    const inputs = await page.locator('input, select, textarea').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      
      // 연관된 레이블 확인
      let hasLabel = false;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      // 접근 가능한 이름이 있는지 확인
      const hasAccessibleName = hasLabel || ariaLabel || ariaDescribedBy;
      
      if (!hasAccessibleName) {
        const type = await input.getAttribute('type');
        console.warn(`접근 가능한 레이블이 없는 입력 필드: ${type || 'text'} - ${name || 'unnamed'}`);
      }
    }
  });

  test('이미지 대체 텍스트', async ({ page }) => {
    const images = await page.locator('img').all();
    let missingAltCount = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      if (!alt && alt !== '') {
        missingAltCount++;
        console.warn(`대체 텍스트 누락: ${src}`);
      }
    }
    
    console.log(`총 이미지: ${images.length}개, 대체 텍스트 누락: ${missingAltCount}개`);
    
    // 대체 텍스트 누락률이 10% 미만이어야 함
    const missingRate = missingAltCount / images.length;
    expect(missingRate).toBeLessThan(0.1);
  });

  test('에러 메시지 접근성', async ({ page }) => {
    // 잘못된 입력으로 에러 유발
    await page.goto(TEST_CONFIG.pages.activities);
    
    // 빈 활동 제출 시도 (에러 유발)
    const submitButton = page.locator('button').filter({ hasText: /추가|제출|확인/ }).first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // 에러 메시지 확인
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"]').first();
      
      if (await errorMessage.isVisible({ timeout: 2000 })) {
        // 에러 메시지가 스크린 리더에 전달되는지 확인
        const role = await errorMessage.getAttribute('role');
        const ariaLive = await errorMessage.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive === 'assertive' || ariaLive === 'polite').toBeTruthy();
      }
    }
  });

  test('반응형 텍스트 크기', async ({ page }) => {
    // 텍스트 크기 확대 (200%)
    await page.addStyleTag({
      content: `
        html { font-size: 32px !important; }
        * { line-height: 1.5 !important; }
      `
    });
    
    await page.waitForTimeout(500);
    
    // 주요 콘텐츠가 여전히 읽을 수 있는지 확인
    const mainContent = page.locator('main, [role="main"]').first();
    const isVisible = await mainContent.isVisible();
    expect(isVisible).toBeTruthy();
    
    // 텍스트가 잘리지 않는지 확인
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflowing = [];
      
      for (const el of elements) {
        if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
          overflowing.push({
            tag: el.tagName,
            class: el.className,
            overflow: `${el.scrollWidth - el.clientWidth}x${el.scrollHeight - el.clientHeight}`
          });
        }
      }
      
      return overflowing.slice(0, 5);
    });
    
    if (overflowElements.length > 0) {
      console.log('오버플로우 요소:', overflowElements);
    }
  });

  test('모션 감소 지원', async ({ page }) => {
    // prefers-reduced-motion 설정
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // 애니메이션이 비활성화되었는지 확인
    const animatedElements = await page.locator('*').evaluateAll(elements => {
      return elements.filter(el => {
        const computed = window.getComputedStyle(el);
        return computed.animationDuration !== '0s' || 
               computed.transitionDuration !== '0s';
      }).map(el => ({
        tag: el.tagName,
        class: el.className,
        animation: window.getComputedStyle(el).animationDuration,
        transition: window.getComputedStyle(el).transitionDuration
      }));
    });
    
    console.log(`애니메이션이 있는 요소: ${animatedElements.length}개`);
    
    // 중요한 애니메이션은 유지되어야 하지만, 장식적 애니메이션은 제거되어야 함
    expect(animatedElements.length).toBeLessThan(10);
  });
});