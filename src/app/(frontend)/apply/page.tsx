import type { Metadata } from 'next'
import Link from 'next/link'

import { ApplyLayout } from '@/components/forms/ApplyLayout'
import { Step1Form, type Step1Initial } from '@/components/forms/Step1Form'
import { getLeadFromCookie } from '@/lib/lead-session'
import { getApplyForm, getLevels, getPayloadClient, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Подбор группы',
  robots: { index: false, follow: true },
  alternates: { canonical: '/apply' },
}

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams
  const payload = await getPayloadClient()
  const [settings, applyForm, levels, lead] = await Promise.all([
    getSiteSettings(),
    getApplyForm(),
    getLevels(),
    getLeadFromCookie(payload),
  ])

  // Если родитель уже оставлял контакт — подставляем его, чтобы не вводить заново.
  const initial: Step1Initial | undefined = lead
    ? { parentName: lead.parentName, contact: lead.contact, email: lead.email, grade: lead.stage === 'step1' ? lead.grade : undefined }
    : undefined

  const chosenLevel = levels.find((item) => item.slug === (level ?? lead?.levelHint))

  return (
    <ApplyLayout settings={settings} applyForm={applyForm} step={1}>
      <p className="eyebrow">Подбор группы</p>
      <h1 className="apply-title">{applyForm.step1.heading}</h1>
      {applyForm.step1.lead && <p className="apply-lead">{applyForm.step1.lead}</p>}
      {lead?.stage === 'complete' && (
        <p className="notice">
          Вы уже отправили заявку. Если хотите записать ещё одного ребёнка — заполните форму снова.{' '}
          <Link href="/success">Посмотреть отправленную заявку</Link>
        </p>
      )}
      {chosenLevel && (
        <p className="notice notice--accent">
          Вы смотрели уровень «{chosenLevel.title}». Это предположение — окончательно уровень подтвердит преподаватель.
        </p>
      )}
      <Step1Form
        location="apply"
        initial={initial}
        levelHint={chosenLevel?.slug}
        submitLabel={applyForm.step1.submitLabel}
        promise={applyForm.step1.promise}
      />
    </ApplyLayout>
  )
}
