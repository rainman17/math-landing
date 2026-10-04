import 'server-only'

import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import type { ApplyForm, Landing, SiteSetting } from '../payload-types'
import { applyForm as applyFormDefaults } from '../seed/content'

export const getPayloadClient = () => getPayload({ config })

// Контент читается при каждом запросе (страница динамическая), поэтому правка в админке
// видна сразу. React cache убирает повторные запросы в пределах одного рендера.

export const getSiteSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const getLanding = cache(async (): Promise<Landing> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'landing', depth: 1 })
})

// Форма заявки должна работать всегда: если тексты ещё не заполнены, берём стартовые.
export const getApplyForm = cache(async (): Promise<ApplyForm> => {
  const payload = await getPayloadClient()
  const doc = await payload.findGlobal({ slug: 'apply-form', depth: 0 })
  return {
    ...doc,
    step1: { ...applyFormDefaults.step1, ...withoutEmpty(doc.step1) },
    step2: { ...applyFormDefaults.step2, ...withoutEmpty(doc.step2) },
    success: { ...applyFormDefaults.success, ...withoutEmpty(doc.success) },
    nextSteps: doc.nextSteps?.length ? doc.nextSteps : applyFormDefaults.nextSteps,
  }
})

const withoutEmpty = <T extends object>(value?: T | null) =>
  Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '')) as Partial<T>

export const getLevels = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'levels',
    where: { published: { equals: true } },
    sort: 'sortOrder',
    limit: 20,
    depth: 0,
  })
  return docs
})

export const getFaq = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faq',
    where: { published: { equals: true } },
    sort: 'sortOrder',
    limit: 50,
    depth: 0,
  })
  return docs
})

export const getTestimonials = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'testimonials',
    where: { and: [{ published: { equals: true } }, { consentConfirmed: { equals: true } }] },
    sort: 'sortOrder',
    limit: 12,
    depth: 0,
  })
  return docs
})

export const getLegalPage = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'legal-pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export const getLegalSlugs = cache(async () => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'legal-pages', limit: 10, depth: 0, select: { slug: true } })
  return docs.map((doc) => doc.slug)
})
