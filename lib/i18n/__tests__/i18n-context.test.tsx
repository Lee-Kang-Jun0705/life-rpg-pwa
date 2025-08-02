import React from 'react'
import { render, act, renderHook } from '@testing-library/react'
import { I18nProvider, useI18n, formatDate, formatNumber, formatCurrency } from '../i18n-context'
import { ko, en } from '../locales'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
)

describe('i18n Context', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('기본 언어는 한국어여야 함', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.locale).toBe('ko')
    expect(result.current.t.common.dashboard).toBe('대시보드')
    expect(result.current.dir).toBe('ltr')
  })

  it('언어를 변경할 수 있어야 함', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    act(() => {
      result.current.setLocale('en')
    })

    expect(result.current.locale).toBe('en')
    expect(result.current.t.common.dashboard).toBe('Dashboard')
    expect(localStorage.setItem).toHaveBeenCalledWith('locale', 'en')
  })

  it('브라우저 언어 감지가 작동해야 함', () => {
    // localStorage를 비워서 저장된 언어 설정이 없게 함
    localStorage.getItem.mockReturnValue(null)

    // navigator.language를 영어로 설정
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true
    })

    const { result } = renderHook(() => useI18n(), { wrapper })

    // 초기 렌더링 시 브라우저 언어가 적용되어야 함
    expect(result.current.locale).toBe('en')
  })

  it('번역 키에 올바르게 접근할 수 있어야 함', () => {
    localStorage.getItem.mockReturnValue('ko')

    const { result } = renderHook(() => useI18n(), { wrapper })

    expect(result.current.t.common.dashboard).toBe('대시보드')
    expect(result.current.t.shop.title).toBe('상점')
    expect(result.current.t.character.gender.male).toBe('남성')
  })

  it('날짜 포맷팅이 올바르게 작동해야 함', () => {
    const testDate = new Date('2024-01-15')

    const koFormat = formatDate(testDate, 'ko')
    expect(koFormat).toContain('2024')
    expect(koFormat).toContain('1')
    expect(koFormat).toContain('15')

    const enFormat = formatDate(testDate, 'en')
    expect(enFormat).toContain('2024')
  })

  it('숫자 포맷팅이 올바르게 작동해야 함', () => {
    const number = 1234567.89

    const koFormat = formatNumber(number, 'ko')
    const enFormat = formatNumber(number, 'en')

    expect(koFormat).toBe('1,234,567.89')
    expect(enFormat).toBe('1,234,567.89')
  })

  it('통화 포맷팅이 올바르게 작동해야 함', () => {
    const amount = 1000

    const koFormat = formatCurrency(amount, 'ko', 'KRW')
    expect(koFormat).toContain('1,000')

    const enFormat = formatCurrency(amount, 'en', 'USD')
    expect(enFormat).toContain('1,000')
  })

  it('document.documentElement.lang이 업데이트되어야 함', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })

    act(() => {
      result.current.setLocale('en')
    })

    expect(document.documentElement.lang).toBe('en')

    act(() => {
      result.current.setLocale('ja')
    })

    expect(document.documentElement.lang).toBe('ja')
  })
})
