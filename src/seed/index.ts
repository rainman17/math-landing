// Заполняет базу стартовым контентом.
//   npm run seed          — только пустые разделы (безопасно повторять)
//   npm run seed -- --force — перезаписать тексты главной, формы и настроек
import { getPayload } from 'payload'

import config from '../payload.config'
import { applyForm, faq, landing, legalDrafts, levels, siteSettings } from './content'

const force = process.argv.includes('--force')

const lexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    })),
  },
})

async function seed() {
  const payload = await getPayload({ config })
  const log = (message: string) => payload.logger.info(`[seed] ${message}`)

  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (force || !settings.seoTitle) {
    await payload.updateGlobal({ slug: 'site-settings', data: siteSettings })
    log('Настройки сайта')
  }

  const page = await payload.findGlobal({ slug: 'landing' })
  if (force || !page.hero?.title) {
    await payload.updateGlobal({ slug: 'landing', data: landing })
    log('Главная страница')
  }

  const form = await payload.findGlobal({ slug: 'apply-form' })
  if (force || !form.step1?.heading) {
    await payload.updateGlobal({ slug: 'apply-form', data: applyForm })
    log('Тексты формы')
  }

  for (const level of levels) {
    const existing = await payload.find({ collection: 'levels', where: { slug: { equals: level.slug } }, limit: 1 })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'levels', data: level })
      log(`Уровень «${level.title}»`)
    }
  }

  const faqCount = await payload.count({ collection: 'faq' })
  if (faqCount.totalDocs === 0) {
    for (const [index, item] of faq.entries()) {
      await payload.create({
        collection: 'faq',
        data: { question: item.question, answer: item.answer, sortOrder: (index + 1) * 10, published: item.published ?? true },
      })
    }
    log(`FAQ: ${faq.length} вопросов`)
  }

  for (const doc of legalDrafts) {
    const existing = await payload.find({ collection: 'legal-pages', where: { slug: { equals: doc.slug } }, limit: 1 })
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'legal-pages',
        data: { slug: doc.slug, title: doc.title, version: doc.version, isDraft: true, content: lexical(doc.paragraphs) },
      })
      log(`Черновик документа /${doc.slug}`)
    }
  }

  log('Готово')
  process.exit(0)
}

// Верхнеуровневый await: `payload run` завершает процесс сразу после импорта скрипта.
try {
  await seed()
} catch (error) {
  console.error(error)
  process.exit(1)
}
