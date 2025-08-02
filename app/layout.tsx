import type { Metadata } from 'next'
import { Inter, Noto_Sans_KR } from 'next/font/google'
import { AppProviders } from '@/contexts/AppProviders'
import { SystemProviders } from '@/contexts/SystemProviders'
import { AppLayout } from '@/components/AppLayout'
import { SkipLink } from '@/components/accessibility'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'
import '@/styles/animations.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr'
})

export const metadata: Metadata = {
  title: 'Life RPG - 성장 기록 플랫폼',
  description: '일상을 RPG 게임처럼 재미있게 만들어 지속가능한 성장을 돕는 플랫폼',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansKR.variable} font-sans`}>
        <ErrorBoundary>
          <SystemProviders>
            <ToastProvider>
              <AppProviders>
                <SkipLink />
                <AppLayout>
                  {children}
                </AppLayout>
              </AppProviders>
            </ToastProvider>
          </SystemProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
