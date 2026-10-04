import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { getLegalPage, getLegalSlugs, getSiteSettings } from '@/lib/payload'

export async function legalMetadata(slug: string): Promise<Metadata> {
  const page = await getLegalPage(slug)
  return {
    title: page?.title ?? 'Документ',
    alternates: { canonical: `/${slug}` },
    robots: page?.isDraft ? { index: false, follow: true } : undefined,
  }
}

export async function LegalPage({ slug }: { slug: string }) {
  const [page, settings, legalSlugs] = await Promise.all([getLegalPage(slug), getSiteSettings(), getLegalSlugs()])
  if (!page) notFound()

  const effective = page.effectiveDate ? new Date(page.effectiveDate).toLocaleDateString('ru-RU') : null

  return (
    <>
      <Header
        variant="minimal"
        brandName={settings.brandName}
        telegramUrl={settings.telegramUrl}
        telegramLabel={settings.telegramLabel}
      />
      <main id="main" className="legal-page">
        <div className="container legal-container">
          {page.isDraft && (
            <p className="notice notice--warning" role="note">
              Документ на согласовании. Текст будет заменён утверждённой редакцией до запуска.
            </p>
          )}
          <h1 className="apply-title">{page.title}</h1>
          <p className="legal-meta">
            Редакция {page.version}
            {effective ? ` · действует с ${effective}` : ''}
          </p>
          <div className="prose">
            <RichText data={page.content} />
          </div>
        </div>
      </main>
      <Footer settings={settings} legalSlugs={legalSlugs} />
    </>
  )
}
