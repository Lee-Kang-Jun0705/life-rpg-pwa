'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, translations, Translations } from './locales'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
  dir: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  // 초기 로케일 로드
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale)
      document.documentElement.lang = savedLocale
    } else {
      // 브라우저 언어 감지
      const browserLang = navigator.language.split('-')[0]
      if (browserLang in translations) {
        setLocaleState(browserLang as Locale)
        document.documentElement.lang = browserLang
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }

  // RTL 언어 지원 (아랍어, 히브리어 등 추가 시)
  const dir = 'ltr' // 현재는 RTL 언어를 지원하지 않음

  useEffect(() => {
    document.documentElement.dir = dir
  }, [dir])

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
    dir
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n은 I18nProvider 내에서 사용되어야 합니다')
  }
  return context
}

// 날짜 포맷팅 헬퍼
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// 숫자 포맷팅 헬퍼
export function formatNumber(number: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(number)
}

// 통화 포맷팅 헬퍼
export function formatCurrency(amount: number, locale: Locale, currency = 'KRW'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}