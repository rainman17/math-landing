import type { MetadataRoute } from 'next'

import { getPayloadClient } from '@/lib/payload'

const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()
  const legal = await payload.find({
    collection: 'legal-pages',
    where: { isDraft: { equals: false } },
    limit: 10,
    depth: 0,
  })
  return [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    ...legal.docs.map((doc) => ({
      url: `${siteUrl}/${doc.slug}`,
      lastModified: doc.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),
  ]
}
