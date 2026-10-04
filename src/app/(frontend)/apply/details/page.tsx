import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ApplyLayout } from '@/components/forms/ApplyLayout'
import { Step2Form, type Step2Values } from '@/components/forms/Step2Form'
import { canEditCompleted, getLeadFromCookie } from '@/lib/lead-session'
import { getApplyForm, getPayloadClient, getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Подбор группы — цель и расписание',
  robots: { index: false, follow: false },
}

export default async function ApplyDetailsPage() {
  const payload = await getPayloadClient()
  const lead = await getLeadFromCookie(payload)
  // Без сохранённого контакта шаг 2 не имеет смысла — сначала шаг 1.
  if (!lead || (lead.stage === 'complete' && !canEditCompleted(lead))) redirect('/apply')

  const [settings, applyForm] = await Promise.all([getSiteSettings(), getApplyForm()])

  // Заявка уже заполнена и открыта повторно — показываем ответы для правки.
  const initial: Partial<Step2Values> | undefined =
    lead.stage === 'complete'
      ? {
          childName: lead.childName ?? '',
          goal: lead.goal ?? undefined,
          goalOther: lead.goalOther ?? '',
          desiredResult: lead.desiredResult ?? '',
          difficulties: lead.difficulties ?? '',
          schedule: lead.schedule ?? [],
          scheduleComment: lead.scheduleComment ?? '',
          timezone: lead.timezone ?? undefined,
          personalRoute: lead.personalRoute ?? 'maybe',
          waitlist: Boolean(lead.waitlist),
        }
      : undefined

  return (
    <ApplyLayout settings={settings} applyForm={applyForm} step={2}>
      <p className="eyebrow">Подбор группы</p>
      <h1 className="apply-title">{applyForm.step2.heading}</h1>
      {applyForm.step2.lead && <p className="apply-lead">{applyForm.step2.lead}</p>}
      <p className="notice notice--success">
        <span aria-hidden="true">✓</span> Контакт сохранён, {lead.parentName}. Осталось несколько вопросов — они помогут
        предложить подходящую группу.
      </p>
      <Step2Form initial={initial} levelHint={lead.levelHint} submitLabel={applyForm.step2.submitLabel} />
    </ApplyLayout>
  )
}
