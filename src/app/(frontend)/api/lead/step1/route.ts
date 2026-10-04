import { NextResponse } from 'next/server'

import { queueLeadDelivery } from '@/lib/jobs'
import {
  getLeadFromCookie,
  hashLeadToken,
  newLeadToken,
  setLeadCookie,
} from '@/lib/lead-session'
import { getLevels, getPayloadClient, getSiteSettings } from '@/lib/payload'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { fieldErrors, parseContact, step1MetaSchema, step1Schema } from '@/lib/validation'

const NEXT_STEP = '/apply/details'
const MIN_FILL_TIME_MS = 2000

const fail = (status: number, message: string) => NextResponse.json({ ok: false, message }, { status })

export async function POST(request: Request) {
  if (!rateLimit(`step1:${clientIp(request.headers)}`, 20, 10 * 60 * 1000)) {
    return fail(429, 'Слишком много попыток подряд. Попробуйте через несколько минут.')
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return fail(400, 'Не удалось прочитать данные формы.')
  }

  const meta = step1MetaSchema.safeParse(body)
  if (!meta.success) return fail(400, 'Обновите страницу и попробуйте ещё раз.')

  // Ловушки для ботов: скрытое поле заполнено или форма отправлена мгновенно.
  // Отвечаем как при успехе, но ничего не сохраняем.
  if (meta.data.website || meta.data.elapsedMs < MIN_FILL_TIME_MS) {
    return NextResponse.json({ ok: true, next: NEXT_STEP })
  }

  const parsed = step1Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 })
  }
  const data = parsed.data
  const contact = parseContact(data.contact)!

  try {
    const payload = await getPayloadClient()
    const token = newLeadToken()
    const tokenHash = hashLeadToken(token)

    // Повтор той же отправки (двойной клик, обрыв связи) находим по ключу операции —
    // это та же заявка, даже если ответ с cookie до браузера не дошёл.
    const repeated = await payload.find({
      collection: 'applications',
      where: { idempotencyKey: { equals: meta.data.idempotencyKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const [settings, levels, fromCookie] = await Promise.all([
      getSiteSettings(),
      getLevels(),
      getLeadFromCookie(payload),
    ])
    const current = repeated.docs[0] ?? fromCookie
    const levelHint = levels.some((level) => level.slug === data.levelHint) ? data.levelHint : undefined
    const now = new Date().toISOString()
    const consentVersion = settings.consentVersion || 'не указана'

    const fields = {
      parentName: data.parentName,
      contact: contact.value,
      contactType: contact.type,
      email: data.email.toLowerCase(),
      grade: data.grade,
      ...(levelHint ? { levelHint } : {}),
      consentPersonalData: { accepted: true, version: consentVersion, acceptedAt: now },
      consentMarketing: data.consentMarketing
        ? { accepted: true, version: consentVersion, acceptedAt: now }
        : { accepted: false, version: null, acceptedAt: null },
      resumeTokenHash: tokenHash,
    }

    if (current && current.stage === 'step1') {
      // Повтор или возврат на шаг 1 с правкой данных — обновляем ту же заявку.
      await payload.update({ collection: 'applications', id: current.id, data: fields, overrideAccess: true })
    } else if (repeated.docs[0]) {
      // Повтор отправки уже заполненной заявки: только восстанавливаем cookie.
      await payload.update({
        collection: 'applications',
        id: repeated.docs[0].id,
        data: { resumeTokenHash: tokenHash },
        overrideAccess: true,
      })
    } else {
      // Новая заявка. Если предыдущая уже заполнена — это заявка на ещё одного ребёнка.
      const { utm, referrer, landingPage } = meta.data.attribution ?? {}
      const created = await payload.create({
        collection: 'applications',
        overrideAccess: true,
        data: {
          ...fields,
          stage: 'step1',
          status: 'new',
          waitlist: false,
          idempotencyKey: meta.data.idempotencyKey,
          step1At: now,
          utm: utm ?? {},
          referrer: referrer || undefined,
          landingPage: landingPage || undefined,
          device: meta.data.device,
        },
      })
      await queueLeadDelivery(created.id, { webhook: 'lead.step1', teacher: 'incomplete' })
    }

    await setLeadCookie(token)
    return NextResponse.json({ ok: true, next: NEXT_STEP })
  } catch (error) {
    console.error('Ошибка сохранения шага 1 заявки', error)
    return fail(500, 'Не получилось сохранить заявку. Попробуйте ещё раз — введённые данные остались в форме.')
  }
}
