import type { MetadataRoute } from 'next'

// Адрес сайта берётся при запросе, а не при сборке: один образ для staging и production.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/apply/details', '/success'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
