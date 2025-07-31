'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n'

export function SkipLink() {
  const { t } = useI18n()

  return (
    <a
      href="#main-content"
      className="
        absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden
        focus:static focus:w-auto focus:h-auto focus:overflow-visible
        focus:fixed focus:top-4 focus:left-4 
        focus:z-[99999] focus:pointer-events-auto
        focus:bg-primary focus:text-primary-foreground
        focus:px-4 focus:py-2 focus:rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:transition-all focus:duration-200
        focus:shadow-lg focus:shadow-black/50
        focus:min-w-[200px] focus:text-center
        focus:font-semibold
      "
    >
      {t.accessibility.skipToContent}
    </a>
  )
}