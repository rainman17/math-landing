import type { Metadata, Viewport } from 'next'
import { Golos_Text } from 'next/font/google'
import type { ReactNode } from 'react'

import { Analytics } from '@/components/analytics/Analytics'
import { getSiteSettings } from '@/lib/payload'

import './styles.css'

const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
})

// Контент редактируется в админке — страницы собираются при каждом запросе,
// чтобы правки цен и статусов были видны сразу.
export const dynamic = 'force-dynamic'

const siteUrl = process.env.SITE_URL || 'http://localhost:3000'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const ogImage = typeof settings.ogImage === 'object' && settings.ogImage?.url ? settings.ogImage.url : undefined
  const brand = settings.brandName || 'Мысли как математик'
  const title = settings.seoTitle || brand
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${brand}` },
    description: settings.seoDescription,
    applicationName: brand,
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: brand,
      title,
      description: settings.seoDescription,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#fbf8f3',
  width: 'device-width',
  initialScale: 1,
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <html lang="ru" className={golos.variable}>
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержанию
        </a>
        {children}
        <Analytics counterId={settings.yandexMetrikaId} requireConsent={settings.requireCookieConsent ?? true} />
      </body>
    </html>
  )
}
