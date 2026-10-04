import type { Metadata } from 'next'

import {
  Community,
  Faq,
  FinalCta,
  Format,
  Hero,
  HowToJoin,
  Levels,
  Method,
  PersonalRoute,
  Problems,
  Teacher,
  Trust,
} from '@/components/landing/sections'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { StickyCta } from '@/components/layout/StickyCta'
import {
  getApplyForm,
  getFaq,
  getLanding,
  getLegalSlugs,
  getLevels,
  getSiteSettings,
  getTestimonials,
} from '@/lib/payload'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default async function HomePage() {
  const [settings, landing, applyForm, levels, faq, testimonials, legalSlugs] = await Promise.all([
    getSiteSettings(),
    getLanding(),
    getApplyForm(),
    getLevels(),
    getFaq(),
    getTestimonials(),
    getLegalSlugs(),
  ])

  // Пустая база (контент ещё не засеян) — показываем заглушку вместо ошибки.
  if (!landing.hero?.title || !settings.brandName) {
    return (
      <main id="main" className="apply-page">
        <div className="container legal-container">
          <h1 className="apply-title">Сайт настраивается</h1>
          <p className="apply-lead">Контент ещё не заполнен. Заполните разделы в админке или выполните npm run seed.</p>
        </div>
      </main>
    )
  }

  // Структурированные данные: курс, преподаватель и только видимые на странице вопросы.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: settings.courseName,
      description: settings.seoDescription,
      inLanguage: 'ru',
      url: siteUrl,
      provider: { '@type': 'Person', name: landing.teacher.name },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: 'PT1H',
        instructor: { '@type': 'Person', name: landing.teacher.name },
      },
      offers: levels.map((level) => ({
        '@type': 'Offer',
        category: level.title,
        price: level.price,
        priceCurrency: 'RUB',
        availability:
          level.enrollmentStatus === 'closed' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: landing.teacher.name,
      jobTitle: landing.teacher.role ?? undefined,
      description: landing.teacher.bio ?? undefined,
    },
    faq.length > 0 && {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ].filter(Boolean)

  return (
    <>
      <Header
        brandName={settings.brandName}
        telegramUrl={settings.telegramUrl}
        telegramLabel={settings.telegramLabel}
        showTeachers={Boolean(settings.showTeachersBlock)}
      />
      <main id="main">
        <Hero hero={landing.hero} showTestCta={Boolean(settings.showTestCta)} />
        <Problems data={landing.problems} />
        <Method data={landing.method} />
        <Levels data={landing.levels} levels={levels} />
        <Format data={landing.format} />
        <Teacher data={landing.teacher} />
        <PersonalRoute data={landing.personalRoute} levels={levels} />
        {settings.showTeachersBlock && <Community data={landing.community} />}
        <HowToJoin data={landing.howToJoin} />
        <Trust data={landing.trust} testimonials={testimonials} />
        <Faq data={landing.faq} items={faq} />
        <FinalCta data={landing.finalCta} settings={settings} submitLabel={applyForm.step1.submitLabel} />
      </main>
      <Footer settings={settings} legalSlugs={legalSlugs} />
      <StickyCta label={landing.hero.primaryCta} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </>
  )
}
