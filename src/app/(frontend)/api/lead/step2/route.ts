import { NextResponse } from 'next/server'

import { queueLeadDelivery } from '@/lib/jobs'
import { canEditCompleted, getLeadFromCookie } from '@/lib/lead-session'
import { getPayloadClient } from '@/lib/payload'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { fieldErrors, step2Schema } from '@/lib/validation'

const fail = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, message, ...extra }, { status })

export async function POST(request: Request) {
  if (!rateLimit(`step2:${clientIp(request.headers)}`, 30, 10 * 60 * 1000)) {
    return fail(429, 'Слишком много попыток подряд. Попробуйте через несколько минут.')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail(400, 'Не удалось прочитать данные формы.')
  }

  const parsed = step2Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 })
  }

  try {
    const payload = await getPayloadClient()
    const lead = await getLeadFromCookie(payload)
    if (!lead || (lead.stage === 'complete' && !canEditCompleted(lead))) {
      return fail(409, 'Сессия заявки истекла. Оставьте контакт ещё раз — это займёт полминуты.', {
        next: '/apply',
      })
    }

    const data = parsed.data
    const wasComplete = lead.stage === 'complete'
    await payload.update({
      collection: 'applications',
      id: lead.id,
      overrideAccess: true,
      data: {
        childName: data.childName || null,
        goal: data.goal,
        goalOther: data.goal === 'other' ? data.goalOther : null,
        desiredResult: data.desiredResult || null,
        difficulties: data.difficulties || null,
        schedule: data.schedule,
        scheduleComment: data.scheduleComment || null,
        timezone: data.timezone,
        personalRoute: data.personalRoute,
        waitlist: data.waitlist,
        stage: 'complete',
        completedAt: wasComplete ? lead.completedAt : new Date().toISOString(),
      },
    })

    await queueLeadDelivery(
      lead.id,
      wasComplete ? { webhook: 'lead.updated' } : { webhook: 'lead.completed', teacher: 'completed' },
    )
    return NextResponse.json({ ok: true, next: '/success' })
  } catch (error) {
    console.error('Ошибка сохранения шага 2 заявки', error)
    return fail(500, 'Не получилось отправить заявку. Попробуйте ещё раз — ответы остались в форме.')
  }
}
