import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildTeacherMessage, buildWebhookBody, sendWebhook } from '@/lib/notify'
import type { Application } from '@/payload-types'

const lead = {
  id: 42,
  status: 'new',
  stage: 'complete',
  waitlist: false,
  parentName: 'Анна <script>',
  grade: 7,
  contact: '@anna_parent',
  contactType: 'telegram',
  email: 'anna@mail.ru',
  levelHint: 'school',
  childName: 'Миша',
  goal: 'understand',
  schedule: ['weekday_afternoon', 'weekend'],
  timezone: 'Europe/Moscow',
  personalRoute: 'yes',
  consentPersonalData: { accepted: true, version: '1.0', acceptedAt: '2026-10-04T10:00:00.000Z' },
  consentMarketing: { accepted: false },
  utm: { source: 'yandex', campaign: 'autumn' },
  updatedAt: '2026-10-04T10:00:00.000Z',
  createdAt: '2026-10-04T10:00:00.000Z',
} as Application

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('buildTeacherMessage', () => {
  it('по умолчанию не включает контакты и имя ребёнка', () => {
    const text = buildTeacherMessage(lead, 'completed')
    expect(text).toContain('Новая заявка')
    expect(text).toContain('Класс: 7')
    expect(text).toContain('Понять школьную алгебру')
    expect(text).toContain('Будни после школы, Выходные')
    expect(text).toContain('/admin/collections/applications/42')
    expect(text).not.toContain('@anna_parent')
    expect(text).not.toContain('anna@mail.ru')
    expect(text).not.toContain('Миша')
  })

  it('добавляет контакты, если это явно включено, и экранирует HTML', () => {
    vi.stubEnv('TELEGRAM_INCLUDE_CONTACTS', 'true')
    const text = buildTeacherMessage(lead, 'completed')
    expect(text).toContain('@anna_parent')
    expect(text).toContain('Анна &lt;script&gt;')
    expect(text).not.toContain('<script>')
  })

  it('отмечает лист ожидания и незавершённую заявку', () => {
    expect(buildTeacherMessage({ ...lead, waitlist: true }, 'completed')).toContain('лист ожидания')
    const incomplete = buildTeacherMessage({ ...lead, stage: 'step1' }, 'incomplete')
    expect(incomplete).toContain('Незавершённая заявка')
    expect(incomplete).not.toContain('Цель:')
  })
})

describe('webhook', () => {
  it('отдаёт плоскую запись с lead_id для обновления строки', () => {
    const body = buildWebhookBody(lead, 'lead.completed')
    expect(body).toMatchObject({
      event: 'lead.completed',
      lead_id: 42,
      stage: 'complete',
      grade: 7,
      goal: 'understand',
      schedule: 'Будни после школы, Выходные',
      consent_personal_data: true,
      consent_version: '1.0',
      utm_source: 'yandex',
    })
  })

  it('подписывает тело HMAC-SHA256 и падает на не-2xx ответе', async () => {
    vi.stubEnv('LEADS_WEBHOOK_URL', 'https://crm.example/hook')
    vi.stubEnv('LEADS_WEBHOOK_SECRET', 'secret')
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))

    const body = buildWebhookBody(lead, 'lead.step1')
    await sendWebhook(body, 'job-1')

    const [, init] = fetchMock.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    const expected = crypto.createHmac('sha256', 'secret').update(String(init?.body)).digest('hex')
    expect(headers['x-mkm-signature']).toBe(`sha256=${expected}`)
    expect(headers['x-mkm-event']).toBe('lead.step1')

    await expect(sendWebhook(body, 'job-2')).rejects.toThrow('502')
  })

  it('без адреса webhook ничего не отправляет', async () => {
    vi.stubEnv('LEADS_WEBHOOK_URL', '')
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    await sendWebhook(buildWebhookBody(lead, 'lead.step1'), 'job-3')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
